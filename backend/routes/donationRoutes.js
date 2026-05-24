import { Router } from "express";
import {
  createDonation,
  deleteDonation,
  donationStats,
  getDonation,
  listDonations,
  updateDonationStatus,
  verifyDonation,
} from "../controllers/donationController.js";
import { authenticate, authorize, optionalAuth } from "../middleware/authMiddleware.js";
import { requireButtonEnabled } from "../middleware/buttonControlMiddleware.js";
import { validateDonation, validateDonationStatus } from "../middleware/validateMiddleware.js";
import mpesaRoutes from "./mpesaRoutes.js";

const router = Router();
const financeAccess = authorize("super admin", "admin", "finance");

router.use("/mpesa", mpesaRoutes);
router.post("/", requireButtonEnabled("donate_now"), optionalAuth, validateDonation, createDonation);
router.get("/verify/:transactionCode", verifyDonation);
router.get("/", authenticate, financeAccess, listDonations);
router.get("/stats", authenticate, financeAccess, donationStats);
router.get("/:id", authenticate, financeAccess, getDonation);
router.patch("/:id/status", authenticate, financeAccess, validateDonationStatus, updateDonationStatus);
router.delete("/:id", authenticate, financeAccess, deleteDonation);

export default router;
