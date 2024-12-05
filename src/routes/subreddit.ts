import { Router } from "express";
import { createSubReddit, getAllSubReddit, getSubReddit } from "../controllers/subreddit";
import { authenticateToken } from "../controllers/auth";

const router = Router();

// Create Subreddit
router.post('/subreddit', authenticateToken, createSubReddit);

// Get all Subreddit
router.get('/subreddit', getAllSubReddit);

// Get Subreddit by id
router.get('/subreddit/:id', getSubReddit);

export default router;