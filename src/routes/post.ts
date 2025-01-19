import { Router } from "express";
import { authenticateToken } from "../controllers/auth";
import { createPost, getPostById, getSubRedditPosts, editPost, deletePost, searchPosts } from "../controllers/post";

const router = Router();

// Create post
router.post("/subreddits/:subredditId/posts", authenticateToken, createPost);

// Get post by id
router.get("/subreddit/posts/:postId", getPostById);

// Get all posts by subreddit
router.get("/subreddit/:subredditId/posts", getSubRedditPosts);

// Edit post by id
router.put("/posts/:postId", authenticateToken, editPost);

// Delete post by id
router.delete("/posts/:postId", authenticateToken, deletePost);

// Search posts by name
router.get("/posts/search", searchPosts);

export default router;