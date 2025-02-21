import { Request, Response } from "express";
import prisma from "../prisma";

// Vote on a Post or Comment
export async function vote(req: Request, res: Response) {
  const { targetId, action, type } = req.body; // type: 'post' | 'comment'
  const userId = req.user?.id; // Assume `req.user` is set by your authentication middleware

  const voteValue = action === "upvote" ? 1 : action === "downvote" ? -1 : 0;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!["post", "comment"].includes(type)) {
    return res.status(400).json({ error: "Invalid type. Must be 'post' or 'comment'." });
  }

  if (!["upvote", "downvote"].includes(action)) {
    return res.status(400).json({ error: "Invalid action. Must be 'upvote' or 'downvote'." });
  };

  try {
    // Check if the user has already voted
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId,
        postId: type === "post" ? targetId : null,
        commentId: type === "comment" ? targetId : null,
      },
    });

    if (existingVote) {
      if (existingVote.value === voteValue) {
        return res.status(200).json({ success: true, vote: existingVote, message: "Vote unchanged" });
      };

      // Update existing vote
      const updatedVote = await prisma.vote.update({
        where: {
          userId_postId_commentId: {
            userId,
            postId: type === "post" ? targetId : null,
            commentId: type === "comment" ? targetId : null,
          },
        },
        data: { value : voteValue },
      });

      // Recalculate karma
      const karma = await prisma.vote.aggregate({
        _sum: { value: true },
        where: {
          postId: type === "post" ? targetId : null,
          commentId: type === "comment" ? targetId : null,
        },
      });

      // Update karma on the target
      if (type === "post") {
        await prisma.post.update({
          where: { id: targetId },
          data: { karma: karma._sum.value || 0 },
        });
      } else if (type === "comment") {
        await prisma.comment.update({
          where: { id: targetId },
          data: { karma: karma._sum.value || 0 },
        });
      }

      return res.status(200).json({ success: true, vote: updatedVote, message: "Vote updated" });
    };

    // Create a nw vote
    const newVote = await prisma.vote.create({
      data: {
        userId,
        postId: type === "post" ? targetId : null,
        commentId: type === "comment" ? targetId : null,
        value: voteValue,
      },
    });

    // Recalculate karma
    const karma = await prisma.vote.aggregate({
      _sum: { value: true },
      where: {
        postId: type === "post" ? targetId : null,
        commentId: type === "comment" ? targetId : null,
      },
    });

    // Update karma on the target
    if (type === "post") {
      await prisma.post.update({
        where: { id: targetId },
        data: { karma: karma._sum.value || 0 },
      });
    } else if (type === "comment") {
      await prisma.comment.update({
        where: { id: targetId },
        data: { karma: karma._sum.value || 0 },
      });
    };

    return res.status(200).json({ success: true, vote: newVote, message: "Vote created" });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong.", details: error });
  }
}
