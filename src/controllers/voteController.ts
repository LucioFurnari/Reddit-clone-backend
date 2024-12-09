import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Vote on a Post or Comment
export async function vote(req: Request, res: Response) {
  const { targetId, value, type } = req.body; // type: 'post' | 'comment'
  const userId = req.user?.id; // Assume `req.user` is set by your authentication middleware

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!["post", "comment"].includes(type)) {
    return res.status(400).json({ error: "Invalid type. Must be 'post' or 'comment'." });
  }

  try {
    // Upsert vote
    const vote = await prisma.vote.upsert({
      where: {
        userId_postId_commentId: {
          userId,
          postId: type === "post" ? targetId : null,
          commentId: type === "comment" ? targetId : null,
        },
      },
      create: {
        userId,
        postId: type === "post" ? targetId : null,
        commentId: type === "comment" ? targetId : null,
        value,
      },
      update: { value },
    });

    // Recalculate karma
    const karma = await prisma.vote.aggregate({
      _sum: { value: true },
      where: {
        [type === "post" ? "postId" : "commentId"]: targetId,
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

    return res.status(200).json({ success: true, vote });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong.", details: error.message });
  }
}
