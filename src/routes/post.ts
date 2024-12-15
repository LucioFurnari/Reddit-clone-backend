import { Router } from "express";
import { authenticateToken } from "../controllers/auth";
import { createPost } from "../controllers/post";

const router = Router();

// Create post
router.post("/subreddit/:subredditId/posts", authenticateToken, createPost);

export default router;