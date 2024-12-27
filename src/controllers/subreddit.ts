import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";

const prisma = new PrismaClient();

// Zod schema for subreddit creation
const createSubRedditSchema = z.object({
  name: z.string().min(3, { message: "Subreddit name must be at least 3 characters." }).max(50),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(500),
});

// Create a subreddit
export async function createSubReddit(req: Request, res: Response) {
  // Validate input
  const { name, description } = createSubRedditSchema.parse(req.body);
  const creatorId = req.user!.id;

  try{
    // Create the subreddit
    const subreddit = await prisma.subreddit.create({
      data: { name, description, creatorId },
    });
  
    return res.status(201).json({ message: "Subreddit created successfully.", subreddit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    console.error("Error creating subreddit:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Define the validation schema using Zod
const editSubredditSchema = z.object({
  description: z.string().trim().optional(),
  bannerUrl: z.string().url().optional(),
  iconUrl: z.string().url().optional(),
});

// Edit subreddit
export async function editSubreddit(req: Request, res: Response) {
  const { subredditId } = req.params;
  const userId = req.user!.id;

  try {
    // Validate the request body
    const data = editSubredditSchema.safeParse(req.body);

    // Check if the subreddit exits
    const subreddit = await prisma.subreddit.findUnique({
      where: { id: subredditId },
    });

    if (!subreddit) {
      return res.status(404).json({ error: "Subreddit not found." });
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
  }
};
// Delete subreddit
export async function deleteSubReddit(req: Request, res: Response) {
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

    // Check if the user is the creator of the subreddit
    if (subreddit.creatorId !== userId) {
      return res.status(403).json({ error: "You are not authorized to delete this subreddit." });
    }

    // Delete the subreddit
    await prisma.subreddit.delete({
      where: { id: subredditId },
    });

    res.status(200).json({ message: "Subreddit deleted successfully." });
  } catch (error) {
    console.error("Error deleting subreddit:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Get all subreddits
export async function getAllSubReddit(req: Request, res: Response) {
  const subreddits = await prisma.subreddit.findMany();
  res.json(subreddits);
};

// Get a specific subreddit
export async function getSubReddit(req: Request, res: Response): Promise<Response> {
  const { subredditId } = req.params;

  try {
    if (!subredditId) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const subreddit = await prisma.subreddit.findUnique({ where: { id: subredditId } });
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

// Define Zod schema for query validation
const searchSubredditsSchema = z.object({
  query: z.string().min(1, { message: "Query parameter is required and cannot be empty." }),
});

// Search subreddit by name

export async function searchSubreddits(req: Request, res: Response) {
  try {
    // Validate query parameters
    const { query } = searchSubredditsSchema.parse(req.query);

    const subreddits = await prisma.subreddit.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        bannerUrl: true,
      },
    });

    return res.status(200).json({ message: "Subreddits fetched successfully.", subreddits });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    console.error("Error searching subreddits:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Zod schema to validate input
const assignModeratorSchema = z.object({
  userId: z.string().uuid({ message: "A valid user ID is required." }),
});

export async function assignModerator(req: Request, res: Response) {
  const { subredditId } = req.params;

  try {
    // Validate input
    const { userId } = assignModeratorSchema.parse(req.body);

    // Ensure the subreddit exists
    const subreddit = await prisma.subreddit.findUnique({
      where: { id: subredditId },
    });

    if (!subreddit) {
      return res.status(404).json({ error: "Subreddit not found." });
    }

    // Add or update the user's role to MODERATOR
    await prisma.userOnSubreddit.upsert({
      where: { userId_subredditId: { userId, subredditId } },
      create: { userId, subredditId, role: "MODERATOR" },
      update: { role: "MODERATOR" },
    });

    return res.status(200).json({ message: "User assigned as moderator successfully." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    console.error("Error assigning moderator:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export async function removeModerator(req: Request, res: Response) {
  const { subredditId, userId } = req.params;

  try {
    // Ensure the subreddit exists
    const subreddit = await prisma.subreddit.findUnique({
      where: { id: subredditId },
    });

    if (!subreddit) {
      return res.status(404).json({ error: "Subreddit not found." });
    }

    // Remove the moderator role if it exists
    const userOnSubreddit = await prisma.userOnSubreddit.findUnique({
      where: { userId_subredditId: { userId, subredditId } },
    });

    if (!userOnSubreddit || userOnSubreddit.role !== "MODERATOR") {
      return res.status(400).json({ error: "User is not a moderator of this subreddit." });
    }

    await prisma.userOnSubreddit.delete({
      where: { userId_subredditId: { userId, subredditId } },
    });

    return res.status(200).json({ message: "Moderator removed successfully." });
  } catch (error) {
    console.error("Error removing moderator:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};