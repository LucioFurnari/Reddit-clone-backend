import { Router } from "express";
import { updateUserProfile } from "../controllers/user";
import { authenticateToken } from "../controllers/auth";

const router = Router();

router.put("/profile", authenticateToken, updateUserProfile);

export default router;