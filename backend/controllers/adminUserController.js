import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import User from "../models/User.js";

const MAX_PAGE_SIZE = 50;

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getSafeAdminUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || "",
  phone: user.phone || "",
  isActive: user.isActive,
  lastLogin: user.lastLogin || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid user ID.");
    error.statusCode = 400;
    throw error;
  }
};

// Get all users
export const getAdminUsers = asyncHandler(async (req, res) => {
  const {
    search = "",
    role = "",
    status = "",
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

    const error = new Error("Page must be a positive integer.");
    error.errors = [
      {
        field: "page",
        message: "Page must be a positive integer.",
      },
    ];

    throw error;
  }

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > MAX_PAGE_SIZE
  ) {
    res.status(400);

    const error = new Error(
      `Limit must be an integer between 1 and ${MAX_PAGE_SIZE}.`
    );

    error.errors = [
      {
        field: "limit",
        message: `Limit must be an integer between 1 and ${MAX_PAGE_SIZE}.`,
      },
    ];

    throw error;
  }

  const pageNumber = parsedPage;
  const limitNumber = parsedLimit;

  const filter = {};

  // Search by name or email
  if (typeof search !== "string") {
    res.status(400);

    const error = new Error("Search must be text.");
    error.errors = [
      {
        field: "search",
        message: "Search must be text.",
      },
    ];

    throw error;
  }

  const normalizedSearch = search.trim();

  if (normalizedSearch) {
    const safeSearch = escapeRegex(normalizedSearch);

    filter.$or = [
      {
        name: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        email: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  // Role filter
  if (role === "customer" || role === "admin") {
    filter.role = role;
  }

  // Status filter
  if (status === "active") {
    filter.isActive = true;
  }

  if (status === "inactive") {
    filter.isActive = false;
  }

  const total = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select(
      "-password"
    )
    .sort({
      createdAt: -1,
    })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);
  
  const safeUsers = users.map(getSafeAdminUser);

  res.status(200).json({
    success: true,
    data: {
      users : safeUsers,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    },
  });
});

// Get single user
export const getAdminUserById = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    validateObjectId(id);

    const user = await User.findById(id).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    res.status(200).json({
      success: true,
      data: {
        user: getSafeAdminUser(user),
      },
    });
  }
);

// Toggle active/inactive
export const toggleUserStatus = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    validateObjectId(id);

    const user = await User.findById(id);

    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    // Prevent admin from disabling their own account
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error(
        "You cannot deactivate your own account."
      );
    }

    user.isActive = !user.isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        user: getSafeAdminUser(user),
      },
    });
  }
);

// Change user role
export const updateUserRole = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    validateObjectId(id);

    const user = await User.findById(id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const { role } = req.body;

    if (typeof role !== "string") {
      res.status(400);

      const error = new Error("User role must be text.");
      error.errors = [
        {
          field: "role",
          message: "User role must be text.",
        },
      ];

      throw error;
    }

    const normalizedRole = role.trim().toLowerCase();

    if (!["customer", "admin"].includes(normalizedRole)) {
        res.status(400);
      throw new Error("Invalid user role");
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error(
        "You cannot change your own role"
      );
    }

    user.role = normalizedRole;

    await user.save();

    res.status(200).json({
      success: true,
      message: `User role changed to ${normalizedRole}.`,
      data: {
        user: getSafeAdminUser(user),
      },
    });
  }
);