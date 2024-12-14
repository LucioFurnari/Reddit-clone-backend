import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Create post validation schema
const createPostSchema = z.object({
  title: z.string().min(8, { message: 'Title must be at least 8 characters long'}),
  content: z.string().min(8, { message: 'Content must be at least 8 characters long'}),
});

type CreatePostData = z.infer<typeof createPostSchema>;

// Create post controller
export async function createPost(req: Request, res: Response) {
  const { title, content, subredditId } = req.body;
  const authorId = req.user!.id;

  try {
    // Parse and validate request body
    const data: CreatePostData = createPostSchema.parse(req.body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Handle validation errors
      return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
    }
      return  res.status(400).json({ error: "Email already exists" });
  }
};