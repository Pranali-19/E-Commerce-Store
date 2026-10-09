import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
      default: "My Store",
    },

    logo: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      street: {
        type: String,
        trim: true,
        default: "",
      },
      city: {
        type: String,
        trim: true,
        default: "",
      },
      state: {
        type: String,
        trim: true,
        default: "",
      },
      postalCode: {
        type: String,
        trim: true,
        default: "",
      },
      country: {
        type: String,
        trim: true,
        default: "India",
      },
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "INR",
    },

    currencySymbol: {
      type: String,
      trim: true,
      default: "₹",
    },

    taxEnabled: {
      type: Boolean,
      default: false,
    },

    taxPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    shippingEnabled: {
      type: Boolean,
      default: true,
    },

    shippingCharge: {
      type: Number,
      min: 0,
      default: 0,
    },

    freeShippingMinimum: {
      type: Number,
      min: 0,
      default: 0,
    },

    minimumOrderAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 5,
    },

    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    orderNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const StoreSettings = mongoose.model(
  "StoreSettings",
  storeSettingsSchema
);

export default StoreSettings;