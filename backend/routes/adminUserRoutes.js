import { Router } from "express";
import { listUsers, updateUser } from "../controllers/adminUserController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate, authorize("super_admin", "admin"));
router.get("/", listUsers);
router.patch("/:id", updateUser);

export default router;
