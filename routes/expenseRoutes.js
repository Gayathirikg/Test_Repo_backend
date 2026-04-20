import express from "express";
import { AuthMiddleware } from "../middleware/auth_middleware.js";
import upload from "../multerconfig.js";
import {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js"; 

const router = express.Router();

router.post("/", AuthMiddleware, upload.array("billImage", 5), addExpense);
router.get("/", AuthMiddleware, getExpenses);
router.put("/:id", AuthMiddleware, upload.array("billImage", 5), updateExpense);
router.delete("/:id", AuthMiddleware, deleteExpense);

export default router;