import { Router } from "express";
import { deleteSubscriber, listSubscribers, subscribe, unsubscribe } from "../controllers/newsletterController.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";
import { requireButtonEnabled } from "../middleware/buttonControlMiddleware.js";
import { validateNewsletterSubscribe, validateNewsletterUnsubscribe } from "../middleware/validateMiddleware.js";

const router = Router();

router.post("/subscribe", requireButtonEnabled("newsletter_subscribe"), optionalAuth, validateNewsletterSubscribe, subscribe);
router.post("/unsubscribe", validateNewsletterUnsubscribe, unsubscribe);
router.get("/subscribers", authenticate, listSubscribers);
router.delete("/subscribers/:id", authenticate, deleteSubscriber);

export default router;
