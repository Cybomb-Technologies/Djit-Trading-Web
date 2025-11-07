import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ForgotPassword.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle email submission
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: formData.email
      });

      if (response.data.success) {
        setAlert({
          show: true,
          message: "Reset code sent to your email!",
          type: "success"
        });
        setStep(2);
        startCountdown();
      }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Error sending reset code",
        type: "danger"
      });
    }
    setLoading(false);
  };

  // Handle code verification
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-reset-code`, {
        email: formData.email,
        code: formData.code
      });

      if (response.data.success) {
        setAlert({
          show: true,
          message: "Code verified successfully!",
          type: "success"
        });
        setStep(3);
      }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Invalid or expired code",
        type: "danger"
      });
    }
    setLoading(false);
  };

  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    if (formData.newPassword !== formData.confirmPassword) {
      setAlert({
        show: true,
        message: "Passwords do not match",
        type: "danger"
      });
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setAlert({
        show: true,
        message: "Password must be at least 6 characters long",
        type: "danger"
      });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setAlert({
          show: true,
          message: "Password reset successfully! Redirecting to login...",
          type: "success"
        });
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Error resetting password",
        type: "danger"
      });
    }
    setLoading(false);
  };

  // Resend code functionality
  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: formData.email
      });

      if (response.data.success) {
        setAlert({
          show: true,
          message: "New code sent to your email!",
          type: "success"
        });
        startCountdown();
      }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Error sending code",
        type: "danger"
      });
    }
    setLoading(false);
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="forgot-password-page">
      {/* Background with trading theme */}
      <div className="forgot-password-background">
        <div className="forgot-password-overlay"></div>
        <div className="floating-element forgot-password-float-1"></div>
        <div className="floating-element forgot-password-float-2"></div>
        <div className="floating-element forgot-password-float-3"></div>
      </div>

      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={5} md={7} sm={9}>
            <Card className="forgot-password-card">
              <Card.Body className="forgot-password-card-body">
                {/* Header Section */}
                <div className="forgot-password-header">
                  <div className="forgot-password-brand">
                    <h1 className="forgot-password-brand-title">
                      DJIT <span className="gradient-text">TRADING</span>
                    </h1>
                    <p className="forgot-password-brand-subtitle">
                      Reset Your Password
                    </p>
                  </div>

                  <div className="forgot-password-welcome">
                    <h2 className="forgot-password-title">
                      {step === 1 && "Forgot Password?"}
                      {step === 2 && "Enter Reset Code"}
                      {step === 3 && "Create New Password"}
                    </h2>
                    <p className="forgot-password-subtitle">
                      {step === 1 && "Enter your email to receive a reset code"}
                      {step === 2 && "Check your email for the 6-digit code"}
                      {step === 3 && "Enter your new password"}
                    </p>
                  </div>
                </div>

                {alert.show && (
                  <Alert variant={alert.type} className="forgot-password-alert">
                    {alert.message}
                  </Alert>
                )}

                <div className="forgot-password-form-container">
                  {/* Step 1: Email Input */}
                  {step === 1 && (
                    <Form onSubmit={handleSendCode} className="forgot-password-form">
                      <Form.Group className="mb-4">
                        <Form.Label className="form-label">
                          Email Address
                        </Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your registered email"
                          required
                          className="forgot-password-form-control"
                        />
                      </Form.Group>

                      <Button
                        type="submit"
                        variant="primary"
                        className="forgot-password-submit-button"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                            Sending Code...
                          </>
                        ) : (
                          "Send Reset Code"
                        )}
                      </Button>
                    </Form>
                  )}

                  {/* Step 2: Code Verification */}
                  {step === 2 && (
                    <Form onSubmit={handleVerifyCode} className="forgot-password-form">
                      <Form.Group className="mb-4">
                        <Form.Label className="form-label">
                          6-Digit Reset Code
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleChange}
                          placeholder="Enter 6-digit code"
                          required
                          maxLength="6"
                          pattern="[0-9]{6}"
                          className="forgot-password-form-control code-input"
                        />
                        <Form.Text className="text-muted">
                          Enter the 6-digit code sent to {formData.email}
                        </Form.Text>
                      </Form.Group>

                      <div className="resend-code-section mb-4">
                        <Button
                          variant="outline-secondary"
                          onClick={handleResendCode}
                          disabled={loading || countdown > 0}
                          className="resend-code-button"
                        >
                          {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                        </Button>
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        className="forgot-password-submit-button"
                        disabled={loading || formData.code.length !== 6}
                      >
                        {loading ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                            Verifying...
                          </>
                        ) : (
                          "Verify Code"
                        )}
                      </Button>
                    </Form>
                  )}

                  {/* Step 3: New Password */}
                  {step === 3 && (
                    <Form onSubmit={handleResetPassword} className="forgot-password-form">
                      <Form.Group className="mb-4">
                        <Form.Label className="form-label">
                          New Password
                        </Form.Label>
                        <Form.Control
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          placeholder="Enter new password"
                          required
                          minLength="6"
                          className="forgot-password-form-control"
                        />
                        <Form.Text className="text-muted">
                          Password must be at least 6 characters long
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="form-label">
                          Confirm New Password
                        </Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm new password"
                          required
                          minLength="6"
                          className="forgot-password-form-control"
                        />
                      </Form.Group>

                      <Button
                        type="submit"
                        variant="primary"
                        className="forgot-password-submit-button"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                            Resetting...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </Button>
                    </Form>
                  )}
                </div>

                <div className="forgot-password-footer">
                  <p className="footer-text">
                    Remember your password?{" "}
                    <Link to="/login" className="footer-link">
                      Back to Login
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ForgotPassword;