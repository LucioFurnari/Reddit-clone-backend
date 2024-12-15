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

    // Create post
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
    console.error("Error creating post:", err)
    return  res.status(500).json({ error: "Internal server error" });
  }
};

// Get posts by subreddit
export async function getSubRedditPosts(req: Request, res: Response) {
  const { subredditId } = req.params;

  try {
    const posts = await prisma.post.findMany({
      where: { subredditId },
      include: {
        author: {
          select: { id: true, username: true }, // Include author info
        },
        subreddit: {
          select: { id: true, name: true }, // Include subreddit info
        },
      },
      orderBy: { createdAt: "desc" }, // Order by creation date
    });

    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found for this subreddit." });
    }

    return res.status(200).json({ message: "Post fetched successfully", posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}