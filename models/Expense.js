import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({

  title:{
    type:String,
    required:true
  },

  amount:{
    type:Number,
    required:true
  },

  category:{
    type:String
  },

   billImage: {
    type: [String], 
    default: []
  },

  date:{
    type:Date,
    default:Date.now
  },
     userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
); 



const Expense = mongoose.model("Expense",expenseSchema);

export default Expense;