import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/stats", protectAdmin, getDashboardStats);

export default router;
