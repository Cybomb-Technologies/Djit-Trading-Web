const axios = require('axios');

class CashfreePaymentService {
  constructor() {
    this.appId = process.env.CASHFREE_APP_ID;
    this.secretKey = process.env.CASHFREE_SECRET_KEY;
    this.baseURL = process.env.CASHFREE_ENV === 'development' 
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': '2022-09-01',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async createOrder(orderData) {
    try {
      console.log('💰 Creating Cashfree order with data:', orderData);
      
      const payload = {
        order_id: orderData.orderId,
        order_amount: orderData.amount,
        order_currency: orderData.currency || 'INR',
        customer_details: {
          customer_id: orderData.customerId,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone
        },
        order_meta: {
          return_url: `${process.env.FRONTEND_URL}/payment-callback?order_id={order_id}&course_id=${orderData.courseId}`,
          notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`
        },
        // ✅ ENABLE ALL PAYMENT METHODS
        order_tags: {
          course_id: orderData.courseId,
          course_title: orderData.courseTitle,
          payment_method: orderData.paymentMethod || 'multiple'
        }
      };

      // Add payment methods configuration
      if (orderData.paymentMethod && orderData.paymentMethod !== 'multiple') {
        // Specific payment method selected
        payload.payment_methods = {
          [orderData.paymentMethod]: { enabled: true }
        };
      } else {
        // All payment methods enabled
        payload.payment_methods = {
          netbanking: { enabled: true },
          card: { enabled: true },
          upi: { 
            enabled: true,
            apps: ["google_pay", "phonepe", "paytm", "bhim_upi"]
          },
          wallet: {
            enabled: true,
            apps: ["paytm", "amazon_pay", "mobikwik", "freecharge", "ola_money"]
          },
          paylater: {
            enabled: true,
            apps: ["simpl", "zestmoney", "epaylater", "getsimpl", "lazypay"]
          },
          emi: {
            enabled: orderData.amount >= 3000, // Enable EMI only for amounts >= 3000
            card_less: true,
            card_banks: ["hdfc", "icici", "kotak", "axis", "sbi", "indusind"]
          },
          app: {
            enabled: true,
            apps: ["gpay", "phonepe", "paytm", "bhim_upi", "amazon_pay"]
          }
        };
      }

      console.log('📦 Sending payload to Cashfree:', JSON.stringify(payload, null, 2));

      const response = await this.axiosInstance.post('/orders', payload);
      
      console.log('✅ Cashfree order creation response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Cashfree order creation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data,
        statusCode: error.response?.status
      };
    }
  }

  async getOrderStatus(orderId) {
    try {
      console.log('🔍 Getting order status for:', orderId);
      
      const response = await this.axiosInstance.get(`/orders/${orderId}`);
      
      console.log('✅ Order status response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Cashfree get order status error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  async getPaymentStatus(orderId) {
    try {
      console.log('🔍 Getting payment status for order:', orderId);
      
      const response = await this.axiosInstance.get(`/orders/${orderId}/payments`);
      
      console.log('✅ Payment status response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Cashfree get payment status error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // ✅ GET ALL PAYMENT METHODS
  async getPaymentMethods(amount) {
    try {
      const paymentMethods = {
        upi: {
          id: "upi",
          name: "UPI",
          description: "Instant UPI Payments",
          icon: "fas fa-mobile-alt",
          color: "#5f63f2",
          apps: [
            { id: "google_pay", name: "Google Pay", icon: "gpay.png" },
            { id: "phonepe", name: "PhonePe", icon: "phonepe.png" },
            { id: "paytm", name: "PayTM", icon: "paytm.png" },
            { id: "bhim_upi", name: "BHIM UPI", icon: "bhim.png" }
          ],
          enabled: true
        },
        card: {
          id: "card",
          name: "Credit/Debit Card",
          description: "Visa, Mastercard, RuPay, Amex",
          icon: "far fa-credit-card",
          color: "#ff6b6b",
          types: [
            { id: "visa", name: "Visa", icon: "fab fa-cc-visa" },
            { id: "mastercard", name: "Mastercard", icon: "fab fa-cc-mastercard" },
            { id: "rupay", name: "RuPay", icon: "fas fa-credit-card" },
            { id: "amex", name: "American Express", icon: "fab fa-cc-amex" }
          ],
          enabled: true
        },
        netbanking: {
          id: "netbanking",
          name: "Net Banking",
          description: "All major banks supported",
          icon: "fas fa-university",
          color: "#20c997",
          banks: [
            "HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", 
            "Kotak Mahindra", "Yes Bank", "IndusInd Bank", "Punjab National Bank"
          ],
          enabled: true
        },
        wallet: {
          id: "wallet",
          name: "Wallet",
          description: "Pay using digital wallets",
          icon: "fas fa-wallet",
          color: "#f7b924",
          apps: [
            { id: "paytm", name: "PayTM Wallet", icon: "paytm.png" },
            { id: "amazon_pay", name: "Amazon Pay", icon: "amazon_pay.png" },
            { id: "mobikwik", name: "MobiKwik", icon: "mobikwik.png" },
            { id: "freecharge", name: "FreeCharge", icon: "freecharge.png" }
          ],
          enabled: true
        },
        paylater: {
          id: "paylater",
          name: "Pay Later",
          description: "Buy now, pay later",
          icon: "fas fa-calendar-alt",
          color: "#7950f2",
          apps: [
            { id: "simpl", name: "Simpl", icon: "simpl.png" },
            { id: "lazypay", name: "LazyPay", icon: "lazypay.png" },
            { id: "epaylater", name: "ePayLater", icon: "epaylater.png" },
            { id: "zestmoney", name: "ZestMoney", icon: "zestmoney.png" }
          ],
          enabled: amount >= 100 // Minimum amount for paylater
        },
        emi: {
          id: "emi",
          name: "EMI",
          description: "Easy monthly installments",
          icon: "fas fa-chart-line",
          color: "#339af0",
          banks: [
            "HDFC Bank", "ICICI Bank", "Kotak Mahindra", "Axis Bank", 
            "State Bank of India", "IndusInd Bank"
          ],
          enabled: amount >= 3000, // Minimum amount for EMI
          note: "No Cost EMI Available"
        }
      };

      return {
        success: true,
        paymentMethods
      };
    } catch (error) {
      console.error('❌ Error getting payment methods:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify webhook signature
  async verifyWebhookSignature(signature, body) {
    try {
      const crypto = require('crypto');
      
      // Create signature from body
      const generatedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(body)
        .digest('base64');
      
      return generatedSignature === signature;
    } catch (error) {
      console.error('❌ Webhook signature verification error:', error);
      return false;
    }
  }
}

module.exports = new CashfreePaymentService();