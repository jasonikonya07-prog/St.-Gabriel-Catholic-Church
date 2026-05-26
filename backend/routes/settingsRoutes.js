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
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();
const manageSettings = authorize("super_admin", "admin");

router.get("/public", getPublicSettings);
router.get("/buttons", getButtonControls);
router.get("/admin", authenticate, getAdminSettings);
router.patch("/maintenance", authenticate, manageSettings, updateMaintenance);
router.patch("/auth-options", authenticate, manageSettings, updateAuthOptions);
router.patch("/buttons/:buttonKey", authenticate, manageSettings, updateButtonControl);

router.get("/", getSettings);
router.patch("/", authenticate, manageSettings, updateSettings);

export default router;
