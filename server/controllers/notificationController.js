const Notification = require('../models/Notification');
const Newsletter = require('../models/Newsletter');
const Coupon = require('../models/Coupon');

// Get all notifications for admin
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      notification,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
};

// Create newsletter notification (to be called when new newsletter subscription happens)
exports.createNewsletterNotification = async (email) => {
  try {
    const notification = new Notification({
      title: 'New Newsletter Subscription',
      message: `New subscription from: ${email}`,
      type: 'newsletter'
    });

    await notification.save();

    // Emit real-time notification via Socket.IO
    if (global.io) {
      const unreadCount = await Notification.countDocuments({ isRead: false });
      global.io.emit('newNotification', {
        notification,
        unreadCount
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating newsletter notification:', error);
  }
};

// Create coupon notification (to be called when new coupon is created)
exports.createCouponNotification = async (couponCode, couponId) => {
  try {
    const notification = new Notification({
      title: 'New Coupon Created',
      message: `New coupon created: ${couponCode}`,
      type: 'coupon',
      relatedId: couponId
    });

    await notification.save();

    // Emit real-time notification via Socket.IO
    if (global.io) {
      const unreadCount = await Notification.countDocuments({ isRead: false });
      global.io.emit('newNotification', {
        notification,
        unreadCount
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating coupon notification:', error);
  }
};

// Create coupon usage notification (when coupon is applied)
exports.createCouponUsageNotification = async (couponCode, discountAmount, finalAmount) => {
  try {
    const notification = new Notification({
      title: 'Coupon Applied Successfully',
      message: `Coupon ${couponCode} applied: ₹${discountAmount} discount, Final amount: ₹${finalAmount}`,
      type: 'coupon'
    });

    await notification.save();

    // Emit real-time notification via Socket.IO
    if (global.io) {
      const unreadCount = await Notification.countDocuments({ isRead: false });
      global.io.emit('newNotification', {
        notification,
        unreadCount
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating coupon usage notification:', error);
  }
};

// Create coupon limit reached notification
exports.createCouponLimitNotification = async (couponCode) => {
  try {
    const notification = new Notification({
      title: 'Coupon Limit Reached',
      message: `Coupon ${couponCode} has reached its usage limit and has been deactivated`,
      type: 'coupon'
    });

    await notification.save();

    // Emit real-time notification via Socket.IO
    if (global.io) {
      const unreadCount = await Notification.countDocuments({ isRead: false });
      global.io.emit('newNotification', {
        notification,
        unreadCount
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating coupon limit notification:', error);
  }
};

// Create new user registration notification
exports.createUserRegistrationNotification = async (username, email) => {
  try {
    const notification = new Notification({
      title: 'New User Registered',
      message: `User ${username} registered with email: ${email}`,
      type: 'user'
    });

    await notification.save();

    // Emit via Socket.IO for real-time admin updates
    if (global.io) {
      const unreadCount = await Notification.countDocuments({ isRead: false });
      global.io.emit('newNotification', {
        notification,
        unreadCount
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating user registration notification:', error);
  }
};
