import { Router } from "express";
import { login, logout, me } from "../controllers/authController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";
import { validateLogin } from "../middleware/validateMiddleware.js";

const router = Router();

router.post("/login", validateLogin, login);
router.get("/me", protectAdmin, me);
router.post("/logout", protectAdmin, logout);

export default router;
