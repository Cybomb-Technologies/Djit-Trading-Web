import React, { useState } from "react";
import { Modal, Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import styles from "./Courses.module.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const EnrollModal = ({ show, onHide, course, onEnrollSuccess, showAlert }) => {
  const [enrolling, setEnrolling] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [validatedCoupon, setValidatedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [finalPrice, setFinalPrice] = useState(
    course?.discountedPrice || course?.price || 0
  );

  const { user } = useAuth();
  const navigate = useNavigate();

  // Reset state when course changes
  React.useEffect(() => {
    if (course) {
      setFinalPrice(course.discountedPrice || course.price || 0);
      setCouponCode("");
      setValidatedCoupon(null);
      setCouponError("");
    }
  }, [course]);

  // ✅ Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    try {
      setCouponError("");
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/api/coupons/validate`, {
        code: couponCode.trim(),
        courseId: course._id,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.valid) {
        const discount = res.data.discountAmount || 0;
        const basePrice = course.discountedPrice || course.price;
        const newPrice = Math.max(0, basePrice - discount);

        setValidatedCoupon({
          code: couponCode.trim(),
          discountAmount: discount
        });
        setFinalPrice(newPrice);
        showAlert(`Coupon applied! You saved ₹${discount}.`, "success");
      } else {
        setCouponError(res.data.message || "Invalid coupon.");
        setValidatedCoupon(null);
        setFinalPrice(course.discountedPrice || course.price);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Coupon validation failed.";
      setCouponError(errorMsg);
      setValidatedCoupon(null);
      setFinalPrice(course.discountedPrice || course.price);
    }
  };

  // ✅ Remove Coupon
  const handleRemoveCoupon = () => {
    setCouponCode("");
    setValidatedCoupon(null);
    setCouponError("");
    setFinalPrice(course.discountedPrice || course.price);
  };

  // ✅ Payment handler
  const handleEnrollConfirm = async () => {
    if (!course) {
      showAlert("Course information missing", "danger");
      return;
    }

    // If course is free, enroll directly without payment
    if (finalPrice === 0) {
      await handleFreeEnrollment();
      return;
    }

    setEnrolling(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/payment/create`,
        {
          name: user?.name || "User",
          email: user?.email,
          phone: user?.phone || "9876543210",
          amount: finalPrice,
          courseId: course._id,
          userId: user?._id || user?.id,
          couponCode: validatedCoupon ? validatedCoupon.code : null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { paymentLink, orderId } = response.data;
      if (!paymentLink) throw new Error("No payment link received");

      onHide();
      showAlert("Redirecting to payment gateway...", "info");
      window.open(paymentLink, "_blank");

      startPaymentPolling(orderId, course._id);
    } catch (error) {
      console.error("❌ Enrollment Error:", error);
      const errorMsg = error.response?.data?.message || error.message;
      showAlert(errorMsg, "danger");
      setEnrolling(false);
    }
  };

  // ✅ Free enrollment handler
  const handleFreeEnrollment = async () => {
    setEnrolling(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/enrollments`,
        {
          courseId: course._id,
          userId: user?._id || user?.id,
          price: 0,
          couponCode: validatedCoupon ? validatedCoupon.code : null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showAlert("Successfully enrolled in the course!", "success");
        onEnrollSuccess();
        navigate(`/learning/${course._id}`);
      }
    } catch (error) {
      console.error("❌ Free Enrollment Error:", error);
      const errorMsg = error.response?.data?.message || "Enrollment failed";
      showAlert(errorMsg, "danger");
    } finally {
      setEnrolling(false);
    }
  };

  // ✅ Payment status polling
  const startPaymentPolling = (orderId, courseId) => {
    let pollCount = 0;
    const maxPolls = 60;
    const interval = setInterval(async () => {
      pollCount++;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          `${API_URL}/api/payment/verify`,
          { 
            orderId, 
            courseId, 
            userId: user?._id || user?.id 
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          clearInterval(interval);
          showAlert("Payment successful! Enrollment completed.", "success");
          onEnrollSuccess();
          navigate(`/learning/${courseId}`);
        }
      } catch {
        console.log("Payment not confirmed yet...");
      }

      if (pollCount >= maxPolls) {
        clearInterval(interval);
        showAlert(
          "Payment status check timeout. Check your email for confirmation.",
          "info"
        );
        setEnrolling(false);
      }
    }, 5000);
  };

  // ✅ Modal close handler
  const handleModalClose = () => {
    if (!enrolling) {
      setCouponCode("");
      setValidatedCoupon(null);
      setCouponError("");
      setFinalPrice(course.discountedPrice || course.price);
      onHide();
    }
  };

  if (!course) return null;

  const isFreeCourse = (course.discountedPrice || course.price) === 0;
  const showCouponSection = !isFreeCourse;

  return (
    <Modal show={show} onHide={handleModalClose} centered backdrop="static">
      <Modal.Header closeButton={!enrolling}>
        <Modal.Title>Enroll in Course</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className={styles.enrollModalContent}>
          {/* ✅ Course Info */}
          <div className={styles.courseInfo}>
            <h5>{course.title}</h5>
            <p className="text-muted">by {course.instructor}</p>
          </div>

          {/* ✅ Pricing Section */}
          <div className={styles.pricingSection}>
            <div className={styles.originalPriceLine}>
              <span>Course Price:</span>
              <div>
                {course.discountedPrice ? (
                  <>
                    <span className={styles.originalPrice}>₹{course.price}</span>
                    <span className={styles.currentPrice}>₹{course.discountedPrice}</span>
                  </>
                ) : (
                  <span className={styles.currentPrice}>₹{course.price}</span>
                )}
              </div>
            </div>

            {/* Coupon Discount Display */}
            {validatedCoupon && (
              <div className={styles.couponDiscountLine}>
                <span>Coupon Discount:</span>
                <span className={styles.discountText}>-₹{validatedCoupon.discountAmount}</span>
              </div>
            )}

            <hr />
            <div className={styles.finalPrice}>
              <strong>Final Price:</strong>
              <strong className={finalPrice === 0 ? styles.freePrice : ""}>
                {finalPrice === 0 ? 'FREE' : `₹${finalPrice}`}
              </strong>
            </div>
          </div>

          {/* ✅ Coupon Section - Only show for paid courses */}
          {showCouponSection && (
            <div className={styles.couponSection}>
              <Form.Group>
                <Form.Label>Have a coupon code?</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={enrolling || validatedCoupon}
                  />
                  {validatedCoupon ? (
                    <Button
                      variant="outline-danger"
                      onClick={handleRemoveCoupon}
                      disabled={enrolling}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      variant="outline-secondary"
                      onClick={handleApplyCoupon}
                      disabled={enrolling}
                    >
                      Apply
                    </Button>
                  )}
                </InputGroup>
                {couponError && (
                  <Form.Text className="text-danger">{couponError}</Form.Text>
                )}
                {validatedCoupon && (
                  <Form.Text className="text-success">
                    Coupon applied successfully! Saved ₹{validatedCoupon.discountAmount}
                  </Form.Text>
                )}
              </Form.Group>
            </div>
          )}

          {/* ✅ Benefits Section */}
          <div className={styles.enrollBenefits}>
            <h6>What you'll get:</h6>
            <ul>
              <li>Lifetime access to course content</li>
              <li>Certificate of completion</li>
              <li>Q&A support</li>
              <li>Downloadable resources</li>
              <li>Mobile and TV access</li>
            </ul>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleModalClose}
          disabled={enrolling}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleEnrollConfirm}
          disabled={enrolling}
          className={styles.confirmEnrollBtn}
        >
          {enrolling ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : finalPrice === 0 ? (
            'Enroll for FREE'
          ) : (
            `Pay ₹${finalPrice}`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EnrollModal;