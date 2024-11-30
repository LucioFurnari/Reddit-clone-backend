import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Create a subreddit
export async function createSubReddit(req: Request, res: Response) {
  const { name, description, creatorId } = req.body;

  try {
    const subreddit = await prisma.subreddit.create({
      data: { name, description, creatorId },
    });
    res.status(201).json(subreddit);
  } catch (error) {
    res.status(400).json({ error: "Subreddit name already exists"});
  }
};

// Get all subreddits
export async function getAllSubReddit(req: Request, res: Response) {
  const subreddits = await prisma.subreddit.findMany();
  res.json(subreddits);
};

// Get a specific subreddit
export async function getSubReddit(req: Request, res: Response) {
  const { id } = req.params;

    const subreddit = await prisma.subreddit.findUnique({ where: { id } });
    if (!subreddit) return res.status(404).json({ error: "Subreddit not found" });

    res.json(subreddit);
};