import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import styles from "./Legal.module.css";

const Privacy = () => {
  return (
    <div className={styles.legalPage}>
      <Container>
        <Row className="mb-3">
          <Col>
            <div className={styles.pageHeader}>
              <h1>Privacy Policy</h1>
              <p>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className={styles.legalCard}>
              <Card.Body>
                <div className={styles.legalContent}>
                  <section className={styles.section}>
                    <h2>1. Information We Collect</h2>
                    <p>
                      We collect information you provide when creating an
                      account, enrolling in trading courses, using our tools, or
                      contacting support.
                    </p>
                    <ul>
                      <li>
                        Personal identification information (Name, email, phone)
                      </li>
                      <li>Trading preferences and experience level</li>
                      <li>
                        Payment information (processed securely by payment
                        processors)
                      </li>
                      <li>Learning progress and course interactions</li>
                      <li>Platform usage data and feature preferences</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>2. How We Use Your Information</h2>
                    <p>
                      We use collected information to enhance your trading
                      education experience:
                    </p>
                    <ul>
                      <li>
                        Provide personalized trading course recommendations
                      </li>
                      <li>
                        Process transactions and manage your subscriptions
                      </li>
                      <li>Send market updates and educational content</li>
                      <li>Improve our trading tools and platform features</li>
                      <li>Provide customer support and technical assistance</li>
                      <li>Monitor platform performance and user engagement</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>3. Information Sharing & Disclosure</h2>
                    <p>
                      We do not sell, trade, or rent your personal
                      identification information to third parties. We may share
                      generic aggregated demographic information for analytics.
                    </p>
                    <ul>
                      <li>
                        Data may be shared with trusted educational partners
                      </li>
                      <li>Required by law enforcement or legal processes</li>
                      <li>Platform security and fraud prevention purposes</li>
                      <li>
                        Service providers who assist in platform operations
                      </li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>4. Data Security</h2>
                    <p>
                      We implement comprehensive security measures to protect
                      your personal and financial information against
                      unauthorized access or disclosure.
                    </p>
                    <ul>
                      <li>SSL encryption for all data transmissions</li>
                      <li>Secure payment processing systems</li>
                      <li>Regular security audits and updates</li>
                      <li>Restricted access to personal information</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>5. Your Data Rights</h2>
                    <p>You have full control over your personal data:</p>
                    <ul>
                      <li>Access and receive copy of your personal data</li>
                      <li>Update or correct inaccurate information</li>
                      <li>Request deletion of your personal data</li>
                      <li>Export your learning progress and data</li>
                      <li>Opt-out of marketing communications</li>
                      <li>Manage your communication preferences</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>6. Cookies & Tracking</h2>
                    <p>
                      We use cookies and similar technologies to enhance user
                      experience, analyze platform usage, and personalize
                      content.
                    </p>
                    <ul>
                      <li>Session management and user authentication</li>
                      <li>Platform performance monitoring</li>
                      <li>Personalized content recommendations</li>
                      <li>Learning progress tracking</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>7. Third-Party Services</h2>
                    <p>
                      Our platform may integrate with third-party services for
                      payments, analytics, and educational content delivery.
                    </p>
                    <ul>
                      <li>Payment processors (Razorpay, Stripe, PayPal)</li>
                      <li>Analytics services (Google Analytics)</li>
                      <li>Email marketing platforms</li>
                      <li>Cloud storage and hosting services</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>8. Data Retention</h2>
                    <p>
                      We retain your personal data only as long as necessary for
                      educational purposes, legal compliance, and platform
                      operations.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>9. Policy Updates</h2>
                    <p>
                      We may update this Privacy Policy to reflect changes in
                      our practices. Continued platform use after changes
                      constitutes acceptance.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>10. Contact Us</h2>
                    <p>
                      For privacy-related questions or data requests, contact us
                      at privacy@djittrading.com.
                    </p>
                  </section>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Privacy;
