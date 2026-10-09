// import dotenv from "dotenv";
// import connectDB from "./config/db.js";

// import User from "./models/User.js";
// import Category from "./models/Category.js";
// import Product from "./models/Product.js";
// import Cart from "./models/Cart.js";
// import Wishlist from "./models/Wishlist.js";
// import Address from "./models/Address.js";
// import Order from "./models/Order.js";
// import Review from "./models/Review.js";
// import Coupon from "./models/Coupon.js";

// dotenv.config();

// const testModels = async () => {
//   try {
//     await connectDB();

//     console.log("✅ User model loaded:", User.modelName);
//     console.log("✅ Category model loaded:", Category.modelName);
//     console.log("✅ Product model loaded:", Product.modelName);
//     console.log("✅ Cart model loaded:", Cart.modelName);
//     console.log("✅ Wishlist model loaded:", Wishlist.modelName);
//     console.log("✅ Address model loaded:", Address.modelName);
//     console.log("✅ Order model loaded:", Order.modelName);
//     console.log("✅ Review model loaded:", Review.modelName);
//     console.log("✅ Coupon model loaded:", Coupon.modelName);

//     process.exit(0);
//   } catch (error) {
//     console.error("❌ Model test failed:", error.message);
//     process.exit(1);
//   }
// };

// testModels();