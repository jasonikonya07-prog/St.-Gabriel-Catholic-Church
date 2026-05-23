import { Router } from "express";
import { getSecurityOverview, listAuditLogs, listFailedLoginAttempts } from "../controllers/securityController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();
const securityAccess = authorize("super admin", "admin");

router.use(authenticate, securityAccess);
router.get("/overview", getSecurityOverview);
router.get("/audit-logs", listAuditLogs);
router.get("/failed-logins", listFailedLoginAttempts);

export default router;
