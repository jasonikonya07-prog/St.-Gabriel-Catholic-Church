import { Router } from "express";
import { login, logout, me } from "../controllers/adminAuthController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", protectAdmin, me);
router.post("/logout", protectAdmin, logout);

export default router;
