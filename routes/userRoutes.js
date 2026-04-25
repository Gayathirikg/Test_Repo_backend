import express from "express";
import { AuthMiddleware } from "../middleware/auth_middleware.js";
import {
  registerUser,
  loginUser,
  getUser,
  getProfile,
  updateProfile,
  changePassword,
  upgradePlan,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sendLoginOtp,       // 🆕
  verifyLoginOtp,     // 🆕
} from "../controllers/userController.js";
import rateLimit from "express-rate-limit";
import { getCategoryTotals } from "../controllers/expenseController.js";

const router = express.Router();

export const rateLimits = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,

  handler: (req, res, next) => {
    console.log("Rate limit hit — IP:", req.ip);

    const resetTimeMs = req.rateLimit.resetTime?.getTime?.() || Date.now() + 60000;
    const secondsLeft = Math.ceil((resetTimeMs - Date.now()) / 1000);

    console.log("secondsLeft →", secondsLeft);

    return res.status(429).json({
      success: false,
      status: 429,
      message: "Too many login attempts. Please try again after 1 minute.",
      retryAfter: 60,
    });
  },
});

// Auth
router.post("/register", registerUser);
router.post("/login", rateLimits, loginUser);

// Login OTP (2-step login) 🆕
router.post("/send-login-otp", sendLoginOtp);
router.post("/verify-login-otp", verifyLoginOtp);

// Protected
router.get("/get-user", AuthMiddleware, getUser);
router.get("/profile", AuthMiddleware, getProfile);
router.put("/profile", AuthMiddleware, updateProfile);
router.put("/change-password", AuthMiddleware, changePassword);
router.put("/update-plan", AuthMiddleware, upgradePlan);

// Forgot password
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Expenses
router.get("/category-totals", AuthMiddleware, getCategoryTotals);

export default router;