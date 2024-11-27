import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";


export async function signup(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword },
      });
      res.status(201).json({ message: "User created", user });
  } catch (err) {
      res.status(400).json({ error: "Email already exists" });
  }
};

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "Logged in", token });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

export async function logout(req: Request, res: Response) {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};