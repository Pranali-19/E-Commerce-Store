import express from "express";

import {
  getDashboardStats,
  getRecentOrders,
  getLowStockProducts,
  getRecentUsers,
} from "../controllers/adminController.js";

import { protect}from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  admin,
  getDashboardStats
);

router.get(
  "/recent-orders",
  protect,
  admin,
  getRecentOrders
);

router.get(
  "/low-stock",
  protect,
  admin,
  getLowStockProducts
);

router.get(
  "/recent-users",
  protect,
  admin,
  getRecentUsers
);

export default router;