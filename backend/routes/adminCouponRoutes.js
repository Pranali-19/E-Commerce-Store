import express from "express";

import {
  getAdminCoupons,
  getAdminCouponById,
  createAdminCoupon,
  updateAdminCoupon,
  toggleCouponStatus,
  deleteAdminCoupon,
} from "../controllers/adminCouponController.js";

import {protect} from "../middleware/authMiddleware.js";
import {admin} from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", protect, admin, getAdminCoupons);

router.get("/:id", protect, admin, getAdminCouponById);

router.post("/", protect, admin, createAdminCoupon);

router.put("/:id", protect, admin, updateAdminCoupon);

router.patch(
  "/:id/status",
  protect,
  admin,
  toggleCouponStatus
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteAdminCoupon
);

export default router;