import { Router } from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementBySlug,
  listAllAnnouncements,
  listAnnouncements,
  publishAnnouncement,
  updateAnnouncement,
} from "../controllers/announcementController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateAnnouncementCreate, validateAnnouncementUpdate } from "../middleware/validateMiddleware.js";

const router = Router();

router.get("/", listAnnouncements);
router.get("/admin/all", authenticate, listAllAnnouncements);
router.get("/:slug", getAnnouncementBySlug);
router.post("/", authenticate, validateAnnouncementCreate, createAnnouncement);
router.patch("/:id", authenticate, validateAnnouncementUpdate, updateAnnouncement);
router.patch("/:id/publish", authenticate, publishAnnouncement);
router.delete("/:id", authenticate, deleteAnnouncement);

export default router;
