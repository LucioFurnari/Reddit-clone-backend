import { Router } from "express";
import { authenticateToken } from "../controllers/auth";
import { createPost, getPostById, getSubRedditPosts, editPost, deletePost } from "../controllers/post";

const router = Router();

// Create post
router.post("/subreddit/:subredditId/posts", authenticateToken, createPost);

// Get post by id
router.get("/subreddit/posts/:postId", getPostById);

// Get all posts by subreddit
router.get("/subreddit/:subredditId/posts", getSubRedditPosts);

// Edit post by id
router.put("/posts/:postId", editPost);

export default router;