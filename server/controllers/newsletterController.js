const Newsletter = require('../models/Newsletter');
const emailService = require('../services/emailService');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const existingSubscription = await Newsletter.findOne({ email });
    if (existingSubscription) return res.status(400).json({ success: false, message: 'Already subscribed' });

    const subscription = await Newsletter.create({ email });

    // Send welcome email
    await emailService.sendEmail({
      to: email,
      subject: 'Welcome to Djit Trading Newsletter 📩',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498db;">Thanks for subscribing!</h2>
          <p>You’ll now receive our latest trading tips, market news, and course updates.</p>
        </div>
      `
    });

    res.status(201).json({ success: true, message: 'Subscribed successfully', subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error subscribing', error: error.message });
  }
};

// Get subscribers (admin)
exports.getSubscribers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const subscribers = await Newsletter.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Newsletter.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({ success: true, subscribers, currentPage: page, totalPages, totalSubscribers: total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscribers', error: error.message });
  }
};

// Unsubscribe (kept for admin only, no email sent)
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const subscription = await Newsletter.findOneAndUpdate(
      { email },
      { isActive: false },
      { new: true }
    );

    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error unsubscribing', error: error.message });
  }
};

// Send newsletter (admin)
exports.sendNewsletter = async (req, res) => {
  try {
    const { subject, content } = req.body;
    if (!subject || !content) return res.status(400).json({ success: false, message: 'Subject and content required' });

    const activeSubscribers = await Newsletter.find({ isActive: true });
    if (activeSubscribers.length === 0) return res.status(400).json({ success: false, message: 'No active subscribers' });

    const emailPromises = activeSubscribers.map(sub =>
      emailService.sendNewsletter({ to: sub.email, subject, content })
    );

    await Promise.all(emailPromises);

    res.json({ success: true, message: `Newsletter sent to ${activeSubscribers.length} subscribers`, recipients: activeSubscribers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending newsletter', error: error.message });
  }
};

// Subscriber stats
exports.getSubscriberStats = async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({ isActive: true });
    const inactiveSubscribers = totalSubscribers - activeSubscribers;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newSubscribers = await Newsletter.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.json({ success: true, stats: { total: totalSubscribers, active: activeSubscribers, inactive: inactiveSubscribers, newLast30Days: newSubscribers } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
};
