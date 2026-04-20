import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import env from "dotenv";
import { sendWelcomeEmail, sendOtpEmail } from "../Mails/sendEmail.js";

env.config();
const secretOrPrivateKey = process.env.SecuretKey;

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { username, email, country, phone, password } = req.body;

    // Validation
    if (!username || !email || !password || !phone) {
      return res.json({ success: false, message: "All fields required" });
    }
    if (password.length < 6) {
      return res.json({
        success: false,
        message: "Password minimum 6 characters",
      });
    }
    const digitsOnly = String(phone).replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return res.json({ success: false, message: "Phone must be 10 digits" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      country,
      phone,
      password: hashedPassword,
      plan: "free",
    });

    await user.save();
    await sendWelcomeEmail(user.email, user.username);
    res.json({ success: true, message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "All fields required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, secretOrPrivateKey, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        username: user.username,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (error) {
      console.log("LOGIN ERROR:", error.response?.data);  // ← add this
  console.log("LOGIN STATUS:", error.response?.status);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET USER
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: { username: user.username, email: user.email, plan: user.plan },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!["premium1", "premium2"].includes(plan)) {
      return res.json({ success: false, message: "Invalid plan" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { plan },
      { new: true },
    );

    res.json({
      success: true,
      message: "Plan upgraded successfully",
      plan: user.plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { username, phone } = req.body;

    if (!username) {
      return res.json({ success: false, message: "Username required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, phone },
      { new: true },
    ).select("-password");

    res.json({ success: true, message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.json({ success: false, message: "All fields required" });
    }
    if (newPassword.length < 6) {
      return res.json({ success: false, message: "Minimum 6 characters" });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Old password incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Email not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000;
    user.resetOtp = otp;
    console.log("otp", otp);
    user.resetOtpExpiry = otpExpiry;
    await user.save();
    await sendOtpEmail(email, otp);
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//  OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    console.log("user", user);
    console.log("bodyyyyyy", req.body);
    console.log("Received OTP:", otp, typeof otp);
    console.log("Stored OTP:", user.resetOtp, typeof user.resetOtp);
    console.log("Match:", user.resetOtp === otp.trim());

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.resetOtp !== otp.trim()) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    if (new Date() > new Date(user.resetOtpExpiry)) {
      return res.json({ success: false, message: "OTP expired" });
    }
    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid request" });
    }
    if (new Date() > new Date(user.resetOtpExpiry)) {
      return res.json({ success: false, message: "OTP expired" });
    }
    if (newPassword.length < 6) {
      return res.json({ success: false, message: "Minimum 6 characters" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();
    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
