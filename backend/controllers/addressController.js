import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Address from "../models/Address.js";

const getSafeAddress = (address) => ({
  id: address._id,
  fullName: address.fullName,
  phone: address.phone,
  addressLine1: address.addressLine1,
  addressLine2: address.addressLine2 || "",
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  country: address.country,
  type: address.type,
  isDefault: address.isDefault,
  createdAt: address.createdAt,
  updatedAt: address.updatedAt,
});

const validateRequiredString = (value, fieldName) => {
  if (typeof value !== "string" || !value.trim()) {
    return `${fieldName} is required.`;
  }

  return null;
};

const validatePhone = (phone) => {
  if (typeof phone !== "string" || !phone.trim()) {
    return "Phone number is required.";
  }

  const normalizedPhone = phone.replace(/\s+/g, "");

  if (!/^[+]?[0-9]{10,15}$/.test(normalizedPhone)) {
    return "Please enter a valid phone number.";
  }

  return null;
};

const validatePostalCode = (postalCode) => {
  if (typeof postalCode !== "string" || !postalCode.trim()) {
    return "Postal code is required.";
  }

  if (!/^[a-zA-Z0-9 -]{3,10}$/.test(postalCode.trim())) {
    return "Please enter a valid postal code.";
  }

  return null;
};

const normalizeAddressData = (body) => {
  return {
    fullName:
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "",

    phone:
      typeof body.phone === "string"
        ? body.phone.trim()
        : "",

    addressLine1:
      typeof body.addressLine1 === "string"
        ? body.addressLine1.trim()
        : "",

    addressLine2:
      typeof body.addressLine2 === "string"
        ? body.addressLine2.trim()
        : "",

    city:
      typeof body.city === "string"
        ? body.city.trim()
        : "",

    state:
      typeof body.state === "string"
        ? body.state.trim()
        : "",

    postalCode:
      typeof body.postalCode === "string"
        ? body.postalCode.trim()
        : "",

    country:
      typeof body.country === "string" && body.country.trim()
        ? body.country.trim()
        : "India",

    type:
      typeof body.type === "string" && body.type.trim()
        ? body.type.trim().toLowerCase()
        : "home",

    isDefault: body.isDefault === true,
  };
};

const validateAddressData = (data) => {
  const errors = [];

  const requiredFields = [
    ["fullName", "Full name"],
    ["addressLine1", "Address line 1"],
    ["city", "City"],
    ["state", "State"],
  ];

  for (const [field, label] of requiredFields) {
    const error = validateRequiredString(data[field], label);

    if (error) {
      errors.push({
        field,
        message: error,
      });
    }
  }

  const phoneError = validatePhone(data.phone);

  if (phoneError) {
    errors.push({
      field: "phone",
      message: phoneError,
    });
  }

  const postalCodeError = validatePostalCode(data.postalCode);

  if (postalCodeError) {
    errors.push({
      field: "postalCode",
      message: postalCodeError,
    });
  }

  if (!["home", "work", "other"].includes(data.type)) {
    errors.push({
      field: "type",
      message: "Address type must be home, work, or other.",
    });
  }

  return errors;
};

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({
    user: req.user._id,
  }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    data: addresses.map(getSafeAddress),
  });
});

const getAddressById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid address ID.");
  }

  const address = await Address.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error("Address not found.");
  }

  res.status(200).json({
    success: true,
    data: getSafeAddress(address),
  });
});

const createAddress = asyncHandler(async (req, res) => {
  const addressData = normalizeAddressData(req.body);

  const errors = validateAddressData(addressData);

  if (errors.length > 0) {
    res.status(400);

    const error = new Error("Address validation failed");
    error.errors = errors;

    throw error;
  }

  const existingAddressCount = await Address.countDocuments({
    user: req.user._id,
  });

  const shouldBeDefault =
    addressData.isDefault || existingAddressCount === 0;

  if (shouldBeDefault) {
    await Address.updateMany(
      { user: req.user._id },
      { $set: { isDefault: false } }
    );
  }

  const address = await Address.create({
    user: req.user._id,
    ...addressData,
    isDefault: shouldBeDefault,
  });

  res.status(201).json({
    success: true,
    message: "Address added successfully.",
    data: getSafeAddress(address),
  });
});

const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid address ID.");
  }

  const address = await Address.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error("Address not found.");
  }

  const addressData = normalizeAddressData(req.body);

  const errors = validateAddressData(addressData);

  if (errors.length > 0) {
    res.status(400);

    const error = new Error("Address validation failed.");
    error.errors = errors;

    throw error;
  }

  if (addressData.isDefault) {
    await Address.updateMany(
      { user: req.user._id ,
        _id: {
          $ne: address.id,
        },
       },
      { $set: { isDefault: false } }
    );
  }

  address.fullName = addressData.fullName;
  address.phone = addressData.phone;
  address.addressLine1 = addressData.addressLine1;
  address.addressLine2 = addressData.addressLine2 ;
  address.city = addressData.city;
  address.state = addressData.state;
  address.postalCode = addressData.postalCode;
  address.country = addressData.country;
  address.type = addressData.type;
  address.isDefault = addressData.isDefault;

  await address.save();

  res.status(200).json({
    success: true,
    message: "Address updated successfully.",
    data: getSafeAddress(address),
  });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid address ID.");
  }

  const address = await Address.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error("Address not found.");
  }

  const wasDefault = address.isDefault;

  await address.deleteOne();

  if (wasDefault) {
    const nextAddress = await Address.findOne({
      user: req.user._id,
    }).sort({
      createdAt: -1,
    });

    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.status(200).json({
    success: true,
    message: "Address deleted successfully.",
  });
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid address ID.");
  }

  const address = await Address.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error("Address not found.");
  }

  await Address.updateMany(
    { user: req.user._id ,
      _id: {
        $ne: address._id,
      },
    },
    { $set: { isDefault: false } }
  );

  address.isDefault = true;

  await address.save();

  res.status(200).json({
    success: true,
    message: "Default address updated.",
    data: getSafeAddress(address),
  });
});

export {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};