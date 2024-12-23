import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Create a subreddit
export async function createSubReddit(req: Request, res: Response) {
  const { name, description } = req.body;
  const creatorId = req.user!.id
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
export async function getSubReddit(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const subreddit = await prisma.subreddit.findUnique({ where: { id } });
    if (!subreddit) {
      return res.status(404).json({ error: "Subreddit not found" });
    }

    return res.json(subreddit);
  } catch (error) {
    console.error('Error fetching subreddit:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Subscribe to subreddit
export async function subscribeToSubreddit(req: Request, res: Response) {
  const { subredditId } = req.params;
  const userId = req.user!.id;

  try {
    // Check if the subreddit exists
    const subreddit = await prisma.subreddit.findUnique({
      where: { id: subredditId },
    });

    if (!subreddit) {
      return res.status(404).json({ error: "Subreddit not found." });
    }

    // Check if the user is already subscribed
    const existingSubscription = await prisma.userOnSubreddit.findFirst({
      where: { userId, subredditId },
    });

    if (existingSubscription) {
      return res.status(400).json({ error: "You are already subscribed to this subreddit." });
    };

    // Create the subscription
    const subscription = await prisma.userOnSubreddit.create({
      data: {
        userId,
        subredditId,
      },
    });

    return res.status(201).json({ message: "Successfully subscribed to subreddit.", subscription });
  } catch (error) {
    console.error("Error subscribing to subreddit:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Unsubscribe from subreddit
export async function unsubscribeFromSubreddit(req: Request, res: Response) {
  const { subredditId } = req.params;
  const userId = req.user!.id;

  try {
    // Check if the subscription exists
    const subscription = await prisma.userOnSubreddit.findFirst({
      where: { userId, subredditId },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found." });
    }

    // Delete the subscription
    await prisma.userOnSubreddit.delete({
      where: { id: subscription.id },
    });

    return res.status(200).json({ message: "Successfully unsubscribed from subreddit." });
  } catch (error) {
    console.error("Error unsubscribing from subreddit:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};