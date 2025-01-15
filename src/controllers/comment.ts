import { Request, Response } from "express";
import { z } from "zod";
import { io } from "../app";
import prisma from "../prisma";

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
      return res.status(404).json({ message: "Post not found." });
    };

    // If it's a reply, validate the parent comment
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });

      if (!parentComment || parentComment.postId !== postId) {
        return  res.status(400).json({ message: "Invalid parent comment or parent comment does not belongs to this post." });
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

    // Emit a notification to the post author
    io.to(`user_${post.authorId}`).emit('notification', {
      type: 'new_comment',
      message: `New comment on your post "${post.title}"`,
      link: `/post/${postId}`,
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
      return res.status(404).json({ message: "Post not found." });
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
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Edit a comment
export async function editComment(req: Request, res: Response) {
  const { commentId } = req.params;
  const userId = req.user!.id;

  // Validate and parse request body
  const data = createCommentsSchema.parse(req.body);

  try {
    // Fetch the comment to ensure it exists and the user is the author
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, content: true },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    };

    if (comment.authorId === userId) {
      return res.status(403).json({ message: "You are not authorized to edit this comment." });
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: data.content },
      select: {
        id: true,
        content: true,
        updatedAt: true
      },
    });

    return res.status(200).json({ message: "Comment updated successfully.", comment: updatedComment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    };
    console.error("Error editing comment: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete a comment
export async function deleteComment(req: Request, res: Response) {
  const { commentId } = req.params;
  const userId = req.user!.id;
  try {
    
  // Fetch the subreddit ID from the comment
  const commentWithSubreddit = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      post: {
        select: {
          subredditId: true,
        },
      },
    },
  });

  if (!commentWithSubreddit) {
    return res.status(404).json({ message: "Comment not found." });
  }

  const { subredditId, authorId } = {
    subredditId: commentWithSubreddit.post.subredditId,
    authorId: commentWithSubreddit.authorId,
  };

  // Check if the user is the author or a moderator
  const isAuthor = authorId === userId;
  
  const isModerator = await prisma.userOnSubreddit.findFirst({
    where: {
      userId,
      subredditId,
      role: "MODERATOR",
    },
  });

  if (!isAuthor && !isModerator) {
    return res.status(403).json({ message: "You are not authorized to delete this comment." });
  }

  // Delete the comment
  await prisma.comment.delete({
    where: { id: commentId },
  });

  return res.status(200).json({ message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};