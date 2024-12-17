import { Router } from "express";
import { authenticateToken } from "../controllers/auth";
import { createPost, getPostById, getSubRedditPosts } from "../controllers/post";

const router = Router();

// Create post
router.post("/subreddit/:subredditId/posts", authenticateToken, createPost);

// Get post by id
router.get("/subreddit/posts/:postId", getPostById);

// Get all posts by subreddit
router.get("/subreddit/:subredditId/posts", getSubRedditPosts);

export default router;