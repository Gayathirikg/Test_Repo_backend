import Expense from "../models/Expense.js";
import fs from "fs/promises";
import path from "path";

// ADD EXPENSE

const BASE_URL = process.env.BASE_URL || "http://localhost:5001";
export const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    // Validation
    if (!title || !amount || !category) {
      return res.json({ success: false, message: "All fields required" });
    }
    if (amount <= 0) {
      return res.json({ success: false, message: "Amount must be positive" });
    }

    const billImage = req.files
      ? req.files.map((f) => `http://localhost:5001/uploads/${f.filename}`)
      : [];

    const expense = new Expense({
      title,
      amount,
      category,
      date: date || Date.now(),
      billImage,
      userId: req.user.id,
    });

    await expense.save();

    res.json({ success: true, message: "Expense Added", expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };

    
    const isPremium1 = req.user.plan === "premium1" || req.user.plan === "premium2";
    const isPremium2 = req.user.plan === "premium2";

    if (isPremium1 && req.query.title) {
      filter.title = { $regex: req.query.title, $options: "i" };
    }

    const min = Number(req.query.minAmount);
    const max = Number(req.query.maxAmount);

    if (isPremium1 && req.query.minAmount && !isNaN(min)) {
      filter.amount = { $gte: min };
    }
    if (isPremium1 && req.query.maxAmount && !isNaN(max)) {
      filter.amount = { ...(filter.amount || {}), $lte: max };
    }

    if (isPremium1 && req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    if (isPremium1 && (req.query.fromDate || req.query.toDate)) {
      filter.date = {};
      if (req.query.fromDate) filter.date.$gte = new Date(req.query.fromDate);
      if (req.query.toDate) {
        const toDate = new Date(req.query.toDate);
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    let sortOrder = { createdAt: -1 };

    if (isPremium1) {
      sortOrder =
        req.query.sort === "amount_asc"  ? { amount: 1 } :
        req.query.sort === "amount_desc" ? { amount: -1 } :
        { createdAt: -1 };
    }

    const count = await Expense.countDocuments(filter);

    const expenses = await Expense.find(filter)
      .sort(sortOrder)
      .limit(limit)
      .skip(skip);

    res.json({ success: true, expenses, count });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE EXPENSE
export const updateExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || !amount || !category) {
      return res.json({ success: false, message: "All fields required" });
    }
    if (amount <= 0) {
      return res.json({ success: false, message: "Amount must be positive" });
    }

    const updateData = { title, amount, category, date };

    if (req.files && req.files.length > 0) {
      updateData.billImage = req.files.map(
        (f) => `http://localhost:5001/uploads/${f.filename}`,
      );
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true },
    );

    if (!expense) {
      return res.json({ success: false, message: "Expense not found" });
    }

    res.json({ success: true, message: "Expense Updated", expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE EXPENSE
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!expense) {
      return res.json({ success: false, message: "Expense not found" });
    }

    // console.log("-----------------------",expense.billImage)
    const FileArray = expense.billImage;
    // const filepath = expense.
    for (let i = 0; i < expense.billImage.length; i++) {
      const filename = FileArray[i].split("uploads/")[1];
      console.log(filename);
      // C:\Users\Gayathiri K G\Downloads\expensetracker\backend\uploads
      const filePath = path.join("uploads", filename);
      console.log("pathhhhhhhhhh---", filePath);

      try {
        await fs.unlink(filePath);
        console.log("Deleted:", filePath);
      } catch (err) {
        console.log("Error deleting file:", err);
      }
    }
    await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    res.json({ success: true, message: "Expense Deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryTotals = async (req, res) => {
  try {
    const userId = req.user.id; 

    const categoryTotals = await Expense.aggregate([
      
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },

      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },         
          avgAmount: { $avg: "$amount" } 
        },
      },

      {
        $sort: { totalAmount: -1 },
      },

      {
        $project: {
          _id: 0,
          category: "$_id",
          totalAmount: 1,
          count: 1,
          avgAmount: { $round: ["$avgAmount", 2] },
        },
      },
    ]);

    const grandTotal = categoryTotals.reduce((sum, c) => sum + c.totalAmount, 0);

    return res.status(200).json({
      success: true,
      grandTotal,
      data: categoryTotals,
    });

  } catch (error) {
    console.log("getCategoryTotals error →", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};