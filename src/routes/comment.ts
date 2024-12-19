import { Router } from "express";
import { createComment, getComments, editComment, deleteComment } from "../controllers/comment";
import { authenticateToken } from "../controllers/auth";

const router = Router();

// Create comment
router.post("/posts/:postId/comments", authenticateToken, createComment);

// Get comments
router.get("/posts/:postId/comments", getComments);

// Edit comment
router.put("/comments/:commentId", authenticateToken, editComment);

// Delete comment
router.delete("/comments/:commentId", authenticateToken, deleteComment);

export default router;