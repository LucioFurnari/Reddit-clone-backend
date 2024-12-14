import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Create post validation schema
const createPostSchema = z.object({
  title: z.string().trim().min(8, { message: 'Title must be at least 8 characters long'}),
  content: z.string().trim().min(8, { message: 'Content must be at least 8 characters long'}).optional(),
});

type CreatePostData = z.infer<typeof createPostSchema>;

// Create post controller
export async function createPost(req: Request, res: Response) {
  const { subredditId } = req.params;
  const authorId = req.user!.id;

  try {
    // Parse and validate request body
    const data: CreatePostData = createPostSchema.parse(req.body);

    const post = await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: authorId,
        subredditId: subredditId
      }
    });
    
    return res.status(201).json({ message: "Post created", post });
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Handle validation errors
      return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
    }
    return  res.status(500).json({ error: "Internal server error" });
  }
};