import { Router } from "express";
import {
  createSubReddit,
  getAllSubReddit,
  getSubReddit,
  subscribeToSubreddit,
  unsubscribeFromSubreddit,
  searchSubreddits,
  assignModerator,
  removeModerator,
  editSubreddit,
  banUser,
  unbanUser,
  deleteSubReddit
} from "../controllers/subreddit";
import { authenticateToken } from "../controllers/auth";

const router = Router();

// Create Subreddit
router.post("/subreddits", authenticateToken, createSubReddit);

// Delete Subreddit
router.delete("/subreddits/:subredditId", authenticateToken, deleteSubReddit);

// Get all Subreddit
router.get("/subreddits", authenticateToken, getAllSubReddit);

// Search subreddit by name - use query - example: /subreddits/search?query=example
router.get("/subreddits/search", searchSubreddits);

// Get Subreddit by id
router.get("/subreddits/:subredditId", getSubReddit);

// Subscribe to a subreddit
router.post("/subreddits/:subredditId/subscribe", authenticateToken, subscribeToSubreddit);

// Unsubscribe from a subreddit
router.delete("/subreddits/:subredditId/unsubscribe", authenticateToken, unsubscribeFromSubreddit);

// Add moderator to subreddit
router.post("/subreddits/:subredditId/moderators", authenticateToken, assignModerator);

// Remove moderator from subreddit
router.delete("/subreddits/:subredditId/moderators", authenticateToken, removeModerator);

// Edit subreddit
router.put("/subreddits/:subredditId", authenticateToken, editSubreddit);

// Ban user from subreddit
router.post("/subreddits/:subredditId/ban", authenticateToken, banUser);

// Unban user from subreddit
router.post("/subreddits/:subredditId/unban", authenticateToken, unbanUser);

export default router;