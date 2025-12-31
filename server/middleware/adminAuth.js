const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Allowed origins where token is NOT required
const allowedOrigins = [
  "http://localhost:5173",
  "https://cybombadmin.cybomb.com"
];

const adminAuth = async (req, res, next) => {
  try {
    const origin = req.headers.origin;

    // ⭐ Skip token & set dummy admin
    if (allowedOrigins.includes(origin)) {
      console.log("Admin auth skipped for:", origin);
      req.admin = { _id: "bypass-admin" };
      return next();
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify this is an admin token
    if (decoded.type !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid token type' 
      });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Admin not found or account disabled' 
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};

module.exports = adminAuth;
