import Product from "../models/Product.js";
import InventoryLog from "../models/InventoryLog.js";

export const decreaseProductStock = async ({
  productId,
  quantity,
  userId,
  reason,
}) => {
  if (!quantity || quantity <= 0) {
    throw new Error("Invalid stock quantity.");
  }

  const product = await Product.findOneAndUpdate(
    {
      _id: productId,
      isActive: true,
      stock: { $gte: quantity },
    },
    {
      $inc: {
        stock: -quantity,
      },
    },
    {
      new: true,
    }
  );

  if (!product) {
    throw new Error(
      "Product is unavailable or does not have enough stock."
    );
  }

  const previousStock = product.stock + quantity;

  await InventoryLog.create({
    product: product._id,
    previousStock,
    newStock: product.stock,
    quantityChanged: -quantity,
    adjustmentType: "sale",
    reason,
    adjustedBy: userId,
  });

  return product;
};

export const increaseProductStock = async ({
  productId,
  quantity,
  userId,
  adjustmentType = "cancellation",
  reason,
}) => {
  if (!quantity || quantity <= 0) {
    throw new Error("Invalid stock quantity.");
  }

  const product = await Product.findByIdAndUpdate(
    productId,
    {
      $inc: {
        stock: quantity,
      },
    },
    {
      new: true,
    }
  );

  if (!product) {
    throw new Error("Product not found.");
  }

  const previousStock = product.stock - quantity;

  await InventoryLog.create({
    product: product._id,
    previousStock,
    newStock: product.stock,
    quantityChanged: quantity,
    adjustmentType,
    reason,
    adjustedBy: userId,
  });

  return product;
};