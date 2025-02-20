import { Request, Response } from "express";
import prisma from "../prisma";
import { z } from "zod";

// Validation schema
const updateUserSchema = z.object({
  bio: z.string().max(300, { message: "Bio cannot exceed 300 characters" }).optional(),
  profilePictureUrl: z.string().url({ message: "Invalid profile picture URL" }).optional(),
});

// Update user profile
export async function updateUserProfile(req: Request, res: Response) {
  const userId = req.user!.id; // Assuming the user ID is attached to the request from auth middleware

  try {
    // Parse and validate input
    const data = updateUserSchema.parse(req.body);

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio: data.bio,
        profilePictureUrl: data.profilePictureUrl,
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePictureUrl: true,
      },
    });

    return res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    console.error("Error updating user profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get Subscribed subreddits
export async function getSubscribedSubreddits(req: Request, res: Response) {
  const userId = req.user!.id;

   // Extract and parse query parameters with defaults
   const limit = req.query.limit ? parseInt(req.query.limit as string) : 10; // Default to 10
   const offset = req.query.offset ? parseInt(req.query.offset as string) : 0; // Default to 0

  try {
    // Fetch subscribed subreddits for the user
    const subscribedSubreddits = await prisma.userOnSubreddit.findMany({
      where: { userId },
      include: { subreddit: true },
      take: limit,
      skip: offset,
    });

    console.log(subscribedSubreddits);
    if (subscribedSubreddits.length === 0) {
      return res.status(404).json({ error: "No subscribed subreddits found.", subreddits: [] });
    };

    // Extract subreddit details from the subscription data
    const subreddits = subscribedSubreddits.map((subscription) => subscription.subreddit);

    return res.status(200).json({ message: "Subscribed subreddits fetches successfully.", subreddits });
  } catch (error) {
    console.error("Error fetching subscribed subreddits:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};