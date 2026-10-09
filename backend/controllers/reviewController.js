import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const MIN_REVIEW_COMMENT_LENGTH = 3;
const MAX_REVIEW_COMMENT_LENGTH = 2000;
const MAX_REVIEW_TITLE_LENGTH = 150;

const getSafeReview = (review) => ({
  id: review._id,
  user: review.user
    ? {
        id: review.user._id,
        name: review.user.name,
        avatar: review.user.avatar || "",
      }
    : null,
  product: review.product
    ? {
        id: review.product._id,
        name: review.product.name,
      }
    : null,
  rating: review.rating,
  title: review.title || "",
  comment: review.comment || "",
  isVerifiedPurchase: review.isVerifiedPurchase,
  isApproved: review.isApproved,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const validateReviewInput = ({
  rating,
  title,
  comment,
}) => {
  const errors = [];

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    errors.push({
      field: "rating",
      message: "Rating must be an integer between 1 and 5.",
    });
  }

  if (
    typeof comment !== "string" ||
    !comment.trim()
  ) {
    errors.push({
      field: "comment",
      message: "Please write a review.",
    });
  } else if (
    comment.trim().length < MIN_REVIEW_COMMENT_LENGTH
  ) {
    errors.push({
      field: "comment",
      message: `Review must contain at least ${MIN_REVIEW_COMMENT_LENGTH} characters.`,
    });
  } else if (
    comment.trim().length > MAX_REVIEW_COMMENT_LENGTH
  ) {
    errors.push({
      field: "comment",
      message: `Review cannot exceed ${MAX_REVIEW_COMMENT_LENGTH} characters.`,
    });
  }

  if (title !== undefined && title !== null) {
    if (typeof title !== "string") {
      errors.push({
        field: "title",
        message: "Review title must be text.",
      });
    } else if (title.trim().length > MAX_REVIEW_TITLE_LENGTH) {
      errors.push({
        field: "title",
        message: `Review title cannot exceed ${MAX_REVIEW_TITLE_LENGTH} characters.`,
      });
    }
  }

  return errors;
};

const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product ID.");
  }

  const reviews = await Review.find({
    product: productId,
    isApproved: true,
  })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: reviews.map(getSafeReview),
  });
});

const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product ID.");
  }

  const validationErrors = validateReviewInput({
    rating,
    title,
    comment,
  });

  if (validationErrors.length > 0) {
    res.status(400);

    const error = new Error("Review validation failed.");
    error.errors = validationErrors;

    throw error;
  }

  const normalizedRating = Number(rating);
  const normalizedTitle =
    typeof title === "string"
      ? title.trim()
      : "";
  const normalizedComment = comment.trim();

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existingReview) {
    res.status(400);
    throw new Error("You have already reviewed this product.");
  }

  // Check whether the customer purchased this product
  const purchasedOrder = await Order.findOne({
    user: req.user._id,
    orderStatus: "delivered",
    "items.product": productId,
  });

  const isVerifiedPurchase = Boolean(purchasedOrder);

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating: normalizedRating,
    title: normalizedTitle,
    comment: normalizedComment,
    isVerifiedPurchase,
    isApproved: true,
  });

  // Recalculate product rating
  const ratingStats = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        isApproved: true,
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: {
          $avg: "$rating",
        },
        reviewCount: {
          $sum: 1,
        },
      },
    },
  ]);

  if (ratingStats.length > 0) {
    product.ratings.average = Number(
      ratingStats[0].averageRating.toFixed(1)
    );

    product.ratings.count = ratingStats[0].reviewCount;

    await product.save();
  }

  const populatedReview = await Review.findById(review._id).populate(
    "user",
    "name avatar"
  );

  res.status(201).json({
    success: true,
    message: isVerifiedPurchase
      ? "Verified purchase review submitted successfully."
      : "Review submitted successfully.",
    data: getSafeReview(populatedReview),
  });
});

const getMyReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product ID.");
  }

  const review = await Review.findOne({
    user: req.user._id,
    product: productId,
  }).populate("user", "name avatar");

  res.status(200).json({
    success: true,
    data: review 
      ? getSafeReview(review)
      : null,
  });
});

const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, title, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    res.status(400);
    throw new Error("Invalid review ID.");
  }

  const validationErrors = validateReviewInput({
    rating,
    title,
    comment,
  });

  if (validationErrors.length > 0) {
    res.status(400);

    const error = new Error("Review validation failed.");
    error.errors = validationErrors;

    throw error;
  }

  const review = await Review.findOne({
    _id: reviewId,
    user: req.user._id,
  });

  if (!review) {
    res.status(404);
    throw new Error("Review not found.");
  }

  review.rating = Number(rating);
  review.title =
    typeof title === "string"
      ? title.trim()
      : "";
  review.comment = comment.trim();

  await review.save();

  // Recalculate rating
  const ratingStats = await Review.aggregate([
    {
      $match: {
        product: review.product,
        isApproved: true,
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: {
          $avg: "$rating",
        },
        reviewCount: {
          $sum: 1,
        },
      },
    },
  ]);

  await Product.findByIdAndUpdate(review.product, {
    "ratings.average":
      ratingStats.length > 0
        ? Number(ratingStats[0].averageRating.toFixed(1))
        : 0,
    "ratings.count":
      ratingStats.length > 0
        ? ratingStats[0].reviewCount
        : 0,
  });

  const updatedReview = await Review.findById(review._id).populate(
    "user",
    "name avatar"
  );

  res.status(200).json({
    success: true,
    message: "Review updated successfully.",
    data: getSafeReview(updatedReview),
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    res.status(400);
    throw new Error("Invalid review ID.");
  }

  const review = await Review.findOneAndDelete({
    _id: reviewId,
    user: req.user._id,
  });

  if (!review) {
    res.status(404);
    throw new Error("Review not found.");
  }

  // Recalculate rating
  const ratingStats = await Review.aggregate([
    {
      $match: {
        product: review.product,
        isApproved: true,
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: {
          $avg: "$rating",
        },
        reviewCount: {
          $sum: 1,
        },
      },
    },
  ]);

  await Product.findByIdAndUpdate(review.product, {
    "ratings.average":
      ratingStats.length > 0
        ? Number(ratingStats[0].averageRating.toFixed(1))
        : 0,
    "ratings.count":
      ratingStats.length > 0
        ? ratingStats[0].reviewCount
        : 0,
  });

  res.status(200).json({
    success: true,
    message: "Review deleted successfully.",
  });
});

export {
  getProductReviews,
  createReview,
  getMyReview,
  updateReview,
  deleteReview,
};