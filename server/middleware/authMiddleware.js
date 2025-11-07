// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const allowedOrigins = [
  "http://localhost:5173",
  "https://cybombadmin.cybomb.com"
];

const protect = async (req, res, next) => {
  try {
    const origin = req.get("origin");
    // Allow public access for allowed origins
    if (allowedOrigins.includes(origin)) {
      return next();
    }

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid"
    });
  }
};

module.exports = { protect };
