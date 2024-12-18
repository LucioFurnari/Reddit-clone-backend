import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Validation schema for creating comments
const createCommentsSchema = z.object({
  content: z.string().min(1, { message: "Content cannot be empty," }),
  parentId: z.string().uuid().optional(), // Optional for replies
});

// Create a comment
export async function createComment(req: Request, res: Response) {
  const { postId } = req.params;
  const userId = req.user!.id;

  try {
    // Validate and parse request body
    const data = createCommentsSchema.parse(req.body);

    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    };

    // If it's a reply, validate the parent comment
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });

      if (!parentComment || parentComment.postId !== postId) {
        return  res.status(400).json({ error: "Invalid parent comment or parent comment does not belongs to this post." });
      };
    };

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        authorId: userId,
        postId: postId,
        parentId: data.parentId || null,
      },
    });

    return res.status(201).json({ message: "Comment created successfully.", comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    };
    console.error("Error creating comment: ", error);
    return res.status(500).json({ error: "Internal server error." });
  };
};

// Get comments of post
export async function getComments(req: Request, res: Response) {
  const { postId } = req.params;

  try {
    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    };

    // Get comments
    const comments = await prisma.comment.findMany({
      where: { postId: postId },
      include: {
        author: { select: { id: true, username: true, profilePictureUrl: true} },
        replies: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { id: true, username: true, profilePictureUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" }, // Sort by creation time
    });

    return res.status(200).json({ message: "Comments fetched successfully", comments });
  } catch (error) {
    console.error("Error creating comment: ", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};