import { Router } from "express";
import { getMpesaStatus, handleMpesaCallback, sendStkPush } from "../controllers/mpesaController.js";
import { protectUser } from "../middleware/authMiddleware.js";
import { requireButtonEnabled } from "../middleware/buttonControlMiddleware.js";
import { validateMpesaDonation } from "../middleware/validateMiddleware.js";

const router = Router();

router.post("/stk-push", requireButtonEnabled("donate_now"), protectUser, validateMpesaDonation, sendStkPush);
router.post("/callback", handleMpesaCallback);
router.get("/status/:checkoutRequestId", getMpesaStatus);

export default router;
