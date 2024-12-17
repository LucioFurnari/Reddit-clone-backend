import { Router } from "express";
import { createComment } from "../controllers/comment";

const router = Router();

// Create comment
router.post("/posts/:postId/comments", createComment);