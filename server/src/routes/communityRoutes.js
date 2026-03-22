const express = require("express");
const {
  createCommunity,
  getCommunities,
  getCommunityBySlug,
  joinCommunity,
  leaveCommunity,
  updateCommunity,
  getCommunityGroups,
} = require("../controllers/communityController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getCommunities);
router.get("/:slug", getCommunityBySlug);

// Protected routes
router.post("/", protect, createCommunity);
router.post("/:communityId/join", protect, joinCommunity);
router.post("/:communityId/leave", protect, leaveCommunity);
router.put("/:communityId", protect, updateCommunity);
router.delete("/:communityId", protect, async (req, res) => {
  try {
    const Community = require("../models/Community");
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ success: false, message: "Community not found" });

    const isOrganizer = community.organizers.some(
      (org) => org.userId.toString() === req.user.id
    );
    if (!isOrganizer && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    community.isActive = false;
    await community.save();
    res.json({ success: true, message: "Community deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/:communityId/groups", protect, getCommunityGroups);

module.exports = router;
