// middleware/adminAuthMiddleware.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const allowedOrigins = [
  "http://localhost:5173",
  "https://cybombadmin.cybomb.com"
];

const adminProtect = async (req, res, next) => {
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
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin || !admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin not found or account disabled"
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid"
    });
  }
};

module.exports = { adminProtect };
