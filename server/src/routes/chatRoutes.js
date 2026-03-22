const express = require("express");
const router = express.Router();
const {
  getOrgChat,
  getEventChat,
  getOrgChatGroups,
  getGroupChatMessages,
} = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");

// Protect all chat routes
router.use(protect);

// Send a message to a group (REST fallback when WebSocket is unavailable)
router.post("/:groupId/messages", async (req, res) => {
  try {
    const Chat = require("../models/Chat");
    const Group = require("../models/Group");
    const User = require("../models/User");
    const { groupId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({ message: "Group not found" });
    }

    const sender = await User.findById(userId).select("name");
    const message = new Chat({
      orgId: group.orgId,
      groupId,
      userId,
      username: sender ? sender.name : "Unknown",
      message: content.trim(),
      timestamp: new Date(),
    });
    await message.save();
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Edit a message (only the sender can edit)
router.patch("/messages/:messageId", async (req, res) => {
  try {
    const Chat = require("../models/Chat");
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const msg = await Chat.findById(messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    msg.message = content.trim();
    msg.edited = true;
    await msg.save();
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a message (sender or org admin can delete)
router.delete("/messages/:messageId", async (req, res) => {
  try {
    const Chat = require("../models/Chat");
    const { messageId } = req.params;
    const userId = req.user.id;

    const msg = await Chat.findById(messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const isOwner = msg.userId.toString() === userId.toString();
    const isAdmin = req.user.role === "admin" || req.user.role === "org";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await msg.deleteOne();
    res.json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// New group-based chat routes
router.get("/:orgId/groups", getOrgChatGroups); // Get all chat groups for organization
router.get("/:orgId/groups/:groupId", getGroupChatMessages); // Get messages for specific group

// Legacy routes for backward compatibility
router.get("/:orgId", getOrgChat); // Get organization community messages (redirects to groups)
router.get("/:orgId/:eventId", getEventChat); // Get event-specific messages (finds event group)

module.exports = router;
