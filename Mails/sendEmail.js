import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.EMAIL_PASS,  
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("Gmail Connection Failed:", err.message);
  } else {
    console.log("Gmail Server Ready to Send Emails! ✅");
  }
});

// Welcome 
export const sendWelcomeEmail = async (toEmail, username) => {
  try {
    const info = await transporter.sendMail({
      from: `"Expense Tracker" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Welcome to Expense Tracker!",
      html: `
        <h2>Hi ${username}! 👋</h2>
        <p>Welcome to Expense Tracker!</p>
        <p>Start tracking your expenses today.</p>
      `,
    });
    console.log("Welcome mail sent:", info.messageId);
  } catch (err) {
    console.error("Welcome mail failed:", err.message);
  }
};

// OTP
export const sendOtpEmail = async (toEmail, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"Expense Tracker" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Password Reset OTP - Expense Tracker",
      html: `
        <h2>Password Reset OTP</h2>
        <p>Your OTP: <b style="font-size:24px">${otp}</b></p>
        <p>Valid for <b>10 minutes</b> only.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });
    console.log("OTP mail sent:", info.messageId);
  } catch (err) {
    console.error("OTP mail failed:", err.message);
  }
};