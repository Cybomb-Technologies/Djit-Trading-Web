const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Course = require('../models/Course');
const reportService = require('../services/reportService');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      recentPayments,
      popularCourses,
      monthlyRevenue
    ] = await Promise.all([
      // Total users
      User.countDocuments(dateFilter),
      
      // Total courses
      Course.countDocuments(),
      
      // Total enrollments
      Enrollment.countDocuments(dateFilter),
      
      // Total revenue
      Payment.aggregate([
        { $match: { ...dateFilter, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]),
      
      // Recent payments
      Payment.find({ paymentStatus: 'completed' })
        .populate('user', 'username email')
        .populate('course', 'title')
        .sort({ paymentDate: -1 })
        .limit(10),
      
      // Popular courses
      Enrollment.aggregate([
        { $match: dateFilter },
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
      ]),
      
      // Monthly revenue
      Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: {
              year: { $year: '$paymentDate' },
              month: { $month: '$paymentDate' }
            },
            revenue: { $sum: '$finalAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);

    const stats = {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentPayments,
      popularCourses,
      monthlyRevenue
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// Get enrollment reports
exports.getEnrollmentReports = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    const reports = await reportService.generateEnrollmentReport({
      period,
      startDate,
      endDate
    });

    res.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error('Enrollment report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating enrollment report',
      error: error.message
    });
  }
};

// Get revenue reports
exports.getRevenueReports = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate, groupBy = 'course' } = req.query;

    const reports = await reportService.generateRevenueReport({
      period,
      startDate,
      endDate,
      groupBy
    });

    res.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating revenue report',
      error: error.message
    });
  }
};

// Get user activity reports
exports.getUserActivityReports = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    const reports = await reportService.generateUserActivityReport({
      period,
      startDate,
      endDate
    });

    res.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error('User activity report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating user activity report',
      error: error.message
    });
  }
};

// Export reports
exports.exportReports = async (req, res) => {
  try {
    const { type, format = 'csv', ...filters } = req.query;

    let reportData;
    switch (type) {
      case 'enrollments':
        reportData = await reportService.generateEnrollmentReport(filters);
        break;
      case 'revenue':
        reportData = await reportService.generateRevenueReport(filters);
        break;
      case 'users':
        reportData = await reportService.generateUserActivityReport(filters);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    const exportedData = await reportService.exportReport(reportData, format);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${Date.now()}.${format}`);
    
    res.send(exportedData);

  } catch (error) {
    console.error('Report export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting report',
      error: error.message
    });
  }
};