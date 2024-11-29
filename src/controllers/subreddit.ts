import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export async function createSubReddit(req: Request, res: Response) {
  const { name, description, creatorId } = req.body;
}