import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEventBySlug,
  listAllEvents,
  listEvents,
  publishEvent,
  updateEvent,
} from "../controllers/eventController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateEventCreate, validateEventUpdate } from "../middleware/validateMiddleware.js";

const router = Router();

router.get("/", listEvents);
router.get("/admin/all", authenticate, listAllEvents);
router.get("/:slug", getEventBySlug);
router.post("/", authenticate, validateEventCreate, createEvent);
router.patch("/:id", authenticate, validateEventUpdate, updateEvent);
router.patch("/:id/publish", authenticate, publishEvent);
router.delete("/:id", authenticate, deleteEvent);

export default router;
