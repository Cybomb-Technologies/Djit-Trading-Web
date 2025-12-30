import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Facebook,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  Youtube,
} from "lucide-react";
import styles from "./Footer.module.css";
import logo from "../assets/logo-w.png";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Footer = () => {
  const [email, setEmail] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/newsletter`, { email });
      setAlert({
        show: true,
        message: "Successfully subscribed!",
        type: "success",
      });
      setEmail("");
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Subscription failed",
        type: "danger",
      });
    }
  };

  return (
    <footer className={styles.footer}>
      <Container>
        <Row>
          {/* Brand Column */}
          <Col lg={4} md={6} className="mb-5 mb-lg-0">
            <img src={logo} alt="TradeMaster Logo" className={styles.brandLogo} />
            <p className={styles.footerText}>
              Master the markets with our comprehensive trading courses. Learn
              from industry experts and take your trading skills to the next
              level.
            </p>
            <div className={styles.socialLinks}>
              <a href="https://www.facebook.com/djittrading" aria-label="Facebook" target="_blank" rel="noreferrer">
                <Facebook size={18} />
              </a>
              <a href="https://x.com/investorDeva" aria-label="X" target="_blank" rel="noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/djittrading/about/" aria-label="LinkedIn" target="_blank" rel="noreferrer">
                <Linkedin size={18} />
              </a>
              <a href="https://www.instagram.com/investor_deva/" aria-label="Instagram" target="_blank" rel="noreferrer">
                <Instagram size={18} />
              </a>
              <a href="https://www.youtube.com/@djittradingofficial" aria-label="YouTube" target="_blank" rel="noreferrer">
                <Youtube size={18} />
              </a>
            </div>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <Mail size={16} className={styles.contactIcon} />
                <a href="mailto:support@djittrading.com" className={styles.contactLink}>
                  support@djittrading.com
                </a>
              </div>
              <div className={styles.contactItem}>
                <Phone size={16} className={styles.contactIcon} />
                <a href="tel:+919715092104" className={styles.contactLink}>
                  +91 9715092104
                </a>
              </div>
            </div>
          </Col>

          {/* Quick Links */}
          <Col lg={3} md={6} className="mb-4 mb-lg-0">
            <h6 className={styles.footerSubtitle}>Quick Links</h6>
            <ul className={styles.footerLinks}>
              <li><Link to="/courses">All Courses</Link></li>
              <li><Link to="/tools">Tools</Link></li>
              <li><Link to="/traders">Traders Profile</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </Col>

          {/* Newsletter */}
          <Col lg={5} md={6}>
            <h6 className={styles.footerSubtitle}>Stay Updated</h6>
            <p className={styles.footerText}>
              Subscribe to get updates on new courses, market insights, and trading signals.
            </p>
            <Form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.newsletterInput}
                />
              </Form.Group>
              <Button type="submit" className={styles.subscribeBtn}>
                Subscribe Now
              </Button>
            </Form>
            {alert.show && (
              <Alert
                variant={alert.type}
                className="mt-3 py-2 small"
                onClose={() => setAlert({ show: false, message: "", type: "" })}
                dismissible
              >
                {alert.message}
              </Alert>
            )}
          </Col>
        </Row>

        <hr className={styles.divider} />

        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
            <p className={styles.copyright}>
              © {new Date().getFullYear()} Djit Trading. All rights reserved.
            </p>
          </Col>
          <Col md={6}>
            <div className={styles.legalLinks}>
              <Link to="/refund-policy">Refund Policy</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms & Conditions</Link>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
