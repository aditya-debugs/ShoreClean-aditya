// ChatCommunity.jsx — Role-aware group chat for ShoreClean
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Smile,
  Paperclip,
  Settings,
  ChevronRight,
  RefreshCw,
  Calendar,
  Users,
  MessageCircle,
  Info,
  X,
} from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import { chatAPI, groupsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MessageBubble from "../components/MessageBubble";
import TypingIndicator from "../components/TypingIndicator";
import GroupManagement from "../components/GroupManagement";

// ─── helpers ───────────────────────────────────────────────────────────────

const GROUP_ICONS = {
  announcements: "📢",
  general: "💬",
  certificates: "🏆",
  event: "🏖️",
  custom: "💬",
};

const GROUP_LABELS = {
  announcements: "Announcements",
  general: "Community Chat",
  certificates: "Certificates",
  event: "Event Chat",
  custom: "Discussion",
};

const groupIcon = (type) => GROUP_ICONS[type] ?? "💬";
const groupLabel = (type) => GROUP_LABELS[type] ?? "Discussion";

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const formatDate = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const byDate = (msgs) => {
  const map = {};
  msgs.forEach((m) => {
    const k = new Date(m.timestamp).toDateString();
    (map[k] = map[k] ?? []).push(m);
  });
  return map;
};

const getOrgLabel = (orgId) => {
  if (!orgId) return "";
  if (typeof orgId === "object") return orgId.orgName || orgId.name || "";
  return "";
};

// ─── GroupCard ─────────────────────────────────────────────────────────────

const GroupCard = ({ group, isSelected, onSelect, showOrg }) => {
  const orgLabel = showOrg ? getOrgLabel(group.orgId) : null;

  return (
    <button
      onClick={() => onSelect(group)}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all group ${
        isSelected
          ? "bg-blue-50 border-blue-300 shadow-sm"
          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: group.color || "#3B82F6" }}
        >
          {group.icon || groupIcon(group.type)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 truncate text-sm">{group.name}</h4>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2 group-hover:text-gray-600 transition-colors" />
          </div>

          {group.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{group.description}</p>
          )}

          <div className="flex items-center mt-1.5 gap-2 flex-wrap">
            <span className="text-xs text-gray-400">
              {group.memberCount ?? group.members?.length ?? 0} members
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: group.settings?.isPublic ? "#d1fae5" : "#f3f4f6",
                color: group.settings?.isPublic ? "#065f46" : "#6b7280",
              }}
            >
              {group.settings?.isPublic ? "Public" : "Private"}
            </span>
            {orgLabel && (
              <span className="text-xs text-blue-500 truncate">• {orgLabel}</span>
            )}
            {group.type === "event" && group.eventId?.title && (
              <span className="text-xs text-emerald-600 truncate">
                📅 {group.eventId.title}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// ─── GroupSection ───────────────────────────────────────────────────────────

const GroupSection = ({ title, icon, groups, selected, onSelect, showOrg, emptyNote }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h3>
      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
        {groups.length}
      </span>
    </div>

    {groups.length === 0 ? (
      <p className="text-sm text-gray-400 italic pl-1">{emptyNote}</p>
    ) : (
      <div className="space-y-2">
        {groups.map((g) => (
          <GroupCard
            key={g._id}
            group={g}
            isSelected={selected?._id === g._id}
            onSelect={onSelect}
            showOrg={showOrg}
          />
        ))}
      </div>
    )}
  </div>
);

// ─── ChatCommunity (main) ──────────────────────────────────────────────────

const ChatCommunity = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isOrgUser = currentUser?.role === "org";

  // Groups state
  const [communityGroups, setCommunityGroups] = useState([]);
  const [eventGroups, setEventGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState(null);

  // Chat state
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTypingState, setIsTypingState] = useState(false);

  // UI state
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Derive orgId for socket: org users use their own ID; volunteers use the selected group's orgId
  const orgIdForSocket = isOrgUser
    ? currentUser?._id
    : selectedGroup?.orgId?._id || selectedGroup?.orgId || null;

  const {
    isConnected,
    messages: socketMessages,
    typingUsers,
    onlineUsers,
    currentGroup: liveGroup,
    readReceipts,
    error: socketError,
    sendMessage,
    handleTyping,
    markAsRead,
  } = useSocket(orgIdForSocket, selectedGroup?._id ?? null, currentUser);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Absorb new socket messages into chatHistory (single source of truth).
  // This ensures edit/delete handlers work on all messages, not just REST-loaded ones.
  useEffect(() => {
    if (socketMessages.length === 0) return;
    setChatHistory((prev) => {
      const seenIds = new Set(prev.map((m) => m._id?.toString()).filter(Boolean));
      const fresh = socketMessages.filter((m) => !m._id || !seenIds.has(m._id.toString()));
      if (fresh.length === 0) return prev;
      return [...prev, ...fresh];
    });
  }, [socketMessages]);

  // Auto-scroll whenever the message list grows
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory.length]);

  // Load groups
  const loadGroups = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingGroups(true);
    setGroupsError(null);
    try {
      let raw = [];
      if (isOrgUser) {
        const res = await groupsAPI.getByOrganization(currentUser._id);
        raw = res.data ?? [];
      } else {
        const res = await groupsAPI.getMyGroups();
        raw = res.data ?? [];
      }
      setCommunityGroups(raw.filter((g) => g.type !== "event"));
      setEventGroups(raw.filter((g) => g.type === "event"));
    } catch (err) {
      console.error("Failed to load groups:", err);
      setGroupsError("Failed to load chat groups. Please try again.");
    } finally {
      setIsLoadingGroups(false);
    }
  }, [currentUser, isOrgUser]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Load message history when group changes — REST is the single source of truth for history
  useEffect(() => {
    if (!selectedGroup) {
      setChatHistory([]);
      return;
    }
    const load = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await chatAPI.getMessages(selectedGroup._id);
        setChatHistory(res.data?.messages ?? []);
      } catch (err) {
        console.error("Failed to load messages:", err);
        setChatHistory([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    load();
  }, [selectedGroup?._id]); // use _id to avoid re-running on object reference changes

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setChatHistory([]);
    setMessageInput("");
    setShowEmojiPicker(false);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setChatHistory([]);
    setShowInfo(false);
  };

  const handleMessageDelete = (messageId) => {
    setChatHistory((prev) => prev.filter((m) => m._id !== messageId));
  };

  const handleMessageEdit = (messageId, newText) => {
    setChatHistory((prev) =>
      prev.map((m) => (m._id === messageId ? { ...m, message: newText, edited: true } : m))
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !isConnected || !selectedGroup) return;

    if (selectedFile) {
      sendMessage(`📄 ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
      setSelectedFile(null);
    } else {
      sendMessage(messageInput.trim());
    }
    setMessageInput("");
    setShowEmojiPicker(false);
    setIsTypingState(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    if (!isTypingState) {
      setIsTypingState(true);
      handleTyping();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTypingState(false), 1000);
  };

  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🌊", "🏖️"];
  const addEmoji = (emoji) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <p className="text-gray-600">Please log in to access the chat.</p>
      </div>
    );
  }

  // chatHistory is the single source of truth (REST + absorbed socket messages).
  const allMessages = chatHistory;
  const messageGroups = byDate(allMessages);

  // Use consistent member count from group data (not socket's live user count which only shows connected users)
  const memberCount = selectedGroup?.memberCount ?? selectedGroup?.members?.length ?? 0;
  const onlineCount = onlineUsers.length;

  // ─── Render: Group selection view ───────────────────────────────────────

  const renderGroupList = () => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-5">
        {/* Go Home button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl transition-all duration-200 font-medium text-sm mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go Home
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {isOrgUser ? "Organization Chats" : "My Chats"}
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              {isOrgUser
                ? "Your community and event discussion groups"
                : "Groups you're a part of"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                isConnected
                  ? "bg-green-500/20 text-green-100"
                  : "bg-white/10 text-white/70"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-white/40"
                }`}
              />
              {isConnected ? "Online" : "Offline"}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
              <span>👤</span>
              <span>{currentUser.name}</span>
            </div>

            {isOrgUser && (
              <button
                onClick={() => setShowGroupManagement(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Manage Groups
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="p-6">
        {isLoadingGroups ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse flex items-center gap-3 p-4 rounded-xl border border-gray-100"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : groupsError ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-red-600 text-sm mb-3">{groupsError}</p>
            <button
              onClick={loadGroups}
              className="inline-flex items-center gap-1.5 text-blue-600 text-sm hover:text-blue-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        ) : communityGroups.length === 0 && eventGroups.length === 0 ? (
          isOrgUser ? (
            /* Organizer empty state — shouldn't normally be seen; lazy-init handles group creation */
            <div className="text-center py-14">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Setting up your chats…</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto mb-5">
                Your Announcements group is being created. Try refreshing in a moment.
              </p>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={loadGroups}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <Link
                  to="/admin/create-event"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Create an event
                </Link>
              </div>
            </div>
          ) : (
            /* Volunteer empty state — guiding screen */
            <div className="py-10 px-4">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-cyan-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">You're not in any groups yet</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Join an event or follow an organizer's community to start chatting with fellow volunteers.
                </p>
              </div>

              {/* Step guide */}
              <div className="max-w-sm mx-auto space-y-3">
                <div className="flex items-start gap-4 p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                  <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Register for an event</p>
                    <p className="text-xs text-gray-500 mt-0.5">You'll be automatically added to that event's chat group.</p>
                    <Link
                      to="/events"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-cyan-600 hover:text-cyan-800 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Browse events →
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-teal-50 rounded-xl border border-teal-100">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Join a community</p>
                    <p className="text-xs text-gray-500 mt-0.5">Visit an organizer's profile and join their community to access their group chats.</p>
                    <Link
                      to="/organizations"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Find organizers →
                    </Link>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400 mt-6">
                Once you join a group, it will appear here and you can start chatting.
              </p>
            </div>
          )
        ) : (
          <>
            <GroupSection
              title="Community Announcements"
              icon="📢"
              groups={communityGroups}
              selected={selectedGroup}
              onSelect={handleGroupSelect}
              showOrg={!isOrgUser}
              emptyNote={
                isOrgUser
                  ? "Your organization's announcement group will appear here."
                  : "Join an organizer's community to see their announcements here."
              }
            />
            <GroupSection
              title="Event Chats"
              icon="🏖️"
              groups={eventGroups}
              selected={selectedGroup}
              onSelect={handleGroupSelect}
              showOrg={!isOrgUser}
              emptyNote={
                isOrgUser
                  ? "Event chats will appear here as you create events."
                  : "You'll be added here automatically when you register for an event."
              }
            />
          </>
        )}
      </div>
    </div>
  );

  // ─── Render: Chat view ──────────────────────────────────────────────────

  const renderChat = () => (
    <div
      className="bg-white rounded-2xl shadow-xl overflow-hidden flex"
      style={{ height: "calc(100vh - 152px)" }}
    >
      {/* ── Main chat column ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleBackToGroups}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-800 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
              style={{ backgroundColor: selectedGroup.color || "#3B82F6" }}
            >
              {selectedGroup.icon || groupIcon(selectedGroup.type)}
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                {selectedGroup.name}
              </h2>
              <p className="text-xs text-gray-500">
                {groupLabel(selectedGroup.type)} · {memberCount} member{memberCount !== 1 ? "s" : ""}
                {onlineCount > 0 && (
                  <span className="text-green-600"> · {onlineCount} online</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-1.5 rounded-lg transition-colors ${showInfo ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"}`}
              title="Group info"
            >
              <Info className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-gray-50/60 to-white">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="ml-3 text-gray-500 text-sm">Loading messages…</span>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <div className="text-5xl">💬</div>
              <h3 className="text-base font-semibold text-gray-800">Start the conversation!</h3>
              <p className="text-gray-400 text-sm">
                Be the first to send a message in <span className="font-medium">{selectedGroup.name}</span>
              </p>
            </div>
          ) : (
            <>
              {Object.entries(messageGroups).map(([dateKey, dayMessages]) => (
                <div key={dateKey}>
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium">
                      {formatDate(new Date(dateKey))}
                    </div>
                  </div>
                  {dayMessages.map((msg, i) => (
                    <MessageBubble
                      key={msg._id ?? i}
                      message={msg}
                      isCurrentUser={
                        msg.userId === currentUser._id ||
                        msg.userId?.toString() === currentUser._id?.toString()
                      }
                      showSender={true}
                      readReceipts={readReceipts.get?.(msg._id) ?? []}
                      onMarkAsRead={markAsRead}
                      onDelete={handleMessageDelete}
                      onEdit={handleMessageEdit}
                    />
                  ))}
                </div>
              ))}
              <TypingIndicator typingUsers={typingUsers} currentUserId={currentUser._id} />
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
          {socketError && (
            <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {socketError}
            </div>
          )}

          {showEmojiPicker && (
            <div className="mb-2 p-2 bg-gray-50 rounded-xl flex flex-wrap gap-1">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="text-lg hover:bg-gray-200 rounded-lg p-1.5 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {selectedFile && (
            <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-700 truncate">📄 {selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="text-red-500 text-sm ml-2 flex-shrink-0">
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={messageInput}
                onChange={handleInputChange}
                placeholder={isConnected ? `Message ${selectedGroup.name}…` : "Connecting to server…"}
                className="w-full px-4 py-2.5 pr-16 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm leading-relaxed disabled:bg-gray-50 disabled:text-gray-400"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                disabled={!isConnected}
              />
              <div className="absolute right-2 top-2 flex items-center gap-0.5">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <label htmlFor="file-upload" className="cursor-pointer p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={(!messageInput.trim() && !selectedFile) || !isConnected}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* ── Info / Members panel ── */}
      {showInfo && (
        <div className="w-64 border-l border-gray-100 bg-gray-50 flex flex-col flex-shrink-0 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <span className="text-sm font-semibold text-gray-800">Group Info</span>
            <button
              onClick={() => setShowInfo(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Group identity */}
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-2 shadow"
                style={{ backgroundColor: selectedGroup.color || "#3B82F6" }}
              >
                {selectedGroup.icon || groupIcon(selectedGroup.type)}
              </div>
              <p className="font-semibold text-gray-900 text-sm">{selectedGroup.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{groupLabel(selectedGroup.type)}</p>
            </div>

            {/* Description */}
            {selectedGroup.description && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About</p>
                <p className="text-xs text-gray-600 leading-relaxed">{selectedGroup.description}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-3 text-center border border-gray-200">
                <p className="text-lg font-bold text-blue-600">{memberCount}</p>
                <p className="text-xs text-gray-500">Members</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-gray-200">
                <p className="text-lg font-bold text-green-600">{onlineCount}</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Visibility</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                selectedGroup.settings?.isPublic
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selectedGroup.settings?.isPublic ? "bg-green-500" : "bg-gray-400"}`} />
                {selectedGroup.settings?.isPublic ? "Public — anyone can join" : "Private — invite only"}
              </span>
            </div>

            {/* Member list */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Members ({memberCount})
              </p>
              <div className="space-y-2">
                {(selectedGroup.members || []).map((m, i) => {
                  const name = m.userId?.name || m.name || "Member";
                  const role = m.role || "member";
                  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  const colors = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4"];
                  const bg = colors[name.charCodeAt(0) % colors.length];
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: bg }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{name}</p>
                      </div>
                      {role === "admin" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Main render ────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 pt-28">
        <div className="max-w-3xl mx-auto px-4 pb-8">
          {selectedGroup ? renderChat() : renderGroupList()}
        </div>
      </div>
      <Footer />

      {showGroupManagement && (
        <GroupManagement
          orgId={currentUser._id}
          currentUser={currentUser}
          onClose={() => {
            setShowGroupManagement(false);
            loadGroups();
          }}
        />
      )}
    </>
  );
};

export default ChatCommunity;
