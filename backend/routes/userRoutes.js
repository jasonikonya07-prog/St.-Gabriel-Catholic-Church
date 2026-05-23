import { Router } from "express";
import { getUserProfile, loginUser, logoutUser, registerUser } from "../controllers/userAuthController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protectUser, getUserProfile);
router.post("/logout", protectUser, logoutUser);

export default router;
