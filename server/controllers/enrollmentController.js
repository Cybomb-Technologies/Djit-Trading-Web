const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');

// Create enrollment
exports.createEnrollment = async (req, res) => {
  try {
    const { courseId, couponCode, finalAmount = 0 } = req.body; // Add finalAmount
    const userId = req.user.id;

    console.log('🎯 Creating enrollment for:', { userId, courseId, couponCode, finalAmount });

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (existingEnrollment) {
      console.log('⚠️ User already enrolled:', existingEnrollment);
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    console.log('📚 Course found:', course.title, 'Price:', course.price, 'Final Amount:', finalAmount);

    // Determine payment status based on final amount
    const isFreeEnrollment = finalAmount === 0 || course.price === 0 || course.discountedPrice === 0;
    
    const enrollmentData = {
      user: userId,
      course: courseId,
      amountPaid: finalAmount === 0 ? 0 : (course.discountedPrice || course.price), // Use finalAmount if it's 0
      paymentStatus: isFreeEnrollment ? 'completed' : 'pending', // Set completed for free enrollments
      enrollmentDate: new Date()
    };

    console.log('📝 Creating enrollment with data:', enrollmentData);

    const enrollment = await Enrollment.create(enrollmentData);

    // Update course enrollment count
    course.studentsEnrolled += 1;
    await course.save();

    console.log('✅ Enrollment created successfully:', enrollment._id, 'Payment Status:', enrollment.paymentStatus);

    res.status(201).json({
      success: true,
      enrollment
    });
  } catch (error) {
    console.error('❌ Error creating enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating enrollment',
      error: error.message
    });
  }
};

// Get user enrollments
exports.getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.params.userId })
      .populate('course')
      .populate('user', 'username email profile importSource')
      .sort({ enrollmentDate: -1 });

    res.json({
      success: true,
      enrollments
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// Get all enrollments (admin)
exports.getAllEnrollments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', course = '' } = req.query;
    
    let query = {};
    if (status) query.paymentStatus = status;
    if (course) query.course = course;

    const enrollments = await Enrollment.find(query)
      .populate('user', 'username email profile.firstName profile.lastName profile.phone importSource')
      .populate('course', 'title price discountedPrice category level instructor')
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
    res.status(500).json({
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// Update enrollment progress
exports.updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { progress },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        message: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      enrollment
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating progress',
      error: error.message
    });
  }
};

// Update enrollment status (admin)
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { progress, completed, paymentStatus } = req.body;
    
    const updateData = {};
    if (progress !== undefined) updateData.progress = progress;
    if (completed !== undefined) updateData.completed = completed;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;

    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user').populate('course');

    if (!enrollment) {
      return res.status(404).json({
        message: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      message: 'Enrollment updated successfully',
      enrollment
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating enrollment',
      error: error.message
    });
  }
};

// Get enrollment statistics
exports.getEnrollmentStats = async (req, res) => {
  try {
    const totalEnrollments = await Enrollment.countDocuments();
    const completedEnrollments = await Enrollment.countDocuments({ completed: true });
    const pendingPayments = await Enrollment.countDocuments({ paymentStatus: 'pending' });
    
    const courseStats = await Enrollment.aggregate([
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amountPaid' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const monthlyStats = await Enrollment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$enrollmentDate' },
            month: { $month: '$enrollmentDate' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$amountPaid' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalEnrollments,
        completedEnrollments,
        pendingPayments,
        completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0
      },
      courseStats,
      monthlyStats
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching enrollment statistics',
      error: error.message
    });
  }
};