import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";

import { 
  isValidObjectId,
  parsePositiveInteger,
  createSlug,
} from "../utils/validation.js";


// Get all active categories - customer
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({
    isActive: true,
  }).sort({
    sortOrder: 1,
    name: 1,
  });

  res.status(200).json({
    success: true,
    data: {
      categories,
    },
  });
});

// Get single category
export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)){
    res.status(400);
    throw new Error("Invalid category ID.");
  }

  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

const getSafeAdminCategory = (category) => ({
  _id: category._id,
  name: category.name,
  slug: category.slug,
  sortOrder: category.sortOrder,
  isActive: category.isActive,
  image: category.image,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

const normalizeCategoryImage = (image) => {
  if (typeof image === "string") {
    return { url: image.trim(), publicId: "" };
  }

  return {
    url: typeof image?.url === "string" ? image.url.trim() : "",
    publicId:
      typeof image?.publicId === "string" ? image.publicId.trim() : "",
  };
};

// Get all categories - admin
export const getAdminCategories = asyncHandler(async (req, res) => {
  const {
    search = "",
    status = "",
    page = 1,
    limit = 10,
  } = req.query;

  const pageNumber = parsePositiveInteger(page, 1);
  const limitNumber = parsePositiveInteger(limit, 10);

  if (pageNumber === null) {
    res.status(400);
    throw new Error("Page must be a positive integer.");
  }

  if (limitNumber === null) {
    res.status(400);
    throw new Error("Limit must be a positive integer.");
  }

  if (limitNumber > 50) {
    res.status(400);
    throw new Error("Limit cannot be greater than 50.");
  }

  const filter = {};

  const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (typeof search !== "string") {
    res.status(400);
    throw new Error("Search must be a string.");
  }

  const searchValue = escapeRegex(search.trim());

  if (searchValue) {
    filter.$or = [
      {
        name: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        slug: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  if (
    status &&
    !["active", "inactive"].includes(status)
  ) {
    res.status(400);
    throw new Error(
      "Invalid category status. Use active or inactive."
    );
  }

  if (status === "active") {
    filter.isActive = true;
  }

  if (status === "inactive") {
    filter.isActive = false;
  }

  const total = await Category.countDocuments(filter);

  const categories = await Category.find(filter)
    .sort({
      sortOrder: 1,
      createdAt: -1,
    })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  res.status(200).json({
    success: true,
    data: {
      categories: categories.map(getSafeAdminCategory),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    },
  });
});

// Create category
export const createCategory = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    image,
    sortOrder,
    isActive,
  } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error("Category name is required");
  }

  const finalSlug = slug?.trim()
  ? createSlug(slug)
    : createSlug(name);

  if (!finalSlug) {
    res.status(400);
    throw new Error("A valid category slug is required.");
  }

  const existingCategory = await Category.findOne({
    $or: [
      { name: name.trim() },
      { slug: finalSlug },
    ],
  });

  if (existingCategory) {
    res.status(409);
    throw new Error(
      "Category with this name or slug already exists"
    );
  }

  let normalizedSortOrder = 0;
  if (
    sortOrder !== undefined &&
    sortOrder !== null &&
    sortOrder !== ""
  ) {
    normalizedSortOrder = Number(sortOrder);

    if (
      !Number.isInteger(normalizedSortOrder) ||
      normalizedSortOrder < 0
    ) {
      res.status(400);
      throw new Error(
        "Sort order must be a non-negative whole number."
      );
    }
  }

  const category = await Category.create({
    name: name.trim(),
    slug: finalSlug,
    description: description?.trim() || "",
    image: normalizeCategoryImage(image),
    sortOrder: normalizedSortOrder,
    isActive: isActive !== false,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

// Update category
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid category ID.");
  } 

  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const {
    name,
    slug,
    description,
    image,
    sortOrder,
    isActive,
  } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error("Category name is required");
  }

  const finalSlug = slug?.trim()
    ? createSlug(slug)
    : createSlug(name);

  if (!finalSlug) {
    res.status(400);
    throw new Error("A valid category slug is required.");
  }

  const duplicateCategory = await Category.findOne({
    _id: { $ne: category._id },
    $or: [
      { name: name.trim() },
      { slug: finalSlug },
    ],
  });

  if (duplicateCategory) {
    res.status(400);
    throw new Error(
      "Another category with this name or slug already exists"
    );
  }

  const normalizedSortOrder = Number(sortOrder);
  if (
    !Number.isInteger(normalizedSortOrder) ||
    normalizedSortOrder < 0
  ) {
    res.status(400);
    throw new Error(
      "Sort order must be a non-negative whole number."
    );
  }

  category.name = name.trim();
  category.slug = finalSlug;
  category.description = description?.trim() || "";
  category.image = normalizeCategoryImage(image);
  category.sortOrder = normalizedSortOrder,
  category.isActive = isActive !== false;

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

// Toggle category status
export const toggleCategoryStatus = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400);
      throw new Error("Invalid category ID.");
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    category.isActive = !category.isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${
        category.isActive ? "activated" : "deactivated"
      } successfully`,
      data: category,
    });
  }
);

// Delete category
export const deleteCategory = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400);
      throw new Error("Invalid category ID.");
    }

    const category = await Category.findById(id);

    if (!category) {
      res.status(404);
      throw new Error("Category not found.");
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  }
);