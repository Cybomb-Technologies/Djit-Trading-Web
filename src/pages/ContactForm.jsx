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
import {
  Mail,
  Phone,
  MessageSquare,
  Send,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import styles from "./ContactForm.module.css";

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
    <div className={styles.contactPage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.decorationCircle + ' ' + styles.circle1}></div>
        <div className={styles.decorationCircle + ' ' + styles.circle2}></div>
        <Container className={styles.heroContent}>
          <span className={styles.pageTitle}>Get In Touch</span>
          <h1 className={styles.mainHeading}>We're Here to Help</h1>
          <p className={styles.subHeading}>
            Have questions about our courses, trading strategies, or just want to say hello?
            Our team is ready to assist you on your trading journey.
          </p>
        </Container>
      </section>

      {/* Main Content */}
      <Container className={styles.contentContainer}>
        <Card className={styles.contactCard}>
          <div className={styles.cardBody}>
            <div className={styles.contactGrid}>

              {/* Left Column: Contact Info */}
              <div className={styles.infoColumn}>
                <h3 className={styles.infoTitle}>Contact Information</h3>
                <p className={styles.infoDescription}>
                  Reach out to us through any of these channels. We typically respond within 1 hour during business hours.
                </p>

                <div className={styles.contactMethods}>

                  {/* Phone */}
                  <div className={styles.contactMethodItem}>
                    <div className={styles.methodIconWrapper}>
                      <Phone size={24} />
                    </div>
                    <div className={styles.methodContent}>
                      <h5>Phone Support</h5>
                      <p>Mon-Fri from 9am to 6pm</p>
                      <a href="tel:+919715092104" className={styles.methodLink}>+91 97150 92104</a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className={styles.contactMethodItem}>
                    <div className={styles.methodIconWrapper}>
                      <Mail size={24} />
                    </div>
                    <div className={styles.methodContent}>
                      <h5>Email Us</h5>
                      <p>We'll reply within 24 hours</p>
                      <a href="mailto:support@djittrading.com" className={styles.methodLink}>support@djittrading.com</a>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className={styles.contactMethodItem}>
                    <div className={styles.methodIconWrapper}>
                      <Clock size={24} />
                    </div>
                    <div className={styles.methodContent}>
                      <h5>Business Hours</h5>
                      <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p>Weekend Support: Limited Availability</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Form */}
              <div className={styles.formColumn}>
                <h3 className={styles.infoTitle}>Send us a Message</h3>

                {alert.show && (
                  <Alert variant={alert.type} className={styles.customAlert}>
                    <div className="d-flex align-items-center">
                      {alert.type === 'success' ? <CheckCircle size={20} className="me-2" /> : <AlertCircle size={20} className="me-2" />}
                      {alert.message}
                    </div>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className={styles.formLabel}>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className={`${styles.formControl} ${errors.name ? "is-invalid" : ""}`}
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className={styles.formLabel}>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. john@example.com"
                      className={`${styles.formControl} ${errors.email ? "is-invalid" : ""}`}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className={styles.formLabel}>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +91 98765 43210"
                      className={`${styles.formControl} ${errors.phone ? "is-invalid" : ""}`}
                    />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className={styles.formLabel}>Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      className={`${styles.formControl} ${errors.message ? "is-invalid" : ""}`}
                    />
                    {errors.message && <div className="invalid-feedback">{errors.message}</div>}
                  </Form.Group>

                  <Button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Message
                      </>
                    )}
                  </Button>
                </Form>
              </div>

            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default ContactForm;
