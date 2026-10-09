import express from "express";

import {
  getCategories,
  getCategoryById,
  getAdminCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../controllers/categoryController.js";

import {protect} from "../middleware/authMiddleware.js";
import {admin} from "../middleware/adminMiddleware.js";

const router = express.Router();

// Customer routes
router.get("/", getCategories);

// Admin routes
router.get(
  "/admin/list",
  protect,
  admin,
  getAdminCategories
);

router.post(
  "/",
  protect,
  admin,
  createCategory
);

router.put(
  "/:id",
  protect,
  admin,
  updateCategory
);

router.patch(
  "/admin/:id/status",
  protect,
  admin,
  toggleCategoryStatus
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteCategory
);

// Single category
router.get("/:id", getCategoryById);

export default router;