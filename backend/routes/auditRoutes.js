import { Router } from "express";
import { deleteAuditLog, deleteSecurityEvent, listAuditLogs, listSecurityEvents } from "../controllers/auditController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/audit-logs", authenticate, listAuditLogs);
router.get("/security-events", authenticate, listSecurityEvents);
router.delete("/audit-logs/:id", authenticate, authorize("super_admin"), deleteAuditLog);
router.delete("/security-events/:id", authenticate, authorize("super_admin"), deleteSecurityEvent);

export default router;
