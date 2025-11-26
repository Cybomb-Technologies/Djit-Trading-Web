// server/controllers/paymentController.js
const axios = require("axios");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
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
        orderId: orderId,
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

// ✅ NEW: Create Mobile Order for IAP
const createMobileOrder = async (req, res) => {
    try {
        const { amount, name, email, phone, courseId, userId, platform, couponCode } = req.body;

        console.log("📱 IAP CONTROLLER DEBUG: Received create-mobile request. Body:", req.body);

        if (!amount || !courseId || !userId || !platform) {
            console.log("❌ IAP CONTROLLER ERROR: Missing required fields for mobile order.");
            return res.status(400).json({ message: "Missing required fields for mobile IAP order." });
        }

        // 1. Generate a unique server-side order ID (MANDATORY)
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
                    isIAP: true // 🎯 Mark as IAP purchase
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

// ✅ NEW: Verify Mobile IAP Payment
const verifyMobilePayment = async (req, res) => {
    const { orderId, purchaseToken, productId, courseId, userId, platform, couponCode } = req.body;

    console.log("📱 IAP CONTROLLER DEBUG: Received verify-mobile request. Body:", req.body);

    if (!orderId || !purchaseToken || !productId || !courseId || !userId || !platform) {
        console.log("❌ IAP CONTROLLER ERROR: Missing required fields for verification.");
        return res.status(400).json({ message: "Missing required fields for mobile IAP verification." });
    }

    try {
        // 1. Find the enrollment by orderId
        const enrollment = await Enrollment.findOne({ 
            orderId: orderId, 
            user: userId, 
            course: courseId 
        });

        if (!enrollment) {
            console.log(`❌ IAP CONTROLLER FAIL: Enrollment record not found for orderId: ${orderId}`);
            return res.status(404).json({ 
                success: false, 
                message: "Server order record not found for this purchase." 
            });
        }

        // 2. Check if already completed
        if (enrollment.paymentStatus === "completed") {
            console.log(`✅ IAP CONTROLLER: Payment already completed for orderId: ${orderId}`);
            return res.status(200).json({
                success: true,
                message: "Payment already verified and enrollment completed.",
                enrollment: enrollment,
            });
        }

        // 3. Perform Platform-Specific Verification
        let isVerified = false;
        let verificationDetails = {};
        
        if (platform === 'android_iap') {
            const verificationResult = await _verifyGooglePlayPurchase(purchaseToken, productId);
            isVerified = verificationResult.isValid;
            verificationDetails = verificationResult.details || {};
        } else if (platform === 'ios_iap') {
            // Placeholder for iOS verification
            console.log("⚠️ IAP CONTROLLER WARNING: iOS verification is a placeholder.");
            isVerified = true;
            verificationDetails = { platform: 'ios', method: 'placeholder' };
        }

        if (!isVerified) {
            console.log(`❌ IAP CONTROLLER FAIL: Purchase verification failed for orderId: ${orderId}`);
            
            // ✅ FIX 1: Ensure metadata is an object before setting properties
            if (!enrollment.metadata) {
                enrollment.metadata = {};
            }
            
            // Update enrollment with failure status
            enrollment.paymentStatus = "failed";
            enrollment.metadata.verificationError = "Purchase verification failed";
            enrollment.metadata.verificationAttemptedAt = new Date();
            await enrollment.save();
            
            return res.status(402).json({ 
                success: false, 
                message: "Purchase verification failed with the store." 
            });
        }

        // 🎯 CRITICAL FIX: Update Enrollment Status to COMPLETED
        enrollment.paymentStatus = "completed";
        enrollment.transactionId = purchaseToken;
        enrollment.enrolledAt = new Date(); 
        
        // <<<< 🔥 ADD THIS DEFENSIVE CHECK HERE 🔥 >>>>
        if (!enrollment.metadata) {
            enrollment.metadata = {};
        }
        
        enrollment.metadata.isVerified = true; // This line now works
        enrollment.metadata.verifiedAt = new Date();
        enrollment.metadata.verificationDetails = verificationDetails;
        enrollment.metadata.couponCode = couponCode || enrollment.metadata.couponCode;
        
        // 🎯 Apply coupon logic if any (you might want to move this to a separate function)
        if (couponCode) {
            enrollment.metadata.couponApplied = true;
            enrollment.metadata.couponCode = couponCode;
            // Add any coupon-specific logic here
        }

        await enrollment.save();

        console.log(`✅ IAP CONTROLLER SUCCESS: Verification successful. Enrollment COMPLETED for orderId: ${orderId}`);
        console.log(`✅ IAP CONTROLLER: User ${userId} is now fully enrolled in course ${courseId}`);

        // 5. Return success response
        return res.status(200).json({
            success: true,
            message: "Mobile IAP payment verified and enrollment completed.",
            enrollment: enrollment,
        });

    } catch (err) {
        console.error("❌ IAP CONTROLLER ERROR: verifyMobilePayment failed.", err.message);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error during mobile payment verification.",
        });
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
