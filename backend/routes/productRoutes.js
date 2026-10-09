import express from "express";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  toggleProductStatus,
} from "../controllers/productController.js";

import {protect} from "../middleware/authMiddleware.js";
import {admin} from "../middleware/adminMiddleware.js";

const router = express.Router();


// Public
router.get("/", getProducts);

router.get(
  "/admin/list",
  protect,
  admin,
  getAdminProducts
);

router.patch(
  "/admin/:id/status",
  protect,
  admin,
  toggleProductStatus
);

router.get("/:id", getProductById);


// Admin
router.post("/", protect, admin, createProduct);

router.put("/:id", protect, admin, updateProduct);

router.delete("/:id", protect, admin, deleteProduct);


export default router;