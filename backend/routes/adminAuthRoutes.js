import { Router } from "express";
import { login, logout, me } from "../controllers/adminAuthController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", protectAdmin, logout);
router.get("/me", protectAdmin, me);

export default router;
