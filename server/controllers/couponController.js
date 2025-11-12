// controllers/couponController.js
const Coupon = require('../models/Coupon.js');

exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, maxDiscount, validFrom, validUntil, usageLimit } = req.body;

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    
    console.log('🔵 Validate coupon called:', { code, totalAmount });

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon code is required' 
      });
    }

    // Case-insensitive search
    const coupon = await Coupon.findOne({ 
      code: code.toString().toUpperCase().trim(), 
      isActive: true 
    });

    if (!coupon) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid coupon code' 
      });
    }

    const now = new Date();
    
    // Check validity dates
    if (coupon.validFrom && now < coupon.validFrom) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon is not yet valid' 
      });
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon has expired' 
      });
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon usage limit reached' 
      });
    }

    // Calculate discount (only if totalAmount is provided)
    let discountAmount = 0;
    let finalAmount = totalAmount;
    
    if (totalAmount && !isNaN(totalAmount)) {
      // Check minimum purchase
      if (coupon.minPurchase && totalAmount < coupon.minPurchase) {
        return res.status(400).json({ 
          success: false, 
          message: `Minimum purchase of ₹${coupon.minPurchase} required` 
        });
      }

      // Calculate discount
      if (coupon.discountType === 'percentage') {
        discountAmount = (totalAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }

      finalAmount = totalAmount - discountAmount;
    }

    res.status(200).json({
      success: true,
      valid: true,  // ✅ Add this for frontend compatibility
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount
      },
      discountAmount,
      finalAmount
    });

  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;

    console.log('Apply coupon request:', { code, totalAmount });

    // Validate required fields
    if (!code || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and total amount are required',
      });
    }

    // Validate totalAmount is a number
    const numericTotalAmount = parseFloat(totalAmount);
    if (isNaN(numericTotalAmount) || numericTotalAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid total amount',
      });
    }

    // Find the coupon (case insensitive search)
    const coupon = await Coupon.findOne({ 
      code: code.toString().toUpperCase().trim()
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code',
      });
    }

    // Validate coupon status
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is no longer active',
      });
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not yet valid',
      });
    }

    if (now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired',
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached',
      });
    }

    if (coupon.minPurchase && numericTotalAmount < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ₹${coupon.minPurchase} required to use this coupon`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (numericTotalAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = Math.min(coupon.discountValue, numericTotalAmount);
    }

    const finalAmount = Math.max(0, numericTotalAmount - discountAmount);

    // Update coupon usage (only if not just validating)
    const updatedCoupon = await Coupon.findOneAndUpdate(
      { _id: coupon._id },
      {
        $inc: { usedCount: 1 },
        $set: {
          ...(coupon.usageLimit && coupon.usedCount + 1 >= coupon.usageLimit && { isActive: false }),
        },
      },
      { new: true }
    );

    console.log('Coupon applied successfully:', {
      code: updatedCoupon.code,
      discountAmount,
      finalAmount
    });

    return res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while applying coupon',
      error: error.message,
    });
  }
};