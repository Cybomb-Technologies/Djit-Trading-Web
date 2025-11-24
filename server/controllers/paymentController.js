// server/controllers/paymentController.js
const axios = require("axios");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
require("dotenv").config();

const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL;

// ✅ Create Order (called by frontend)
const createOrder = async (req, res) => {
  try {
    const { amount, name, email, phone, courseId, userId } = req.body;

    if (!name || !email || !phone || !courseId || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const orderPayload = {
      order_id: `ORDER_${Date.now()}`,
      order_amount: amount,
      customer_details: {
        customer_id: userId,        // ✅ added
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      },
      order_currency: "INR",
      order_note: `Course Enrollment: ${courseId}`,
    };

    const response = await axios.post(CASHFREE_BASE_URL, orderPayload, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-01-01",
        "Content-Type": "application/json",
      },
    });

    res.json({
      paymentLink: response.data.payment_link,
      orderId: response.data.order_id,
      paymentSessionId: response.data.order_token, // optional for SDK
    });
  } catch (err) {
    console.error("Cashfree Create Order Error:", err.response?.data || err.message);
    res.status(500).json({
      message: err.response?.data?.message || "Failed to create order",
    });
  }
};


// ✅ Verify Payment (called by frontend polling)
const verifyPayment = async (req, res) => {
  try {
    const { orderId, courseId, userId } = req.body;

    if (!orderId || !courseId || !userId) {
      return res.status(400).json({ success: false, message: "Missing required data" });
    }

    // Get order status from Cashfree
    const response = await axios.get(`${CASHFREE_BASE_URL}/${orderId}`, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-01-01",
      },
    });

    const data = response.data;

    if (data.order_status === "PAID") {
      // Check if already enrolled
      const existing = await Enrollment.findOne({ user: userId, course: courseId });
      if (existing) {
        return res.status(400).json({ success: false, message: "Already enrolled in this course" });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      // Create enrollment
      const enrollment = new Enrollment({
        user: userId,
        course: courseId,
        amountPaid: data.order_amount,
        paymentMethod: "Cashfree",
        paymentStatus: "completed",
        transactionId: orderId,
        enrolledAt: new Date(),
      });

      await enrollment.save();

      return res.status(200).json({
        success: true,
        message: "Payment verified and enrollment successful",
        enrollment: {
          id: enrollment._id,
          course: course.title,
          enrolledAt: enrollment.enrolledAt,
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "Payment not completed yet",
        orderStatus: data.order_status,
      });
    }
  } catch (err) {
    console.error("Cashfree Verify Payment Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};



// ✅ NEW: Create Mobile Order
const createMobileOrder = async (req, res) => {
  try {
    const { amount, name, email, phone, courseId, userId, couponCode } = req.body;

    console.log("📱 Mobile Order Request:", { amount, name, email, courseId, userId });

    if (!name || !email || !phone || !courseId || !userId) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields" 
      });
    }

    const orderId = `MOBILE_ORDER_${Date.now()}_${userId.substring(0, 8)}`;
    
    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      customer_details: {
        customer_id: userId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      },
      order_currency: "INR",
      order_note: `Mobile App - Course: ${courseId}`,
      order_meta: {
        return_url: "cybombapp://payment/callback",
        notify_url: `${process.env.API_BASE_URL}/api/payment/mobile-webhook`
      }
    };

    const response = await axios.post(CASHFREE_BASE_URL, orderPayload, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Mobile Order Created:", response.data);

    // ✅ Mobile-specific response
    res.json({
      success: true,
      orderId: response.data.order_id,
      paymentSessionId: response.data.payment_session_id,
      orderAmount: response.data.order_amount,
      orderCurrency: response.data.order_currency,
      appId: process.env.CASHFREE_APP_ID,
      environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST'
    });

  } catch (err) {
    console.error("❌ Mobile Order Error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: err.response?.data?.message || "Failed to create mobile order"
    });
  }
};

