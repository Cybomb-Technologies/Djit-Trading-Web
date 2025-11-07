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
  const [couponLoading, setCouponLoading] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ Coupon validation
  const validateCoupon = async () => {
    if (!couponCode.trim() || !course) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const totalAmount = parseFloat(course.discountedPrice || course.price);
      const response = await axios.post(
        `${API_URL}/api/coupons/apply`,
        {
          code: couponCode.trim().toUpperCase(),
          totalAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setValidatedCoupon(response.data);
        showAlert("Coupon applied successfully!", "success");
      } else {
        throw new Error(response.data.message || "Invalid coupon");
      }
    } catch (error) {
      setValidatedCoupon(null);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Invalid or expired coupon";
      setCouponError(msg);
      showAlert(msg, "danger");
    } finally {
      setCouponLoading(false);
    }
  };

  // ✅ Enrollment with Cashfree Redirect Flow
  const handleEnrollConfirm = async () => {
    if (!course) return;
    setEnrolling(true);

    try {
      const finalPrice = calculateFinalPrice();
      const appliedCouponCode =
        validatedCoupon?.coupon?.code ||
        (couponCode.trim() ? couponCode.trim().toUpperCase() : undefined);

      // ✅ Free Course Enrollment
      if (isCourseFree(course) || finalPrice === 0) {
        await axios.post(
          "/api/enrollments",
          {
            courseId: course._id,
            couponCode: appliedCouponCode,
            finalAmount: finalPrice,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        showAlert("Enrolled successfully! Redirecting...", "success");
        onEnrollSuccess();
        setTimeout(() => navigate(`/learning/${course._id}`), 1500);
        return;
      }

      // ✅ Paid Enrollment using Cashfree Redirect
      const response = await axios.post(`${API_URL}/api/payment/create`, {
        name: user?.name || "Guest User",
        email: user?.email || "guest@example.com",
        phone: user?.phone || "9999999999",
        amount: finalPrice,
        courseId: course._id,
        couponCode: appliedCouponCode,
      });

      // ✅ Cashfree Payment Link from backend
      const { paymentLink } = response.data;

      if (paymentLink) {
        window.location.href = paymentLink; // redirect to Cashfree official page
      } else {
        showAlert("Unable to start payment. Try again.", "danger");
      }
    } catch (error) {
      console.error("Payment Error:", error);
      showAlert(
        error.response?.data?.message ||
          "Something went wrong during payment.",
        "danger"
      );
    } finally {
      setEnrolling(false);
    }
  };

  // ✅ Helpers
  const isCourseFree = (course) => {
    if (!course) return false;
    return course.price === 0 || course.discountedPrice === 0;
  };

  const calculateFinalPrice = () => {
    if (!course) return 0;
    let price = parseFloat(course.discountedPrice || course.price);
    if (validatedCoupon && validatedCoupon.success) {
      price = parseFloat(validatedCoupon.finalAmount);
    }
    return Math.max(0, price);
  };

  const handleModalClose = () => {
    setCouponCode("");
    setValidatedCoupon(null);
    setCouponError("");
    onHide();
  };

  const handleCouponCodeChange = (e) => {
    setCouponCode(e.target.value);
    if (validatedCoupon || couponError) {
      setValidatedCoupon(null);
      setCouponError("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && couponCode.trim() && !couponLoading) {
      validateCoupon();
    }
  };

  if (!course) return null;
  const finalPrice = calculateFinalPrice();

  return (
    <Modal show={show} onHide={handleModalClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Enroll in Course</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles.enrollModalContent}>
          <div className={styles.courseInfo}>
            <h5>{course.title}</h5>
            <p className="text-muted">by {course.instructor}</p>
          </div>

          <div className={styles.pricingSection}>
            <div className={styles.originalPriceLine}>
              <span>Course Price:</span>
              <span>
                ₹{(course.discountedPrice || course.price).toFixed(2)}
              </span>
            </div>

            {validatedCoupon && validatedCoupon.success && (
              <div className={styles.couponDiscount}>
                <span>Coupon Discount:</span>
                <span className={styles.discountText}>
                  -₹{validatedCoupon.discountAmount.toFixed(2)}
                  {validatedCoupon.coupon.discountType === "percentage" &&
                    ` (${validatedCoupon.coupon.discountValue}%)`}
                </span>
              </div>
            )}

            <hr />
            <div className={styles.finalPrice}>
              <strong>Final Price:</strong>
              <strong>
                {finalPrice === 0 ? (
                  <span className={styles.freePrice}>FREE</span>
                ) : (
                  `₹${finalPrice.toFixed(2)}`
                )}
              </strong>
            </div>
          </div>

          {!isCourseFree(course) && (
            <div className={styles.couponSection}>
              <Form.Group>
                <Form.Label>Have a coupon code?</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={handleCouponCodeChange}
                    onKeyPress={handleKeyPress}
                    disabled={couponLoading}
                    isInvalid={!!couponError}
                  />
                  <Button
                    variant="outline-primary"
                    onClick={validateCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                  >
                    {couponLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                  <Form.Control.Feedback type="invalid">
                    {couponError}
                  </Form.Control.Feedback>
                </InputGroup>

                {validatedCoupon && validatedCoupon.success && (
                  <Form.Text className="text-success">
                    ✅ Coupon applied successfully! You saved ₹
                    {validatedCoupon.discountAmount.toFixed(2)}
                  </Form.Text>
                )}
              </Form.Group>
            </div>
          )}

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
          variant={finalPrice === 0 ? "success" : "primary"}
          onClick={handleEnrollConfirm}
          disabled={enrolling || !course}
          className={styles.confirmEnrollBtn}
        >
          {enrolling ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : finalPrice === 0 ? (
            "Enroll for Free"
          ) : (
            `Pay ₹${finalPrice.toFixed(2)}`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EnrollModal;
