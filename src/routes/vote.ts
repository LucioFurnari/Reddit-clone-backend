import { Router } from "express";
import { vote } from "../controllers/voteController";
import { authenticateToken } from "../controllers/auth";

const router = Router();

// Voting route
router.patch("/vote", authenticateToken, vote);

export default router;