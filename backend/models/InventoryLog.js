import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },

    newStock: {
      type: Number,
      required: true,
      min: 0,
    },

    quantityChanged: {
      type: Number,
      required: true,
    },

    adjustmentType: {
      type: String,
      enum: [
        "restock",
        "remove",
        "set",
        "sale",
        "cancellation",
      ],
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const InventoryLog = mongoose.model(
  "InventoryLog",
  inventoryLogSchema
);

export default InventoryLog;