import express from "express";

import {
  getInventoryOverview,
  getInventoryProducts,
  getInventoryProduct,
  adjustInventory,
  getInventoryLogs,
} from "../controllers/adminInventoryController.js";

import {protect} from "../middleware/authMiddleware.js";
import {admin} from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get(
  "/overview",
  protect,
  admin,
  getInventoryOverview
);

router.get(
  "/",
  protect,
  admin,
  getInventoryProducts
);

router.get(
  "/:id",
  protect,
  admin,
  getInventoryProduct
);

router.patch(
  "/:id/adjust",
  protect,
  admin,
  adjustInventory
);

router.get(
  "/:id/logs",
  protect,
  admin,
  getInventoryLogs
);

export default router;