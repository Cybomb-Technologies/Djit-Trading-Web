const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Allowed origins where token is NOT required
const allowedOrigins = [
  "http://localhost:5173",
  "https://cybombadmin.cybomb.com"
];

// ⭐ Function to check origin
const isAllowedOrigin = (req) => {
  const origin = req.headers.origin;
  return allowedOrigins.includes(origin);
};

// -------------------- USER AUTH --------------------
const auth = async (req, res, next) => {
  try {
    // 👉 Skip token auth for allowed origins
    if (isAllowedOrigin(req)) {
      console.log("User auth skipped for:", req.headers.origin);
      return next();
    }

    // Token required for others
    let token = req.header('Authorization')?.replace('Bearer ', '') ||
                req.query.token ||
                req.query.auth;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token is not valid"
    });
  }
};

// -------------------- ADMIN AUTH --------------------
const adminAuth = async (req, res, next) => {
  try {
    const origin = req.headers.origin;

    // ⭐ Skip token & set dummy admin
    if (allowedOrigins.includes(origin)) {
      console.log("Admin auth skipped for:", origin);
      req.admin = { _id: "bypass-admin" };  // <- ADD THIS
      return next();
    }

    let token = req.header('Authorization')?.replace('Bearer ', '') ||
                req.query.token ||
                req.query.auth;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Invalid token type"
      });
    }

    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin || !admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin not found or disabled"
      });
    }

    req.admin = admin;
    next();

  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({ success: false, message: "Token is not valid" });
  }
};


module.exports = { auth, adminAuth };
