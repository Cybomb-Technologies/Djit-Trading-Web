const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const PasswordReset = require('../models/PasswordReset');
const crypto = require('crypto');
const EmailService = require('../services/emailService');
const { createUserRegistrationNotification } = require('./notificationController');
const Notification = require('../models/Notification');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// Register user with googleId support
exports.register = async (req, res) => {
  try {
    const { username, email, password, googleId } = req.body;

    console.log('📝 REGISTRATION ATTEMPT:', { 
      username, 
      email, 
      hasPassword: !!password,
      googleId: googleId || 'NO_GOOGLE_ID'
    });

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [
        { email }, 
        { username },
        ...(googleId ? [{ googleId }] : [])
      ]
    });

    if (existingUser) {
      console.log('❌ USER ALREADY EXISTS:', existingUser.email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email, username, or Google account'
      });
    }

    // Create user with googleId if provided
    const userData = {
      username,
      email,
      ...(password && { password }) // Only include password if provided
    };

    if (googleId) {
      userData.googleId = googleId;
      userData.emailVerified = true;
      userData.importSource = 'google_oauth';
      if (!password) {
        userData.password = crypto.randomBytes(16).toString('hex');
      }
      console.log('✅ CREATING GOOGLE USER WITH ID:', googleId);
    }

    console.log('🟡 FINAL USER DATA:', { ...userData, password: '***' });

    const user = await User.create(userData);
    console.log('✅ USER CREATED SUCCESSFULLY:', user.email);

    // 🔔 Create notification for admin
    await Notification.create({
      title: 'New User Registered',
      message: `User ${user.username} registered with email: ${user.email}`,
      type: 'user',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Optional: real-time via Socket.IO
    if (global.io) {
      const unreadCount = await Notification.countDocuments({ isRead: false });
      global.io.emit('newNotification', { notification: user, unreadCount });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        googleId: user.googleId
      }
    });
  } catch (error) {
    console.error('❌ REGISTRATION ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error in registration: ' + error.message,
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

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
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

// Google OAuth with authorization code
exports.googleAuth = async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    console.log('Received Google authorization code:', code ? 'YES' : 'NO');
    console.log('Redirect URI:', redirect_uri);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Google authorization code is required'
      });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirect_uri || "https://djittrading.com/",
        grant_type: "authorization_code",
      }),
    });

    // First check if response is ok
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Google token exchange error:', errorData);
      return res.status(400).json({
        success: false,
        message: errorData.error_description || errorData.error || 'Failed to exchange authorization code with Google'
      });
    }

    // Only if response is ok, then parse the tokens
    const tokens = await tokenResponse.json();
    console.log('Google token exchange successful');

    if (!tokens.id_token) {
      return res.status(400).json({
        success: false,
        message: 'No ID token received from Google'
      });
    }

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log('Google user payload received:', payload.email);

    if (!payload.email) {
      return res.status(400).json({
        success: false,
        message: 'No email found in Google profile'
      });
    }

    // Check if user already exists by email or googleId
    let user = await User.findOne({ 
      $or: [
        { email: payload.email },
        { googleId: payload.sub }
      ] 
    });

    if (user) {
      // User exists - generate JWT token
      const token = generateToken(user._id);

      console.log('✅ EXISTING USER LOGIN:', user.email);

      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          googleId: user.googleId
        }
      });
    } else {
      // New user - needs registration
      const googleUser = {
        email: payload.email,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        googleId: payload.sub,
        emailVerified: payload.email_verified || false
      };

      console.log('🆕 NEW GOOGLE USER DETECTED:', googleUser.email);

      return res.status(200).json({
        success: false,
        needsRegistration: true,
        message: 'Please complete your registration',
        googleUser: googleUser
      });
    }

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
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