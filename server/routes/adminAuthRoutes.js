const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// ✅ Allowed domains (bypass token verification)
const ALLOWED_DOMAINS = [
  "https://cybombadmin.cybomb.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000"
];

// ✅ Auth Middleware
const authMiddleware = async (req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer || "";

  // If request is from allowed domain, skip token check for verification endpoint
  if (
    (origin && ALLOWED_DOMAINS.includes(origin)) ||
    ALLOWED_DOMAINS.some((d) => referer.startsWith(d))
  ) {
    console.log("✅ Domain allowed without token:", origin || referer);
    
    // For verify endpoint, we still need to check if token exists but be more lenient
    if (req.path === '/verify') {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if token is for admin
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

        req.user = admin;
        return next();
      } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
          success: false,
          message: 'Token is not valid'
        });
      }
    }
    
    return next();
  }

  // Otherwise, verify JWT for all endpoints
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token, authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token is for admin
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

    req.user = admin;
    next();
  } catch (error) {
    console.error("❌ Invalid Token:", error.message);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

// ✅ Utility Functions
const generateToken = (id) => {
  return jwt.sign({ id, type: 'admin' }, JWT_SECRET, { 
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const formatAdminResponse = (admin) => {
  return {
    id: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    isActive: admin.isActive,
    lastLogin: admin.lastLogin,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt
  };
};

// ✅ Validation Functions
const validateAdminInput = (data, isUpdate = false) => {
  const { username, email, password } = data;
  
  if (!isUpdate) {
    if (!username || !email || !password) {
      return 'Username, email, and password are required';
    }
  }

  if (username && username.length < 3) {
    return 'Username must be at least 3 characters long';
  }

  if (email && !/\S+@\S+\.\S+/.test(email)) {
    return 'Please provide a valid email address';
  }

  if (password && password.length < 6) {
    return 'Password must be at least 6 characters long';
  }

  return null;
};

// ✅ CRUD Operations

// 🔹 GET ALL ADMINS
router.get('/admins', authMiddleware, async (req, res) => {
  try {
    const admins = await Admin.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      admins: admins.map(formatAdminResponse),
      count: admins.length
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin users'
    });
  }
});

// 🔹 GET SINGLE ADMIN
router.get('/admins/:id', authMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      admin: formatAdminResponse(admin)
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin user'
    });
  }
});

// 🔹 CREATE ADMIN
router.post('/admins', authMiddleware, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    const validationError = validateAdminInput({ username, email, password });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email or username already exists'
      });
    }

    // Create new admin
    const admin = await Admin.create({
      username,
      email,
      password,
      role: 'admin',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      admin: formatAdminResponse(admin)
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin user',
      error: error.message
    });
  }
});

// 🔹 UPDATE ADMIN PASSWORD
router.put('/admins/:id/password', authMiddleware, async (req, res) => {
  try {
    const { password, newPassword } = req.body;

    if (!password || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find admin
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
});

// 🔹 RESET ADMIN PASSWORD (Super admin can reset any password)
router.patch('/admins/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find admin
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
});

// 🔹 UPDATE ADMIN PROFILE
router.put('/admins/:id/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;

    // Validate input
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username and email are required'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long'
      });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Find admin
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Check for duplicate email/username
    const existingAdmin = await Admin.findOne({
      _id: { $ne: req.params.id },
      $or: [{ email }, { username }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Another admin with this email or username already exists'
      });
    }

    // Update fields
    admin.username = username;
    admin.email = email;
    await admin.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      admin: formatAdminResponse(admin)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// 🔹 DELETE ADMIN
router.delete('/admins/:id', authMiddleware, async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting admin user',
      error: error.message
    });
  }
});

// 🔹 TOGGLE ADMIN STATUS
router.patch('/admins/:id/status', authMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    // Prevent self-deactivation
    if (req.user.id === req.params.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      message: `Admin account ${isActive ? 'activated' : 'deactivated'} successfully`,
      admin: formatAdminResponse(admin)
    });
  } catch (error) {
    console.error('Toggle admin status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin status',
      error: error.message
    });
  }
});

// ✅ AUTH ROUTES

// 🔹 ADMIN LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if admin exists and is active
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account disabled'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await admin.updateLastLogin();

    const token = generateToken(admin._id);

    res.json({
      success: true,
      token,
      admin: formatAdminResponse(admin)
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// 🔹 VERIFY ADMIN TOKEN
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      admin: formatAdminResponse(req.user),
      message: 'Token verified successfully'
    });
  } catch (error) {
    console.error('Verify endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// 🔹 ADMIN LOGOUT
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// 🔹 CREATE INITIAL ADMIN (SETUP)
router.post('/setup', async (req, res) => {
  try {
    // Check if any admin already exists
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin setup already completed'
      });
    }

    const { username, email, password } = req.body;

    // Validate input
    const validationError = validateAdminInput({ username, email, password });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const admin = await Admin.create({
      username,
      email,
      password,
      role: 'superadmin',
      isActive: true
    });

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Initial admin created successfully',
      token,
      admin: formatAdminResponse(admin)
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin account',
      error: error.message
    });
  }
});

// 🔹 GET ADMIN PROFILE
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      admin: formatAdminResponse(req.user)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin profile'
    });
  }
});

// ✅ CORS MIDDLEWARE
router.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_DOMAINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// ✅ PREFLIGHT REQUESTS
router.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_DOMAINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.status(200).send();
});

module.exports = router;