// ✅ NEW: Verify Mobile Payment
const verifyMobilePayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, courseId, userId, couponCode } = req.body;

    console.log("📱 Mobile Verify Request:", { orderId, paymentId, courseId, userId });

    if (!orderId || !paymentId || !signature || !courseId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required data" 
      });
    }

    // ✅ Verify Cashfree signature for mobile
    const data = `${orderId}${paymentId}${process.env.CASHFREE_SECRET_KEY}`;
    const generatedSignature = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');

    console.log("🔐 Signature Check:", { received: signature, generated: generatedSignature });

    if (generatedSignature !== signature) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid payment signature" 
      });
    }

    // ✅ Get payment status from Cashfree
    const paymentResponse = await axios.get(
      `${CASHFREE_BASE_URL}/${orderId}/payments/${paymentId}`,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
        },
      }
    );

    const paymentData = paymentResponse.data;
    console.log("📊 Payment Status:", paymentData.payment_status);

    if (paymentData.payment_status === "SUCCESS") {
      // ✅ Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({ 
        user: userId, 
        course: courseId 
      });
      
      if (existingEnrollment) {
        return res.json({
          success: true,
          message: "Already enrolled in this course",
          enrollment: existingEnrollment
        });
      }

      // ✅ Check course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ 
          success: false, 
          message: "Course not found" 
        });
      }

      // ✅ Apply coupon if provided
      if (couponCode) {
        try {
          const coupon = await Coupon.findOne({ code: couponCode });
          if (coupon) {
            coupon.usedCount += 1;
            coupon.usedBy.push(userId);
            await coupon.save();
            console.log('✅ Coupon applied for mobile payment:', couponCode);
          }
        } catch (couponError) {
          console.error('⚠️ Coupon apply error:', couponError);
          // Don't fail enrollment if coupon fails
        }
      }

      // ✅ Create enrollment
      const enrollment = new Enrollment({
        user: userId,
        course: courseId,
        amountPaid: paymentData.payment_amount,
        paymentMethod: "Cashfree-Mobile",
        paymentStatus: "completed",
        transactionId: paymentId,
        orderId: orderId,
        platform: "android",
        couponCode: couponCode || null,
        enrolledAt: new Date(),
      });

      await enrollment.save();

      console.log("✅ Mobile Enrollment Created:", enrollment._id);

      return res.json({
        success: true,
        message: "Payment successful and enrollment completed",
        enrollment: {
          id: enrollment._id,
          courseId: courseId,
          courseTitle: course.title,
          enrolledAt: enrollment.enrolledAt,
          amountPaid: enrollment.amountPaid
        }
      });
    } else {
      return res.json({
        success: false,
        message: "Payment not successful",
        paymentStatus: paymentData.payment_status
      });
    }
  } catch (err) {
    console.error("❌ Mobile Verify Error:", err.response?.data || err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to verify mobile payment" 
    });
  }
};

// ✅ NEW: Mobile Webhook (for server-to-server notifications)
const mobileWebhook = async (req, res) => {
  try {
    const { orderId, paymentId, signature, orderAmount, paymentStatus } = req.body;

    console.log("📱 Mobile Webhook Received:", { orderId, paymentId, paymentStatus });

    // Verify webhook signature
    const webhookData = orderId + orderAmount + process.env.CASHFREE_SECRET_KEY;
    const webhookSignature = crypto
      .createHash('sha256')
      .update(webhookData)
      .digest('hex');

    if (webhookSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    if (paymentStatus === "SUCCESS") {
      // Update enrollment status if needed
      await Enrollment.findOneAndUpdate(
        { orderId: orderId },
        { 
          paymentStatus: "completed",
          transactionId: paymentId
        }
      );
      console.log("✅ Webhook: Enrollment updated for order:", orderId);
    }

    res.json({ success: true, message: "Webhook processed" });
  } catch (err) {
    console.error("❌ Mobile Webhook Error:", err);
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};

module.exports = { 
  createOrder, 
  verifyPayment, 
  createMobileOrder, 
  verifyMobilePayment, 
  mobileWebhook 
};
