import { Router } from "express";
import { login, logout, me, register } from "../controllers/userAuthController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protectUser, logout);
router.get("/me", protectUser, me);

export default router;
