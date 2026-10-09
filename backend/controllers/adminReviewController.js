import asyncHandler from "express-async-handler";
import Review from "../models/Review.js";
import updateProductRating from "../utils/updateProductRating.js";
import mongoose from "mongoose";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getSafeAdminReview = (review) => ({
  id: review._id,
  user: review.user
    ? {
        id: review.user._id,
        name: review.user.name,
        email: review.user.email,
        avatar: review.user.avatar || "",
      }
    : null,
  product: review.product
    ? {
        id: review.product._id,
        name: review.product.name,
        price: review.product.price,
        images: Array.isArray(review.product.images)
          ? review.product.images
              .map((image) => {
                if (typeof image === "string") {
                  return { url: image };
                }

                if (!image?.url) {
                  return null;
                }

                return { url: image.url };
              })
              .filter(Boolean)
          : [],
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

const validateReviewId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid review ID.");
    error.statusCode = 400;
    throw error;
  }
};

// Get all reviews
export const getAdminReviews = asyncHandler(async (req, res) => {
  const {
    search = "",
    approved = "",
    rating = "",
    page = 1,
    limit = 10,
  } = req.query;

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1
  ) {
    res.status(400);
    throw new Error("Page must be a positive integer.");
  }

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 50
  ) {
    res.status(400);
    throw new Error(
      "Limit must be an integer between 1 and 50."
    );
  }

  const pageNumber = parsedPage;
  const limitNumber = parsedLimit;

  const filter = {};

  if (typeof search !== "string") {
    res.status(400);
    throw new Error("Search must be a string.");
  }

  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    const escapedSearch = escapeRegex(trimmedSearch);

    filter.$or = [
      {
        title: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        comment: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  if (
    approved &&
    !["approved", "pending"].includes(approved)
  ) {
    res.status(400);
    throw new Error(
      "Approved filter must be approved or pending."
    );
  }

  if (approved === "approved") {
    filter.isApproved = true;
  }

  if (approved === "pending") {
    filter.isApproved = false;
  }

  if (rating !== "") {
    const parsedRating = Number(rating);

    if (
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      res.status(400);
      throw new Error(
        "Rating must be an integer between 1 and 5."
      );
    }

    filter.rating = parsedRating;
  }

  const total = await Review.countDocuments(filter);

  const reviews = await Review.find(filter)
    .populate("user", "name email avatar")
    .populate("product", "name images price")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  res.status(200).json({
    success: true,
    data: {
      reviews: reviews.map(getSafeAdminReview),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    },
  });
});

// Get single review
export const getAdminReviewById = asyncHandler(
  async (req, res) => {
    validateReviewId(req.params.id);

    const review = await Review.findById(req.params.id)
      .populate("user", "name email avatar")
      .populate("product", "name images price");

    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }

    res.status(200).json({
      success: true,
      data: {
        review: getSafeAdminReview(review),
      },
    });
  }
);

// Approve / reject review
export const updateReviewApproval = asyncHandler(async (req, res) => {
  validateReviewId(req.params.id);

  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  const { isApproved } = req.body;

  if (typeof isApproved !== "boolean") {
    res.status(400);
    throw new Error("isApproved must be true or false");
  }

  review.isApproved = isApproved;

  await review.save();

  await updateProductRating(review.product);

  res.status(200).json({
    success: true,
    message: isApproved
      ? "Review approved successfully"
      : "Review rejected successfully",
    data: {
      review: getSafeAdminReview(review),
    },
  });
});

// Delete review
export const deleteAdminReview = asyncHandler(async (req, res) => {
  validateReviewId(req.params.id);
  
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  const productId = review.product;

  await Review.findByIdAndDelete(req.params.id);

  await updateProductRating(productId);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

