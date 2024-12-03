import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email format'}),
  username: z.string().min(8, { message: 'Username must be at least 8 characters long'}),
  password: z.string().min(8, {message: 'Password must be at least 8 characters long'}),
});

type SignupData = z.infer<typeof signupSchema>;

export async function signup(req: Request, res: Response) {

  try {
    // Parse and validate request body
    const data: SignupData = signupSchema.parse(req.body);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email: data.email, username: data.username, password: hashedPassword },
    });
    return res.status(201).json({ message: "User created", user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Handle validation errors
      return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
    }
      return  res.status(400).json({ error: "Email already exists" });
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