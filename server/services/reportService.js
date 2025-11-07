const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Course = require('../models/Course');
const { Parser } = require('json2csv');

class ReportService {
  async generateEnrollmentReport({ period = 'monthly', startDate, endDate }) {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);
      
      const enrollments = await Enrollment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: this.getGrouping(period),
            enrollments: { $sum: 1 },
            completed: {
              $sum: { $cond: ['$completed', 1, 0] }
            },
            totalRevenue: {
              $sum: '$amountPaid'
            }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      return this.formatReportData(enrollments, period);
    } catch (error) {
      console.error('Enrollment report generation error:', error);
      throw error;
    }
  }

  async generateRevenueReport({ period = 'monthly', startDate, endDate, groupBy = 'course' }) {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);
      dateFilter.paymentStatus = 'completed';

      let groupStage;
      if (groupBy === 'course') {
        groupStage = {
          _id: '$course',
          revenue: { $sum: '$finalAmount' },
          transactions: { $sum: 1 },
          averageOrderValue: { $avg: '$finalAmount' }
        };
      } else {
        groupStage = {
          _id: this.getGrouping(period),
          revenue: { $sum: '$finalAmount' },
          transactions: { $sum: 1 },
          averageOrderValue: { $avg: '$finalAmount' }
        };
      }

      const revenueData = await Payment.aggregate([
        { $match: dateFilter },
        { $group: groupStage },
        { $sort: { revenue: -1 } },
        ...(groupBy === 'course' ? [{
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course'
          }
        }, {
          $unwind: '$course'
        }] : [])
      ]);

      return revenueData;
    } catch (error) {
      console.error('Revenue report generation error:', error);
      throw error;
    }
  }

  async generateUserActivityReport({ period = 'monthly', startDate, endDate }) {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

      const userActivity = await User.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: this.getGrouping(period),
            newUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [
                  { $gt: ['$lastLogin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                  1, 0
                ]
              }
            }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Get enrollment statistics
      const enrollmentStats = await Enrollment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: this.getGrouping(period),
            enrollments: { $sum: 1 },
            completedCourses: {
              $sum: { $cond: ['$completed', 1, 0] }
            }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Merge user and enrollment data
      return this.mergeReportData(userActivity, enrollmentStats, period);
    } catch (error) {
      console.error('User activity report generation error:', error);
      throw error;
    }
  }

  async exportReport(data, format = 'csv') {
    try {
      if (format === 'csv') {
        const json2csv = new Parser();
        return json2csv.parse(data);
      } else if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Report export error:', error);
      throw error;
    }
  }

  buildDateFilter(startDate, endDate) {
    const filter = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.createdAt = { $lte: new Date(endDate) };
    }

    return filter;
  }

  getGrouping(period) {
    switch (period) {
      case 'daily':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
      case 'weekly':
        return {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
      case 'monthly':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
      case 'yearly':
        return {
          year: { $year: '$createdAt' }
        };
      default:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
    }
  }

  formatReportData(data, period) {
    return data.map(item => ({
      period: this.formatPeriod(item._id, period),
      ...item
    }));
  }

  formatPeriod(periodData, periodType) {
    switch (periodType) {
      case 'daily':
        return `${periodData.day}/${periodData.month}/${periodData.year}`;
      case 'weekly':
        return `Week ${periodData.week}, ${periodData.year}`;
      case 'monthly':
        return `${this.getMonthName(periodData.month)} ${periodData.year}`;
      case 'yearly':
        return periodData.year.toString();
      default:
        return `${periodData.month}/${periodData.year}`;
    }
  }

  getMonthName(month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  }

  mergeReportData(userData, enrollmentData, period) {
    const merged = [];
    
    userData.forEach(userItem => {
      const enrollmentItem = enrollmentData.find(e => 
        JSON.stringify(e._id) === JSON.stringify(userItem._id)
      );
      
      merged.push({
        period: this.formatPeriod(userItem._id, period),
        newUsers: userItem.newUsers,
        activeUsers: userItem.activeUsers,
        enrollments: enrollmentItem?.enrollments || 0,
        completedCourses: enrollmentItem?.completedCourses || 0
      });
    });

    return merged;
  }
}

module.exports = new ReportService();