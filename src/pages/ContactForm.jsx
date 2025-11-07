import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import "./ContactForm.css";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    // Simulate form submission
    try {
      // Here you would typically send the data to your backend
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setAlert({
        show: true,
        message: "Thank you for your message! We'll get back to you soon.",
        type: "success",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      setAlert({
        show: true,
        message: "Something went wrong. Please try again later.",
        type: "danger",
      });
    }

    setLoading(false);
  };

  return (
    <div className="contact-page">
      {/* Background with trading theme */}
      <div className="contact-background">
        <div className="contact-overlay"></div>
        <div className="floating-element contact-float-1"></div>
        <div className="floating-element contact-float-2"></div>
        <div className="floating-element contact-float-3"></div>
      </div>

      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={6} md={8} sm={10}>
            {/* Trusted Badge */}
            <div className="contact-trusted-badge">
              <span className="trusted-text">
                <span className="check-icon">✓</span>
                Get Expert Trading Advice
              </span>
            </div>

            <Card className="contact-card">
              <Card.Body className="contact-card-body">
                {/* Header Section */}
                <div className="contact-header">
                  <div className="contact-brand">
                    <h1 className="contact-brand-title">
                      DJIT <span className="gradient-text">TRADING</span>
                    </h1>
                    <p className="contact-brand-subtitle">
                      Contact Our Trading Experts
                    </p>
                  </div>

                  <div className="contact-welcome">
                    <h2 className="contact-title">Get In Touch</h2>
                    <p className="contact-subtitle">
                      Have questions about our trading courses? We're here to
                      help!
                    </p>
                  </div>
                </div>

                {alert.show && (
                  <Alert variant={alert.type} className="contact-alert">
                    {alert.message}
                  </Alert>
                )}

                <div className="contact-form-container">
                  <Form onSubmit={handleSubmit} className="contact-form">
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">
                        Full Name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className={`contact-form-control ${
                          errors.name ? "is-invalid" : ""
                        }`}
                      />
                      {errors.name && (
                        <div className="invalid-feedback">{errors.name}</div>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">
                        Email Address *
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className={`contact-form-control ${
                          errors.email ? "is-invalid" : ""
                        }`}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">
                        Phone Number *
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        className={`contact-form-control ${
                          errors.phone ? "is-invalid" : ""
                        }`}
                      />
                      {errors.phone && (
                        <div className="invalid-feedback">{errors.phone}</div>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">
                        Your Message *
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your trading goals or questions about our courses..."
                        className={`contact-form-control ${
                          errors.message ? "is-invalid" : ""
                        }`}
                      />
                      {errors.message && (
                        <div className="invalid-feedback">{errors.message}</div>
                      )}
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      className="contact-submit-button"
                      disabled={loading}
                    >
                      <span className="btn-icon">📧</span>
                      {loading ? "Sending Message..." : "Send Message"}
                    </Button>
                  </Form>
                </div>

                {/* Quick Stats */}
                <div className="contact-stats">
                  <div className="contact-stat">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-content">
                      <strong>24/7</strong>
                      <span>Support Available</span>
                    </div>
                  </div>
                  <div className="contact-stat">
                    <div className="stat-icon">💬</div>
                    <div className="stat-content">
                      <strong>1 Hour</strong>
                      <span>Average Response Time</span>
                    </div>
                  </div>
                </div>

                <div className="contact-footer">
                  <p className="footer-text">
                    Prefer to call?{" "}
                    <a href="tel:+91 9715092104" className="footer-link">
                      +91 9715092104
                    </a>
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

export default ContactForm;
