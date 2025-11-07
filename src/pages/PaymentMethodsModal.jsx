import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Spinner,
  Alert,
  Card,
  Row,
  Col
} from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import styles from "./PaymentMethodsModal.module.css";

const PaymentMethodsModal = ({ 
  show, 
  onHide, 
  course, 
  finalAmount, 
  couponData,
  onPaymentSuccess 
}) => {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [loading, setLoading] = useState(false);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useAuth();

  // Load available payment methods
  useEffect(() => {
    if (show && finalAmount > 0) {
      loadPaymentMethods();
    } else {
      // Reset when modal closes
      setSelectedMethod("");
      setPaymentMethods(null);
      setError("");
    }
  }, [show, finalAmount]);

  const loadPaymentMethods = async () => {
    try {
      setMethodsLoading(true);
      setError("");
      
      const response = await axios.get(
        `${API_URL}/api/payments/payment-methods?amount=${finalAmount}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setPaymentMethods(response.data.paymentMethods);
      } else {
        throw new Error(response.data.message || "Failed to load payment methods");
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
      setError("Failed to load payment methods. Please try again.");
    } finally {
      setMethodsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError("Please select a payment method");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Load Cashfree SDK first
      await loadCashfreeScript();

      console.log("💰 Creating payment order for course:", course._id);
      
      // Create payment order with selected method
      const orderResponse = await axios.post(
        `${API_URL}/api/payments/create-order`,
        {
          courseId: course._id,
          couponCode: couponData?.coupon?.code,
          finalAmount: finalAmount,
          paymentMethod: selectedMethod
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📦 Order creation response:", orderResponse.data);

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Failed to create payment order");
      }

      const { paymentSession, order } = orderResponse.data;

      console.log("🚀 Starting Cashfree checkout with session:", paymentSession);

      // Check if Cashfree is loaded
      if (!window.Cashfree) {
        throw new Error("Cashfree SDK not loaded properly");
      }

      // Initialize Cashfree checkout
      const cashfree = await window.Cashfree({
      mode: process.env.NODE_ENV === "development" ? "sandbox" : "production",
    });

    const checkoutOptions = {
      paymentSessionId: paymentSession,
      redirectTarget: "_self", // Opens in same tab
      returnUrl: `${window.location.origin}/payment-callback?order_id=${order.id}&course_id=${course._id}`,
    };

    console.log("🎯 Starting Cashfree Checkout:", checkoutOptions);

      // Open Cashfree checkout
      cashfree.checkout(checkoutOptions);

  } catch (error) {
    console.error("❌ Payment initiation error:", error);
    setError(error.response?.data?.message || error.message || "Payment failed to start");
    setLoading(false);
  }
};

  const loadCashfreeScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Cashfree) {
        console.log("✅ Cashfree SDK already loaded");
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => {
        console.log("✅ Cashfree SDK loaded successfully");
        resolve();
      };
      
      script.onerror = (error) => {
        console.error("❌ Failed to load Cashfree SDK:", error);
        reject(new Error("Failed to load payment system. Please check your internet connection."));
      };
      
      document.head.appendChild(script);
    });
  };

  const handleClose = () => {
    setSelectedMethod("");
    setError("");
    setLoading(false);
    onHide();
  };

  const renderPaymentMethodCard = (method) => {
    if (!method || !method.enabled) return null;

    return (
      <Col md={6} key={method.id}>
        <Card 
          className={`${styles.paymentMethodCard} ${
            selectedMethod === method.id ? styles.selected : ''
          }`}
          onClick={() => setSelectedMethod(method.id)}
        >
          <Card.Body>
            <div className={styles.methodHeader}>
              <i className={method.icon} style={{ color: method.color }}></i>
              <div>
                <h6>{method.name}</h6>
                <p className={styles.methodDescription}>{method.description}</p>
              </div>
            </div>
            
            {/* Method Specific Content */}
            {method.id === 'upi' && method.apps && (
              <div className={styles.upiApps}>
                {method.apps.slice(0, 4).map(app => (
                  <span key={app.id} className={styles.appBadge}>{app.name}</span>
                ))}
              </div>
            )}
            
            {method.id === 'card' && method.types && (
              <div className={styles.cardIcons}>
                {method.types.map(type => (
                  <i key={type.id} className={type.icon} title={type.name}></i>
                ))}
              </div>
            )}
            
            {method.id === 'netbanking' && method.banks && (
              <div className={styles.bankLogos}>
                {method.banks.slice(0, 3).join(', ')}...
              </div>
            )}
            
            {method.id === 'wallet' && method.apps && (
              <div className={styles.walletApps}>
                {method.apps.slice(0, 3).map(app => (
                  <span key={app.id} className={styles.appBadge}>{app.name}</span>
                ))}
              </div>
            )}
            
            {method.id === 'paylater' && method.apps && (
              <div className={styles.paylaterApps}>
                {method.apps.slice(0, 2).map(app => (
                  <span key={app.id} className={styles.appBadge}>{app.name}</span>
                ))}
              </div>
            )}
            
            {method.id === 'emi' && method.note && (
              <div className={styles.emiNote}>
                <small>{method.note}</small>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    );
  };

  if (!course) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Select Payment Method</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles.paymentModalContent}>
          {/* Course Summary */}
          <div className={styles.courseSummary}>
            <h6>{course.title}</h6>
            <div className={styles.amountSection}>
              <div className={styles.finalAmount}>
                Total Amount: <strong>₹{finalAmount.toFixed(2)}</strong>
              </div>
              {couponData && couponData.success && (
                <div className={styles.couponApplied}>
                  ✅ Coupon applied: {couponData.coupon.code} 
                  (Saved ₹{couponData.discountAmount.toFixed(2)})
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className={styles.paymentMethodsSection}>
            <h6>Choose Payment Method</h6>
            <p className={styles.sectionDescription}>Select your preferred payment method to continue</p>
            
            {methodsLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading payment methods...</p>
              </div>
            ) : error ? (
              <Alert variant="danger" className="mb-3">
                {error}
                <div className="mt-2">
                  <Button variant="outline-primary" size="sm" onClick={loadPaymentMethods}>
                    Retry
                  </Button>
                </div>
              </Alert>
            ) : paymentMethods ? (
              <Row className="g-3">
                {Object.values(paymentMethods).map(renderPaymentMethodCard)}
              </Row>
            ) : (
              <Alert variant="warning" className="mb-3">
                No payment methods available. Please try again later.
              </Alert>
            )}

            {!methodsLoading && paymentMethods && (
              <div className={styles.securityNote}>
                <i className="fas fa-lock me-2"></i>
                Your payment is secure and encrypted
              </div>
            )}
          </div>

          {error && !methodsLoading && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handlePayment}
          disabled={!selectedMethod || loading}
          className={styles.payButton}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Redirecting to Payment...
            </>
          ) : (
            `Pay ₹${finalAmount.toFixed(2)}`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentMethodsModal;