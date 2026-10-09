import express from "express";

import { uploadProductImages , uploadCategoryImage } from "../controllers/uploadController.js";
import {uploadProduct , uploadCategory} from "../middleware/uploadMiddleware.js";
import { protect }  from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post(
  "/products",
  protect,
  admin,
  uploadProduct.array("images", 8),
  uploadProductImages
);

router.post(
  "/categories",
  protect,
  admin,
  uploadCategory.single("image"),
  uploadCategoryImage
)

export default router;