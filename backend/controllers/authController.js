import asyncHandler from "express-async-handler";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { validateRequest } from "../utils/validation.js";

const getSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || "",
  phone: user.phone || "",
  isActive: user.isActive,
});

// REGISTER
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const requiredValidation = validateRequest(req.body, ["name", "email", "password"]);

  if (!requiredValidation.isValid) {
    res.status(400);

    const error = new Error(requiredValidation.message);
    error.errors = requiredValidation.errors;

    throw error;
  }

  if (typeof name !== "string") {
    res.status(400);

    const error = new Error("Validation failed.");
    error.errors = [
      {
        field: "name",
        message: "Name must be text.",
      },
    ];

    throw error;
  }

  if (typeof email !== "string") {
    res.status(400);

    const error = new Error("Validation failed.");
    error.errors = [
      {
        field: "email",
        message: "Email must be text.",
      },
    ];

    throw error;
  }

  if (typeof password !== "string") {
    res.status(400);

    const error = new Error("Validation failed.");
    error.errors = [
      {
        field: "password",
        message: "Password must be text.",
      },
    ];

    throw error;
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  // Name validation
  if (normalizedName.length < 2) {
    res.status(400);

    const error = new Error("Validation failed.");
    error.errors = [
      {
        field: "name",
        message: "Name must be at least 2 characters long.",
      },
    ];

    throw error;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    res.status(400);

    const error = new Error("Validation failed.");
    error.errors = [
      {
        field: "email",
        message: "Please enter a valid email address.",
      },
    ];

    throw error;
  }

  // Password validation
  if (password.length < 8) {
    res.status(400);

    const error = new Error("Validation failed.");
    error.errors = [
      {
        field: "password",
        message: "Password must be at least 8 characters long.",
      },
    ];

    throw error;
  }

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    res.status(409);
    throw new Error("User already exists with this email.");
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: "Registration successful.",
    data: {
      user: getSafeUser(user),
      token,
    },
  });
});

// LOGIN
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const requiredValidation = validateRequest(req.body, ["email", "password"]);

  if (!requiredValidation.isValid) {
    res.status(400);

    const error = new Error(requiredValidation.message);
    error.errors = requiredValidation.errors;

    throw error;
  }

  if (typeof email !== "string") {
    res.status(400);

    const error = new Error("Validation failed.");
    error.errors = [
      {
        field: "email",
        message: "Email must be text.",
      },
    ];

    throw error;
  }

  if (typeof password !== "string") {
    res.status(400);

    const error = new Error("Validation failed.");
    error.errors = [
      {
        field: "password",
        message: "Password must be text.",
      },
    ];

    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    res.status(400);

    const error = new Error("Validation failed.");
    error.errors = [
      {
        field: "email",
        message: "Please enter a valid email address.",
      },
    ];

    throw error;
  }

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated.");
  }

  const isPasswordMatch = await user.matchPassword(password);

  if (!isPasswordMatch) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  user.lastLogin = new Date();

  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      user: getSafeUser(user),
      token,
    },
  });
});

// GET CURRENT USER
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: getSafeUser(req.user),
    },
  });
});

export {
  registerUser,
  loginUser,
  getMe,
};