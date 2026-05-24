import { Router } from "express";
import { deleteAuditLog, deleteSecurityEvent, listAuditLogs, listSecurityEvents } from "../controllers/auditController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();
const auditLogRoutes = Router();
const securityEventRoutes = Router();

auditLogRoutes.get("/", authenticate, listAuditLogs);
auditLogRoutes.delete("/:id", authenticate, authorize("super_admin"), deleteAuditLog);

securityEventRoutes.get("/", authenticate, listSecurityEvents);
securityEventRoutes.delete("/:id", authenticate, authorize("super_admin"), deleteSecurityEvent);

router.use("/audit-logs", auditLogRoutes);
router.use("/security-events", securityEventRoutes);

export { auditLogRoutes, securityEventRoutes };
export default router;
