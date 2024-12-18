import { Router } from "express";
import { createComment, getComments, editComment } from "../controllers/comment";

const router = Router();

// Create comment
router.post("/posts/:postId/comments", createComment);

// Get comments
router.get("/posts/:postId/comments", getComments);

// Edit comment
router.put("/comments/:commentId", editComment);

export default router;