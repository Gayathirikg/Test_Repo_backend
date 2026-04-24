import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI); 
    const uri = process.env.MONGO_URI || "mongodb+srv://gayathirikgganesh_db_user:BNqSmdtkhAlJlQAF@cluster0.err2zn0.mongodb.net/expensedb?retryWrites=true&w=majority&appName=Cluster0";
await mongoose.connect(uri, {
  family: 4
});    
    console.log("MongoDB connected ✅");
  } catch (error) {
    console.log("MongoDB connection error----", error);
  }
};

export default connectDB;