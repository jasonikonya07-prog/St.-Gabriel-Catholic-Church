import { Router } from "express";
import {
  createContactMessage,
  deleteContactMessage,
  getContactMessage,
  listContactMessages,
  updateContactStatus,
} from "../controllers/contactController.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";
import { requireButtonEnabled } from "../middleware/buttonControlMiddleware.js";
import { validateContactMessage, validateContactStatus } from "../middleware/validateMiddleware.js";

const router = Router();

router.post("/", requireButtonEnabled("contact_us"), optionalAuth, validateContactMessage, createContactMessage);
router.get("/", authenticate, listContactMessages);
router.get("/:id", authenticate, getContactMessage);
router.patch("/:id/status", authenticate, validateContactStatus, updateContactStatus);
router.delete("/:id", authenticate, deleteContactMessage);

export default router;
