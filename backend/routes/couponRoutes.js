import express from "express";

import {
  validateCoupon,
  createCoupon,
  getCoupons,
  getAvailableCoupons,
  deleteCoupon,
} from "../controllers/couponController.js";

import {protect} from "../middleware/authMiddleware.js";
import  {admin} from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/validate", protect, validateCoupon);

router.get("/available", getAvailableCoupons);

router.get("/", protect, admin, getCoupons);

router.post("/", protect, admin, createCoupon);

router.delete("/:id", protect, admin, deleteCoupon);

export default router;