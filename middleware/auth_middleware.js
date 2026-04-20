import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const AuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token", success: false });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.SecuretKey);
        console.log("DECODED:", decoded); 


    const checkUser = await User.findById(decoded.id);

    if (!checkUser) {
      return res.status(401).json({ message: "No Access", success: false });
    }

    req.user = {
      id: checkUser._id,
      plan: checkUser.plan,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token", success: false });
  }
};