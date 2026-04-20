import mongoose from "mongoose";

const connectDB = async () => {
  try {

await mongoose.connect("mongodb://127.0.0.1:27017/expenses");

    console.log("MongoDB connected");

  } catch (error) {

    console.log("MongoDB connection error", error);

  }
};

export default connectDB;