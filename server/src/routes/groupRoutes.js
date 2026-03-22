const express = require("express");
const router = express.Router();
const {
  getOrgGroups,
  getMyGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupMessages,
  getCommunityGroups,
  createCommunityGroup,
  joinCommunityGroup,
} = require("../controllers/groupController");
const { protect } = require("../middlewares/authMiddleware");

// Current user's joined groups — must be defined BEFORE /:orgId to avoid route conflict
router.get("/me", protect, getMyGroups);

// Organization group routes (publicly accessible for demo)
router.get("/:orgId", getOrgGroups); // Get all groups for an organization

// Protect other routes that require authentication
router.use(protect);

router.post("/:orgId", createGroup); // Create a new group

// Individual group routes
router.put("/:groupId", updateGroup); // Update group details
router.delete("/:groupId", deleteGroup); // Delete/deactivate group

// Group membership routes
router.post("/:groupId/join", joinGroup); // Join a group
router.post("/:groupId/leave", leaveGroup); // Leave a group

// Group messages route
router.get("/:groupId/messages", getGroupMessages); // Get group messages

// Community group routes
router.get("/community/:communityId", getCommunityGroups); // Get all groups for a community
router.post("/community/:communityId", createCommunityGroup); // Create a new group in community
router.post("/community/:communityId/:groupId/join", joinCommunityGroup); // Join a community group

module.exports = router;
