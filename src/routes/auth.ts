import { Router } from "express";
import { signup, login, logout } from "../controllers/auth";

const router = Router();

// Sign up
router.post("/signup", signup);

// Log in
router.post("/login", login);

// Log out
router.post("/logout", logout);

export default router;
