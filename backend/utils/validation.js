import mongoose from "mongoose";

export const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

export const parsePositiveNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number;
};

export const parsePositiveInteger = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return null;
  }

  return number;
};

export const createSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const validateRequiredFields = (payload = {}, requiredFields = []) => {
  const errors = [];

  for (const field of requiredFields) {
    const value = payload[field];

    if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
      errors.push({ field, message: `${field} is required.` });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateRequest = (payload = {}, requiredFields = []) => {
  const result = validateRequiredFields(payload, requiredFields);

  return {
    ...result,
    message: result.isValid ? "Validation passed." : "Validation failed.",
  };
};