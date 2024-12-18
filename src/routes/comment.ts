import { Router } from "express";
import { createComment, getComments } from "../controllers/comment";

const router = Router();

// Create comment
router.post("/posts/:postId/comments", createComment);

// Get comments
router.get("/posts/:postId/comments", getComments);

export default router;