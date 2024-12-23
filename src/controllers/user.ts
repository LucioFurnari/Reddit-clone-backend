import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
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