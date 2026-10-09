import dotenv from "dotenv";
import connectDB from "../config/db.js";

import Category from "../models/Category.js";
import Product from "../models/Product.js";

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    await Category.deleteMany({});
    await Product.deleteMany({});

    const categories = await Category.insertMany([
      {
        name: "Electronics",
        slug: "electronics",
        description: "Smart devices and modern electronics",
        sortOrder: 1,
      },
      {
        name: "Fashion",
        slug: "fashion",
        description: "Everyday fashion and accessories",
        sortOrder: 2,
      },
      {
        name: "Home & Living",
        slug: "home-living",
        description: "Products for a comfortable home",
        sortOrder: 3,
      },
      {
        name: "Accessories",
        slug: "accessories",
        description: "Useful everyday accessories",
        sortOrder: 4,
      },
    ]);

    const categoryMap = {};

    categories.forEach((category) => {
      categoryMap[category.slug] = category._id;
    });

    await Product.insertMany([
      {
        name: "Wireless Noise Cancelling Headphones",
        slug: "wireless-noise-cancelling-headphones",
        description:
          "Premium wireless headphones with active noise cancellation and long battery life.",
        price: 5999,
        discountPrice: 4499,
        category: categoryMap.electronics,
        brand: "NOVA Audio",
        stock: 25,
        sku: "NOVA-HEAD-001",
        images: [],
        tags: ["audio", "wireless", "headphones"],
        isFeatured: true,
        isActive: true,
        ratings: {
          average: 4.7,
          count: 124,
        },
      },
      {
        name: "Smart Watch Pro",
        slug: "smart-watch-pro",
        description:
          "Modern smartwatch with fitness tracking, notifications and health-focused features.",
        price: 3999,
        discountPrice: 2999,
        category: categoryMap.electronics,
        brand: "NOVA Tech",
        stock: 40,
        sku: "NOVA-WATCH-001",
        images: [],
        tags: ["smartwatch", "fitness", "wearable"],
        isFeatured: true,
        isActive: true,
        ratings: {
          average: 4.5,
          count: 89,
        },
      },
      {
        name: "Minimal Everyday Backpack",
        slug: "minimal-everyday-backpack",
        description:
          "A clean and practical backpack designed for work, travel and everyday use.",
        price: 2499,
        discountPrice: 1999,
        category: categoryMap.accessories,
        brand: "NOVA Carry",
        stock: 35,
        sku: "NOVA-BAG-001",
        images: [],
        tags: ["backpack", "travel", "work"],
        isFeatured: true,
        isActive: true,
        ratings: {
          average: 4.6,
          count: 73,
        },
      },
      {
        name: "Premium Cotton Oversized T-Shirt",
        slug: "premium-cotton-oversized-tshirt",
        description:
          "Comfortable oversized cotton t-shirt with a minimal everyday design.",
        price: 1299,
        discountPrice: 999,
        category: categoryMap.fashion,
        brand: "NOVA Wear",
        stock: 60,
        sku: "NOVA-TSHIRT-001",
        images: [],
        tags: ["fashion", "cotton", "tshirt"],
        isFeatured: true,
        isActive: true,
        ratings: {
          average: 4.4,
          count: 51,
        },
      },
      {
        name: "Desk Lamp",
        slug: "modern-desk-lamp",
        description:
          "Minimal desk lamp for workspaces, study areas and bedrooms.",
        price: 1599,
        category: categoryMap.home-living,
        brand: "NOVA Home",
        stock: 30,
        sku: "NOVA-LAMP-001",
        images: [],
        tags: ["home", "desk", "lamp"],
        isFeatured: false,
        isActive: true,
        ratings: {
          average: 4.2,
          count: 32,
        },
      },
      {
        name: "Mechanical Keyboard",
        slug: "mechanical-keyboard",
        description:
          "Responsive mechanical keyboard designed for productivity and gaming.",
        price: 3499,
        category: categoryMap.electronics,
        brand: "NOVA Tech",
        stock: 20,
        sku: "NOVA-KEY-001",
        images: [],
        tags: ["keyboard", "mechanical", "gaming"],
        isFeatured: false,
        isActive: true,
        ratings: {
          average: 4.6,
          count: 68,
        },
      },
      {
        name: "Ceramic Coffee Mug",
        slug: "ceramic-coffee-mug",
        description:
          "Simple ceramic mug designed for coffee, tea and everyday use.",
        price: 699,
        category: categoryMap.home-living,
        brand: "NOVA Home",
        stock: 100,
        sku: "NOVA-MUG-001",
        images: [],
        tags: ["coffee", "mug", "home"],
        isFeatured: false,
        isActive: true,
        ratings: {
          average: 4.1,
          count: 26,
        },
      },
      {
        name: "Classic Leather Wallet",
        slug: "classic-leather-wallet",
        description:
          "Slim everyday wallet with a timeless design and practical card storage.",
        price: 1499,
        discountPrice: 1199,
        category: categoryMap.accessories,
        brand: "NOVA Carry",
        stock: 45,
        sku: "NOVA-WALLET-001",
        images: [],
        tags: ["wallet", "leather", "accessories"],
        isFeatured: false,
        isActive: true,
        ratings: {
          average: 4.3,
          count: 44,
        },
      },
    ]);

    console.log("✅ Categories and products seeded successfully.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seedData();