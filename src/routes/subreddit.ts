import { Router } from "express";
import { createSubReddit, getAllSubReddit, getSubReddit, subscribeToSubreddit, unsubscribeFromSubreddit, searchSubreddits, assignModerator, removeModerator, editSubreddit } from "../controllers/subreddit";
import { authenticateToken } from "../controllers/auth";

const router = Router();

// Create Subreddit
router.post("/subreddit", authenticateToken, createSubReddit);

// Get all Subreddit
router.get("/subreddit", getAllSubReddit);

// Get Subreddit by id
router.get("/subreddit/:subredditId", getSubReddit);

// Subscribe to a subreddit
router.post("/subreddit/:subredditId/subscribe", authenticateToken, subscribeToSubreddit);

// Unsubscribe from a subreddit
router.delete("/subreddit/:subredditId/unsubscribe", authenticateToken, unsubscribeFromSubreddit);

// Search subreddit by name - use query - example: /subreddits/search?query=example
router.get("/subreddits/search", searchSubreddits);

// Add moderator to subreddit
router.post("/subreddits/:subredditId/moderators", authenticateToken, assignModerator);

// Remove moderator from subreddit
router.delete("/subreddits/:subredditId/moderators", authenticateToken, removeModerator);

// Edit subreddit
router.put("/subreddits/:subredditId", authenticateToken, editSubreddit);
export default router;