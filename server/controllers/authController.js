const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const PasswordReset = require('../models/PasswordReset');
const crypto = require('crypto');
const EmailService = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or username'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error in registration',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // ✅ Unified response for web + mobile
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token, // mobile apps can use this directly
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in login',
      error: error.message
    });
  }
};

// Google OAuth login/register
exports.googleAuth = async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    console.log('Google OAuth payload:', { email, name, googleId });

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { 'profile.googleId': googleId }
      ]
    });

    if (user) {
      console.log('Existing user found:', user.email);
      // Update Google ID if not set
      if (!user.profile.googleId) {
        user.profile.googleId = googleId;
        user.profile.profilePicture = {
          url: picture,
          filename: `google_${googleId}`
        };
        await user.save();
      }

      // Generate JWT token
      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Google authentication successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      });
    } else {
      // User not found - return needsRegistration flag
      console.log('User not found, requiring registration:', email);
      
      res.status(404).json({
        success: false,
        needsRegistration: true,
        message: 'Account not found. Please complete your registration.',
        email: email,
        name: name,
        picture: picture,
        googleId: googleId
      });
    }

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in Google authentication',
      error: error.message
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user data',
      error: error.message
    });
  }
};
// Forgot password - send 6-digit code
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a reset code has been sent'
      });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing reset codes for this email
    await PasswordReset.deleteMany({ email: email.toLowerCase().trim() });

    // Create new reset code
    const passwordReset = new PasswordReset({
      email: email.toLowerCase().trim(),
      code: resetCode,
      expiresAt: expiresAt
    });

    await passwordReset.save();

    // Send email with reset code
    const emailSent = await EmailService.sendPasswordResetCode({
      to: email,
      userName: user.username,
      code: resetCode
    });

    if (!emailSent) {
      console.error('Failed to send reset code email');
      // Still return success for security reasons
    }

    res.json({
      success: true,
      message: 'If the email exists, a reset code has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request'
    });
  }
};

// Verify reset code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    // Find valid reset code
    const resetRecord = await PasswordReset.findOne({
      email: email.toLowerCase().trim(),
      code: code.trim(),
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    res.json({
      success: true,
      message: 'Reset code verified successfully'
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying reset code'
    });
  }
};

// Reset password with code
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, code, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find valid reset code
    const resetRecord = await PasswordReset.findOne({
      email: email.toLowerCase().trim(),
      code: code.trim(),
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's password
    user.password = newPassword;
    await user.save();

    // Mark reset code as used
    resetRecord.used = true;
    await resetRecord.save();

    // Send confirmation email
    await EmailService.sendPasswordResetConfirmation({
      to: email,
      userName: user.username
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};