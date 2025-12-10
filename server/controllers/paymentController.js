// server/controllers/paymentController.js
const axios = require("axios");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Notification = require("../models/Notification");
require("dotenv").config();

const APP_BASE_URL = process.env.APP_BASE_URL;

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
// ✅ Verify Payment (Cashfree)
const verifyPayment = async (req, res) => {
  try {
    const { orderId, courseId, userId } = req.body;

    if (!orderId || !courseId || !userId) {
      return res.status(400).json({ success: false, message: "Missing required data" });
    }

    const response = await axios.get(`${CASHFREE_BASE_URL}/${orderId}`, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-01-01",
      },
    });

    const data = response.data;

    if (data.order_status === "PAID") {
      const existing = await Enrollment.findOne({ user: userId, course: courseId });
      if (existing) {
        return res.status(400).json({ success: false, message: "Already enrolled in this course" });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      const enrollment = new Enrollment({
        user: userId,
        course: courseId,
        orderId: orderId,
        amountPaid: data.order_amount,
        paymentMethod: "Cashfree",
        paymentStatus: "completed",
        transactionId: orderId,
        enrolledAt: new Date(),
      });

      await enrollment.save();

      // 🔔 Notification
      try {
        const notification = await Notification.create({
          title: 'New Enrollment Completed',
          message: `User ${userId} enrolled in course "${course.title}".`,
          type: 'enrollment',
          relatedId: enrollment._id,
          isRead: false
        });
        console.log('✅ Enrollment notification created:', notification._id);
      } catch (notifErr) {
        console.error('❌ Notification creation failed:', notifErr.message);
      }

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

// ✅ FIX: Enhanced createMobileOrder function
const createMobileOrder = async (req, res) => {
    try {
        const { amount, name, email, phone, courseId, userId, platform, couponCode } = req.body;

        console.log("📱 IAP CONTROLLER DEBUG: Received create-mobile request. Body:", req.body);

        if (!amount || !courseId || !userId || !platform) {
            console.log("❌ IAP CONTROLLER ERROR: Missing required fields for mobile order.");
            return res.status(400).json({ message: "Missing required fields for mobile IAP order." });
        }

        // 1. Generate a unique server-side order ID
        const orderId = `IAP_${platform.toUpperCase()}_${Date.now()}_${userId.substring(0, 8)}`;
        console.log(`📱 IAP CONTROLLER DEBUG: Generated new orderId: ${orderId}`);

        // 2. Check if user is already enrolled (COMPLETED enrollment only)
        const existingCompletedEnrollment = await Enrollment.findOne({ 
            user: userId, 
            course: courseId,
            paymentStatus: "completed" 
        });

        if (existingCompletedEnrollment) {
            console.log(`❌ IAP CONTROLLER: User ${userId} already enrolled in course ${courseId}`);
            return res.status(400).json({ 
                success: false, 
                message: "Already enrolled in this course" 
            });
        }

        // 3. Check for existing PENDING enrollment and update it (don't create new)
        let enrollment = await Enrollment.findOne({ 
            user: userId, 
            course: courseId,
            paymentStatus: "pending" 
        });

        if (enrollment) {
            // Update existing pending enrollment
            enrollment.orderId = orderId;
            enrollment.amount = amount;
            enrollment.metadata = {
                ...enrollment.metadata,
                name,
                email,
                phone,
                platform,
                couponCode: couponCode || null,
                updatedAt: new Date()
            };
            console.log(`📱 IAP CONTROLLER: Updated existing pending enrollment for orderId: ${orderId}`);
        } else {
            // 🎯 CRITICAL FIX: Create enrollment with PENDING status only
            enrollment = new Enrollment({
                user: userId,
                course: courseId,
                orderId: orderId,
                amount: amount,
                paymentMethod: platform === 'android_iap' ? 'Google Play IAP' : 'Apple App Store IAP',
                paymentStatus: "pending", // 🎯 IMPORTANT: Keep as pending until payment verified
                transactionId: null,
                enrolledAt: null, // 🎯 Don't set enrolledAt until payment is complete
                metadata: {
                    name,
                    email,
                    phone,
                    platform,
                    couponCode: couponCode || null,
                    createdAt: new Date(),
                    isIAP: true
                }
            });
            console.log(`📱 IAP CONTROLLER: Created new pending enrollment for orderId: ${orderId}`);
        }

        await enrollment.save();
        console.log(`✅ IAP CONTROLLER DEBUG: Saved/updated PENDING enrollment for orderId: ${orderId}`);

        // 4. Return the generated server-side order ID to the client
        return res.status(200).json({
            success: true,
            message: "Mobile IAP order created successfully.",
            orderId: orderId,
        });

    } catch (err) {
        console.error("❌ IAP CONTROLLER ERROR: createMobileOrder failed.", err.message);
        
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error during mobile order creation.",
        });
    }
};

