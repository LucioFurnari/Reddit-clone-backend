import { Router } from "express";
import { createSubReddit, getAllSubReddit, getSubReddit, subscribeToSubreddit, unsubscribeFromSubreddit, searchSubreddits } from "../controllers/subreddit";
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

// Search subreddit by name
router.get("/subreddits/search", searchSubreddits);
export default router;