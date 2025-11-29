const Newsletter = require('../models/Newsletter');
const { createNewsletterNotification } = require('./notificationController');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({
        success: false,
        message: 'Email already subscribed to newsletter'
      });
    }

    // Create new subscription
    const newsletter = new Newsletter({
      email
    });

    const savedNewsletter = await newsletter.save();

    // Create notification for admin
    await createNewsletterNotification(email);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: savedNewsletter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error subscribing to newsletter',
      error: error.message
    });
  }
};

// Get all subscribers (admin only)
exports.getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = search ? {
      email: { $regex: search, $options: 'i' }
    } : {};

    const subscribers = await Newsletter.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Newsletter.countDocuments(query);

    res.json({
      success: true,
      data: subscribers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscribers',
      error: error.message
    });
  }
};

// Get subscriber statistics
exports.getSubscriberStats = async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({ isActive: true });
    const todaySubscribers = await Newsletter.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    res.json({
      success: true,
      data: {
        total: totalSubscribers,
        active: activeSubscribers,
        today: todaySubscribers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriber stats',
      error: error.message
    });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const subscriber = await Newsletter.findOneAndUpdate(
      { email },
      { isActive: false },
      { new: true }
    );

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unsubscribing from newsletter',
      error: error.message
    });
  }
};

// Send newsletter (basic implementation)
exports.sendNewsletter = async (req, res) => {
  try {
    const { subject, content } = req.body;

    // Here you would integrate with your email service
    // For now, we'll just return success

    res.json({
      success: true,
      message: 'Newsletter sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending newsletter',
      error: error.message
    });
  }
};