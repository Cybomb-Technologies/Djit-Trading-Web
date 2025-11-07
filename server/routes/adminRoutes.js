const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Newsletter = require('../models/Newsletter');
const Payment = require('../models/Payment');
const userController = require('../controllers/userController');

const router = express.Router();

// All routes are protected with adminAuth
router.use(adminAuth);

// Get admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    console.log('Admin accessing dashboard:', req.admin._id);
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      recentEnrollments,
      popularCourses
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]),
      Enrollment.find()
        .populate('user', 'username email')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
      Enrollment.aggregate([
        { $group: { _id: '$course', enrollments: { $sum: 1 } } },
        { $sort: { enrollments: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course'
          }
        },
        { $unwind: '$course' }
      ])
    ]);

    const stats = {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentEnrollments,
      popularCourses
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ENHANCED USER MANAGEMENT ROUTES ==========

// Get all users with advanced search, pagination, and batch filtering
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', batch = '' } = req.query;
    
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } },
          { 'profile.phone': { $regex: search, $options: 'i' } },
          { 'profile.tradingSegment': { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Add batch filter
    if (batch) {
      searchFilter.batch = batch;
    }

    const users = await User.find(searchFilter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(searchFilter);

    // Get unique batches for filter dropdown
    const batches = await User.distinct('batch');

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      batches
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Import users from CSV
router.post('/users/import', userController.importUsers);

// Get batch statistics
router.get('/users/batch-stats', async (req, res) => {
  try {
    const batchStats = await User.aggregate([
      {
        $group: {
          _id: '$batch',
          count: { $sum: 1 },
          lastImport: { $max: '$importDate' }
        }
      },
      {
        $sort: { lastImport: -1 }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const importedUsers = await User.countDocuments({ importSource: 'csv_import' });

    res.json({
      success: true,
      batchStats,
      totalUsers,
      importedUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching batch statistics',
      error: error.message
    });
  }
});

// Get detailed user information
router.get('/users/:id/details', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user details', error: error.message });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Also delete user's enrollments
    await Enrollment.deleteMany({ user: req.params.id });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== EXISTING ENROLLMENT ROUTES ==========

// Get all enrollments with filters
router.get('/enrollments', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', course = '' } = req.query;
    const query = {};
    
    if (status) query.paymentStatus = status;
    if (course) query.course = course;

    const enrollments = await Enrollment.find(query)
      .populate('user', 'username email')
      .populate('course', 'title price')
      .sort({ enrollmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Enrollment.countDocuments(query);

    res.json({
      success: true,
      enrollments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update enrollment status
router.put('/enrollments/:id', async (req, res) => {
  try {
    const { progress, completed, paymentStatus } = req.body;
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { progress, completed, paymentStatus },
      { new: true }
    ).populate('user', 'username email')
     .populate('course', 'title');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    res.json({ success: true, enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== EXISTING NEWSLETTER ROUTES ==========

// Get all newsletter subscribers
router.get('/newsletter', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const subscribers = await Newsletter.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Newsletter.countDocuments();

    res.json({
      success: true,
      subscribers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send newsletter to all subscribers
router.post('/newsletter/send', async (req, res) => {
  try {
    const { subject, content } = req.body;
    const subscribers = await Newsletter.find({ isActive: true });
    
    // In a real application, you would use a queue system for this
    const emailService = require('../services/emailService');
    
    const results = await Promise.allSettled(
      subscribers.map(subscriber => 
        emailService.sendNewsletter({
          to: subscriber.email,
          subject,
          content
        })
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    res.json({
      success: true,
      message: `Newsletter sent to ${successful} subscribers${failed > 0 ? `, ${failed} failed` : ''}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ADDITIONAL ADMIN ROUTES ==========

// Get user statistics
router.get('/users-stats', async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      adminUsers,
      usersThisMonth,
      usersByTradingSegment,
      usersByBatch
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({
        createdAt: { 
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
        }
      }),
      User.aggregate([
        { 
          $group: { 
            _id: '$profile.tradingSegment', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } }
      ]),
      User.aggregate([
        {
          $group: {
            _id: '$batch',
            count: { $sum: 1 },
            imported: {
              $sum: { $cond: [{ $eq: ['$importSource', 'csv_import'] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        adminUsers,
        usersThisMonth,
        usersByTradingSegment,
        usersByBatch,
        verificationRate: Math.round((verifiedUsers / totalUsers) * 100),
        importedUsers: await User.countDocuments({ importSource: 'csv_import' })
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile (admin override)
router.put('/users/:id/profile', async (req, res) => {
  try {
    const {
      phone,
      birthday,
      address,
      tradingViewId,
      // vishcardId,
      tradingSegment,
      firstName,
      lastName,
      phone2,
      discordId,
      badge,
      batch
    } = req.body;

    const updateData = {
      'profile.phone': phone,
      'profile.birthday': birthday,
      'profile.tradingViewId': tradingViewId,
      // 'profile.vishcardId': vishcardId,
      'profile.tradingSegment': tradingSegment,
      'profile.firstName': firstName,
      'profile.lastName': lastName,
      'profile.phone2': phone2,
      'profile.discordId': discordId,
      'profile.badge': badge
    };

    // Add batch if provided
    if (batch) {
      updateData.batch = batch;
    }

    // Add address fields if provided
    if (address) {
      updateData['profile.address.street'] = address.street;
      updateData['profile.address.city'] = address.city;
      updateData['profile.address.state'] = address.state;
      updateData['profile.address.zipCode'] = address.zipCode;
      updateData['profile.address.country'] = address.country;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user profile', error: error.message });
  }
});

module.exports = router;