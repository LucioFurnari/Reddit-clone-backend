import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Validation schema for creating comments
const createCommentsSchema = z.object({
  content: z.string().min(1, { message: "Content cannot be empty," }),
  parentId: z.string().uuid().optional(), // Optional for replies
});