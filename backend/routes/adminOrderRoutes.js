import express from "express";

import {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
} from "../controllers/adminOrderController.js";

import {protect} from "../middleware/authMiddleware.js";
import {admin} from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", protect, admin, getAdminOrders);

router.get("/:id", protect, admin, getAdminOrderById);

router.patch(
  "/:id/status",
  protect,
  admin,
  updateAdminOrderStatus
);

export default router;