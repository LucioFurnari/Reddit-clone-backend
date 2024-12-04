import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Signup validation schema
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

// Login validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

type LoginData = z.infer<typeof loginSchema>;

export async function login(req: Request, res: Response) {

  try {
    // Validate request body
    const data: LoginData = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Compare password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict", // Prevent CSRF
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    // Send success response
    return res.json({ message: "Logged in successfully", token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors.map((e) => e.message).join(", ")} );
    }

    console.error("Error during login: ", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export async function logout(req: Request, res: Response) {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};