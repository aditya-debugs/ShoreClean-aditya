import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, Check, X, MoreVertical } from "lucide-react";
import { chatAPI } from "../utils/api";

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const AVATAR_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16",
];
const avatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const MessageBubble = ({
  message,
  isCurrentUser,
  showSender = true,
  readReceipts = [],
  onMarkAsRead,
  onDelete,
  onEdit,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.message);
  const [editLoading, setEditLoading] = useState(false);
  const menuRef = useRef(null);
  const editRef = useRef(null);

  // Mark as read
  useEffect(() => {
    if (!isCurrentUser && onMarkAsRead && message._id) {
      onMarkAsRead(message._id);
    }
  }, [message._id, isCurrentUser, onMarkAsRead]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus edit textarea
  useEffect(() => {
    if (isEditing) editRef.current?.focus();
  }, [isEditing]);

  const handleEditSave = async () => {
    if (!editValue.trim() || editValue.trim() === message.message) {
      setIsEditing(false);
      return;
    }
    setEditLoading(true);
    try {
      await chatAPI.editMessage(message._id, editValue.trim());
      onEdit?.(message._id, editValue.trim());
      setIsEditing(false);
    } catch (err) {
      console.error("Edit failed:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!window.confirm("Delete this message?")) return;
    try {
      await chatAPI.deleteMessage(message._id);
      onDelete?.(message._id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const isSystem = message.messageType === "system";

  // ── System message (centered) ────────────────────────────────────────────
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {message.message}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-2 mb-3 group ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar (others only) */}
      {!isCurrentUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-0.5"
          style={{ backgroundColor: avatarColor(message.username) }}
          title={message.username}
        >
          {getInitials(message.username)}
        </div>
      )}

      <div className={`flex flex-col max-w-[72%] ${isCurrentUser ? "items-end" : "items-start"}`}>
        {/* Sender name */}
        {!isCurrentUser && showSender && (
          <span className="text-xs font-semibold text-blue-600 mb-1 ml-1">
            {message.username}
          </span>
        )}

        <div className={`flex items-end gap-1.5 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
          {/* Bubble */}
          <div
            className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
              isCurrentUser
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm"
                : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
            }`}
          >
            {isEditing ? (
              <div className="flex flex-col gap-2 min-w-[180px]">
                <textarea
                  ref={editRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                  rows={2}
                  className="text-sm bg-white/20 text-white placeholder-white/60 border border-white/40 rounded-lg px-2 py-1 resize-none focus:outline-none"
                />
                <div className="flex gap-1.5 justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 rounded-md hover:bg-white/20 transition-colors"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5 text-white/80" />
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={editLoading}
                    className="p-1 rounded-md hover:bg-white/20 transition-colors"
                    title="Save"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words">{message.message}</p>
                <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <span className={`text-[10px] ${isCurrentUser ? "text-blue-100" : "text-gray-400"}`}>
                    {formatTime(message.timestamp)}
                  </span>
                  {message.edited && (
                    <span className={`text-[10px] italic ${isCurrentUser ? "text-blue-200" : "text-gray-400"}`}>
                      · edited
                    </span>
                  )}
                  {/* Read receipt ticks for sender */}
                  {isCurrentUser && (
                    <span className="text-[10px] text-blue-200 ml-0.5">
                      {readReceipts.length > 0 ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action menu trigger — only own messages, only on hover */}
          {isCurrentUser && !isEditing && (
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <div className="absolute right-6 bottom-0 z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[120px]">
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-500" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
