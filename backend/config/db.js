import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const ordersCollectionExists = await mongoose.connection.db
      .listCollections({ name: "orders" }, { nameOnly: true })
      .hasNext();

    if (ordersCollectionExists) {
      const cleanupResult = await mongoose.connection
        .collection("orders")
        .updateMany(
          { "paymentDetails.razorpayOrderId": "" },
          {
            $unset: {
              "paymentDetails.razorpayOrderId": "",
            },
          }
        );

      if (cleanupResult.modifiedCount > 0) {
        console.log(
          `Cleaned ${cleanupResult.modifiedCount} legacy order payment ID value(s).`
        );
      }
    }

    console.log(`MongoDB connected successfully!`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;