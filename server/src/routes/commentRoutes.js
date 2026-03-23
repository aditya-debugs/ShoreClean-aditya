// routes/commentRoutes.js
const express = require("express");
const Comment = require("../models/Comment");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Add Comment (requires auth)
router.post("/:eventId", protect, async (req, res) => {
  try {
    const { text } = req.body;
    const { eventId } = req.params;
    const userId = req.user.id;

    const comment = new Comment({ text, eventId, userId });
    await comment.save();

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Comments for an Event (public)
router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const comments = await Comment.find({ eventId }).populate("userId", "name");
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Comment (requires auth)
router.delete("/:commentId", protect, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // Only the comment author or admin can delete
    if (comment.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await Comment.findByIdAndDelete(commentId);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
