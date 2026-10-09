import Review from "../models/Review.js";
import Product from "../models/Product.js";

const updateProductRating = async (productId) => {
  const result = await Review.aggregate([
    {
      $match: {
        product: productId,
        isApproved: true,
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const ratingData = result[0] || {
    averageRating: 0,
    ratingCount: 0,
  };

  await Product.findByIdAndUpdate(productId, {
    $set: {
      "ratings.average": Number(
        ratingData.averageRating.toFixed(1)
      ),
      "ratings.count": ratingData.ratingCount,
    },
  });
};

export default updateProductRating;