import { Router } from "express";
import { vote, removeVote } from "../controllers/voteController";
import { authenticateToken } from "../controllers/auth";

const router = Router();

// Voting route
router.patch("/vote", authenticateToken, vote);

// Remove post vote
router.delete("/vote/:postId", authenticateToken, removeVote);

// Remove comment vote
router.delete("/vote/:commentId", authenticateToken, removeVote);

export default router;