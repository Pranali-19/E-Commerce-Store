import asyncHandler from "express-async-handler";
import StoreSettings from "../models/StoreSettings.js";

const getSafeStoreSettings = (settings) => ({
  id: settings._id,

  storeName: settings.storeName,
  description: settings.description,

  supportEmail: settings.supportEmail,
  contactEmail: settings.contactEmail,
  phone: settings.phone,
  address: settings.address,

  currency: settings.currency,
  currencySymbol: settings.currencySymbol,

  taxEnabled: settings.taxEnabled,
  taxPercentage: settings.taxPercentage,

  shippingEnabled: settings.shippingEnabled,
  shippingCharge: settings.shippingCharge,
  freeShippingMinimum: settings.freeShippingMinimum,

  minimumOrderAmount: settings.minimumOrderAmount,
  lowStockThreshold: settings.lowStockThreshold,

  notificationsEnabled:
    settings.notificationsEnabled,

  emailNotificationsEnabled:
    settings.emailNotificationsEnabled,

  orderNotificationsEnabled:
    settings.orderNotificationsEnabled,

  maintenanceMode:
    settings.maintenanceMode,

  createdAt: settings.createdAt,
  updatedAt: settings.updatedAt,
});

// Get store settings
export const getStoreSettings = asyncHandler(async (req, res) => {
  let settings = await StoreSettings.findOne();

  // Create default settings if none exist
  if (!settings) {
    settings = await StoreSettings.create({});
  }

  res.status(200).json({
    success: true,
    data: getSafeStoreSettings(settings),
  });
});

// Update store settings
export const updateStoreSettings = asyncHandler(async (req, res) => {
  let settings = await StoreSettings.findOne();

  if (!settings) {
    settings = await StoreSettings.create({});
  }

  const allowedFields = [
    "storeName",
    "description",
    "supportEmail",
    "contactEmail",
    "phone",
    "address",
    "currency",
    "currencySymbol",
    "taxEnabled",
    "taxPercentage",
    "shippingEnabled",
    "shippingCharge",
    "freeShippingMinimum",
    "minimumOrderAmount",
    "lowStockThreshold",
    "notificationsEnabled",
    "emailNotificationsEnabled",
    "orderNotificationsEnabled",
    "maintenanceMode",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  });

  // Validate tax percentage
  if (
    settings.taxPercentage < 0 ||
    settings.taxPercentage > 100
  ) {
    res.status(400);
    throw new Error("Tax percentage must be between 0 and 100");
  }

  // Validate numeric values
  const numericFields = [
    "shippingCharge",
    "freeShippingMinimum",
    "minimumOrderAmount",
    "lowStockThreshold",
  ];

  for (const field of numericFields) {
    if (settings[field] < 0) {
      res.status(400);
      throw new Error(`${field} cannot be negative`);
    }
  }

  // Validate currency
  if (!settings.currency || settings.currency.length !== 3) {
    res.status(400);
    throw new Error("Currency must be a valid 3-letter code");
  }

  const updatedSettings = await settings.save();

  res.status(200).json({
    success: true,
    message: "Store settings updated successfully",
    data: getSafeStoreSettings(updatedSettings),
  });
});

// Get public store settings
export const getPublicStoreSettings = asyncHandler(
  async (req, res) => {
    let settings = await StoreSettings.findOne();

    if (!settings) {
      settings = await StoreSettings.create({});
    }

    res.status(200).json({
      success: true,
      data: {
        storeName: settings.storeName,
        description: settings.description,

        currency: settings.currency,
        currencySymbol: settings.currencySymbol,

        taxEnabled: settings.taxEnabled,
        taxPercentage: settings.taxPercentage,

        shippingEnabled: settings.shippingEnabled,
        shippingCharge: settings.shippingCharge,
        freeShippingMinimum: settings.freeShippingMinimum,

        minimumOrderAmount: settings.minimumOrderAmount,
      },
    });
  }
);