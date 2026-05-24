import { Router } from "express";
import {
  createPrayerRequest,
  deletePrayerRequest,
  getPrayerRequest,
  listPrayerRequests,
  updatePrayerStatus,
} from "../controllers/prayerController.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";
import { requireButtonEnabled } from "../middleware/buttonControlMiddleware.js";
import { validatePrayerRequest, validatePrayerStatus } from "../middleware/validateMiddleware.js";

const router = Router();

router.post("/", requireButtonEnabled("prayer_request"), optionalAuth, validatePrayerRequest, createPrayerRequest);
router.get("/", authenticate, listPrayerRequests);
router.get("/:id", authenticate, getPrayerRequest);
router.patch("/:id/status", authenticate, validatePrayerStatus, updatePrayerStatus);
router.delete("/:id", authenticate, deletePrayerRequest);

export default router;
