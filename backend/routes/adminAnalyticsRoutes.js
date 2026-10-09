import express from "express";

import {
  getAnalyticsOverview,
  getRevenueAnalytics,
  getOrderAnalytics,
  getTopProducts,
  getCategoryAnalytics,
} from "../controllers/adminAnalyticsController.js";

import {protect} from "../middleware/authMiddleware.js";
import {admin} from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get(
  "/overview",
  protect,
  admin,
  getAnalyticsOverview
);

router.get(
  "/revenue",
  protect,
  admin,
  getRevenueAnalytics
);

router.get(
  "/orders",
  protect,
  admin,
  getOrderAnalytics
);

router.get(
  "/top-products",
  protect,
  admin,
  getTopProducts
);

router.get(
  "/categories",
  protect,
  admin,
  getCategoryAnalytics
);

export default router;