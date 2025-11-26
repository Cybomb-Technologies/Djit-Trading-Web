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
    const { amount, name, email, phone, courseId, userId, couponCode, platform } = req.body;

     // 1. Construct the correct webhook URL using the new APP_BASE_URL
    const notifyUrl = `${APP_BASE_URL}/api/payment/mobile-webhook`;
    console.log(`✅ Mobile Webhook configured as: ${notifyUrl}`);

    if (!APP_BASE_URL) {
      // Explicitly return the 500 error that Dart saw, but with a clearer message.
      return res.status(500).json({
        success: false,
        message: `order_meta.notify_url : invalid url entered. Value received: undefined/api/payment/mobile-webhook. FIX: APP_BASE_URL environment variable is missing.`
      });
    }

    console.log("📱 Mobile Order Request:", { amount, name, email, courseId, userId, platform });

    if (!name || !email || !phone || !courseId || !userId) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields" 
      });
    }

     const orderPayload = {
      // Generate a unique order ID for your database/Cashfree
      order_id: `IAP_${Date.now()}_${userId}`,
      order_amount: amount,
      // ... other details ...
      order_meta: {
        // This notify_url is still needed if you use a PG to generate an order ID
        notify_url: notifyUrl,
      }
    };

    // For IAP purchases, we don't need to create a Cashfree order
    // Instead, create a database record to track the IAP purchase
    // const orderId = `IAP_ORDER_${Date.now()}_${userId.substring(0, 8)}`;
    
    // Create enrollment record with pending status
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
      amountPaid: amount,
      paymentMethod: "Google-Play-IAP",
      paymentStatus: "pending", // Will be updated when IAP is verified
      orderId: orderPayload.order_id,
      platform: "android_iap",
      couponCode: couponCode || null,
      enrolledAt: new Date(),
    });

    await enrollment.save();

    console.log("✅ IAP Mobile Order Created in DB:", enrollment._id);

    // ✅ IAP-specific response - no Cashfree payment link needed
    res.json({
      success: true,
      orderId: orderId,
      enrollmentId: enrollment._id,
      message: "IAP order created successfully. Proceed with Google Play purchase."
    });

  } catch (err) {
    console.error("❌ IAP Mobile Order Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create IAP mobile order"
    });
  }
};

// ✅ NEW: Verify Mobile IAP Payment
const verifyMobilePayment = async (req, res) => {
  try {
    const { orderId, purchaseToken, productId, courseId, userId, couponCode, platform } = req.body;

    console.log("📱 Mobile IAP Verify Request:", { orderId, productId, courseId, userId, platform });

    if (!orderId || !purchaseToken || !productId || !courseId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required data" 
      });
    }

    // For IAP, we need to verify with Google Play Developer API
    // This is a simplified version - you'll need to implement proper Google Play verification
    
    // Check if enrollment exists
    const enrollment = await Enrollment.findOne({ 
      orderId: orderId,
      user: userId 
    });
    
    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: "Enrollment record not found" 
      });
    }

    // Verify IAP purchase with Google Play (simplified - implement proper verification)
    const isPurchaseValid = await verifyGooglePlayPurchase(purchaseToken, productId);
    
    if (!isPurchaseValid) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid IAP purchase" 
      });
    }

    // Check course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    // Apply coupon if provided
    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode });
        if (coupon) {
          coupon.usedCount += 1;
          coupon.usedBy.push(userId);
          await coupon.save();
          console.log('✅ Coupon applied for IAP payment:', couponCode);
        }
      } catch (couponError) {
        console.error('⚠️ Coupon apply error:', couponError);
        // Don't fail enrollment if coupon fails
      }
    }

    // Update enrollment status
    enrollment.paymentStatus = "completed";
    enrollment.transactionId = purchaseToken;
    enrollment.completedAt = new Date();
    await enrollment.save();

    console.log("✅ IAP Enrollment Completed:", enrollment._id);

    return res.json({
      success: true,
      message: "IAP payment successful and enrollment completed",
      enrollment: {
        id: enrollment._id,
        courseId: courseId,
        courseTitle: course.title,
        enrolledAt: enrollment.enrolledAt,
        amountPaid: enrollment.amountPaid
      }
    });

  } catch (err) {
    console.error("❌ Mobile IAP Verify Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to verify mobile IAP payment" 
    });
  }
};

const getGooglePlayAPIClient = async () => {
  try {
    const auth = new new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      // Note: We rely on Application Default Credentials (ADC) or env vars for key loading
      // which is standard for Node.js environments.
    });

    const authClient = await auth.getClient();

    // The package name is crucial for the API call
    const packageName = process.env.ANDROID_APP_PACKAGE_NAME;
    if (!packageName) {
      console.error('CRITICAL ERROR: ANDROID_APP_PACKAGE_NAME environment variable is not set.');
      throw new Error('Android package name is missing.');
    }

    return {
      api: google.androidpublisher({
        version: 'v3',
        auth: authClient,
      }),
      packageName: packageName,
    };
  } catch (error) {
    console.error('Failed to initialize Google Play API Client:', error);
    throw new Error('Google Play API initialization failed.');
  }
};


// ✅ NEW: Verify IAP Purchase with Google Play Developer API
async function verifyGooglePlayPurchase(productId, purchaseToken) {
  try {
    console.log(`🔐 Verifying Google Play purchase: ${productId} with token: ${purchaseToken}`);

    const { api, packageName } = await getGooglePlayAPIClient();

    // Call the Google Play Developer API to verify the purchase
    const verificationResponse = await api.purchases.products.get({
      packageName: packageName,
      productId: productId,
      token: purchaseToken,
    });

    const purchase = verificationResponse.data;

    console.log('Google Play API Response Status:', verificationResponse.status);
    console.log('Purchase State:', purchase.purchaseState); // 0=PURCHASED, 1=CANCELED, 2=PENDING

    // Check if the purchase is valid and in a PURCHASED state (0)
    if (purchase.purchaseState === 0) {
      console.log('✅ Google Play Purchase Verified and is in state: PURCHASED');
      return true;
    } else {
      console.log(`❌ Google Play Purchase FAILED verification. State: ${purchase.purchaseState}`);
      return false;
    }

  } catch (error) {
    // If the API call fails (e.g., token is invalid, 404 error)
    console.error('❌ Google Play verification error:', error.message || error);
    if (error.response && error.response.status === 404) {
        console.error('Invalid purchase token or non-existent purchase detected (404).');
    }
    return false;
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
    res.status(500).json({ success: false, message: "IAP webhook processing failed" });
  }
};

module.exports = { 
  createOrder, 
  verifyPayment, 
  createMobileOrder, 
  verifyMobilePayment, 
  mobileWebhook 
};
