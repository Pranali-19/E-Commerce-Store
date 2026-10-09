import express from "express";

import {
  getProductReviews,
  createReview,
  getMyReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

import  {protect} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);

router.get(
  "/product/:productId/my",
  protect,
  getMyReview
);

router.post(
  "/product/:productId",
  protect,
  createReview
);

router.put(
  "/:reviewId",
  protect,
  updateReview
);

router.delete(
  "/:reviewId",
  protect,
  deleteReview
);

export default router;