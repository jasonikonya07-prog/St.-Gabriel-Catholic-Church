import { Router } from "express";
import {
  getAdminSettings,
  getButtonControls,
  getPublicSettings,
  getSettings,
  updateAuthOptions,
  updateButtonControl,
  updateMaintenance,
  updateSettings,
} from "../controllers/settingsController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/public", getPublicSettings);
router.get("/buttons", getButtonControls);
router.get("/admin", authenticate, getAdminSettings);
router.patch("/maintenance", authenticate, updateMaintenance);
router.patch("/auth-options", authenticate, updateAuthOptions);
router.patch("/buttons/:buttonKey", authenticate, updateButtonControl);

router.get("/", getSettings);
router.patch("/", authenticate, updateSettings);

export default router;