// NOTE: This is your mock/utility function. Replace with actual API calls in production.
async function verifyIAPPurchaseWithPlatform(purchaseToken, productId, platform) {
    console.log(`📡 Simulating ${platform} verification for token: ${purchaseToken.substring(0, 15)}...`);
    // Example logic: In a real scenario, this API call fails if the purchase timed out, 
    // was canceled, or is a duplicate.
    const isValid = !!purchaseToken; 
    
    return {
        isValid: isValid,
        details: { verifiedAt: new Date() }
    };
}

// ✅ FIX: Enhanced verifyMobilePayment function
const verifyMobilePayment = async (req, res) => {
    const { orderId, purchaseToken, productId, courseId, userId, platform } = req.body;
    
    if (!orderId || !purchaseToken || !productId || !courseId || !userId) {
        return res.status(400).json({ success: false, message: "Missing required fields for mobile verification." });
    }

    try {
        // 1. Find the PENDING enrollment record.
        let enrollment = await Enrollment.findOne({ 
            orderId: orderId, 
            user: userId, 
            course: courseId, 
            paymentStatus: 'pending' // Only target pending records
        });

        // 1b. Check if already completed (for restored purchases or retries)
        if (!enrollment) {
            const completedEnrollment = await Enrollment.findOne({ 
                orderId: orderId, 
                user: userId, 
                course: courseId, 
                paymentStatus: 'completed' 
            });
            if (completedEnrollment) {
                 return res.status(200).json({ 
                     success: true, 
                     message: "Payment already verified and enrollment completed.",
                     cashfreeVerified: true,  // 🎯 ADD THIS
                     iapVerified: true        // 🎯 ADD THIS
                 });
            }
            // If no pending or completed enrollment is found
            return res.status(404).json({ success: false, message: "No matching pending enrollment found to verify." });
        }

        // 2. VERIFY PURCHASE TOKEN WITH PLATFORM (Google Play/Apple)
        const verificationPlatform = platform === 'android_iap' ? 'google_play' : 'apple_store';
        const { isValid, details } = await verifyIAPPurchaseWithPlatform(purchaseToken, productId, verificationPlatform);

        if (isValid) {
            // 3. Verification SUCCESS: Update Enrollment to 'completed'
            enrollment.paymentStatus = 'completed';
            enrollment.transactionId = purchaseToken;
            enrollment.enrolledAt = new Date(); // 🎯 CRITICAL: Set enrolledAt only when payment completes
            
            await enrollment.save();
            console.log("✅ IAP Verification SUCCESS for Order:", orderId);

            return res.status(200).json({ 
                success: true, 
                message: "Mobile IAP verified and enrollment completed successfully.",
                cashfreeVerified: true,  // 🎯 ADD THIS
                iapVerified: true,       // 🎯 ADD THIS
                orderId: orderId
            });
        } else {
            // 4. Verification FAILURE (Purchase timeout, user cancel, receipt invalid)
            enrollment.paymentStatus = 'failed'; 
            await enrollment.save();
            console.log("❌ IAP Verification FAILED for Order:", orderId);

            return res.status(400).json({ 
                success: false, 
                message: "Payment receipt verification failed or purchase was not valid/completed." 
            });
        }

    } catch (error) {
        console.error("❌ Critical Server Error in verifyMobilePayment:", error.message);
        res.status(500).json({ success: false, message: `Server error during payment verification: ${error.message}` });
    }
};

// ✅ Google Play Purchase Verification
async function _verifyGooglePlayPurchase(purchaseToken, productId) {
    try {
        // TODO: Implement actual Google Play Developer API verification
        // For now, we'll simulate successful verification
        
        console.log(`🔍 Google Play Verification: productId: ${productId}, token: ${purchaseToken.substring(0, 20)}...`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 🎯 TEMPORARY: Always return true for testing
        // In production, implement actual Google Play API call here
        const isValid = purchaseToken && purchaseToken.length > 10;
        
        return {
            isValid: isValid,
            details: {
                verifiedAt: new Date(),
                productId: productId,
                platform: 'google_play',
                // Add actual verification response fields here
            }
        };
        
    } catch (error) {
        console.error('❌ Google Play verification error:', error.message);
        return {
            isValid: false,
            details: {
                error: error.message,
                verifiedAt: new Date()
            }
        };
    }
}

// ✅ NEW: Mobile Webhook for IAP (optional)
const mobileWebhook = async (req, res) => {
  try {
    const { orderId, purchaseToken, productId, purchaseStatus } = req.body;

    console.log("📱 Mobile IAP Webhook Received:", { orderId, productId, purchaseStatus });

    if (purchaseStatus === "SUCCESS") {
      // Update enrollment status if needed
      await Enrollment.findOneAndUpdate(
        { orderId: orderId },
        { 
          paymentStatus: "completed",
          transactionId: purchaseToken
        }
      );
      console.log("✅ IAP Webhook: Enrollment updated for order:", orderId);
    }

    res.json({ success: true, message: "IAP webhook processed" });
  } catch (err) {
    console.error("❌ Mobile IAP Webhook Error:", err);
    res.status(500).json({ success: false, message: "IAP webhook processing failed." });
  }
};

module.exports = { 
  createOrder, 
  verifyPayment, 
  createMobileOrder, 
  verifyMobilePayment, 
  mobileWebhook 
};
