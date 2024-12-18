import { Router } from "express";
import { createComment, getComments, editComment } from "../controllers/comment";
import { authenticateToken } from "../controllers/auth";

const router = Router();

// Create comment
router.post("/posts/:postId/comments", authenticateToken, createComment);

// Get comments
router.get("/posts/:postId/comments", getComments);

// Edit comment
router.put("/comments/:commentId", authenticateToken, editComment);

export default router;