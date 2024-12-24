import { Router } from "express";
import { updateUserProfile, getSubscribedSubreddits } from "../controllers/user";
import { authenticateToken } from "../controllers/auth";

const router = Router();

// Update profile
router.put("/profile", authenticateToken, updateUserProfile);

// Get subscribed subreddits
router.get("/subscribed-subreddits", authenticateToken, getSubscribedSubreddits);

export default router;