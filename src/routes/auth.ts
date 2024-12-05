import { Router } from "express";
import { signup, login, logout, getUserInfo, authenticateToken } from "../controllers/auth";

const router = Router();

// Sign up
router.post("/signup", signup);

// Log in
router.post("/login", login);

// Log out
router.post("/logout", logout);

// Get user info
router.get("/user", authenticateToken, getUserInfo);

export default router;
