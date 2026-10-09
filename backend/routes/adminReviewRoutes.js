import express from "express";

import {
  getAdminReviews,
  getAdminReviewById,
  updateReviewApproval,
  deleteAdminReview,
} from "../controllers/adminReviewController.js";

import {protect} from "../middleware/authMiddleware.js";
import {admin} from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  admin,
  getAdminReviews
);

router.get(
  "/:id",
  protect,
  admin,
  getAdminReviewById
);

router.patch(
  "/:id/approval",
  protect,
  admin,
  updateReviewApproval
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteAdminReview
);

export default router;