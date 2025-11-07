import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import styles from "./Legal.module.css";

const Terms = () => {
  return (
    <div className={styles.legalPage}>
      <Container>
        <Row className="mb-3">
          <Col>
            <div className={styles.pageHeader}>
              <h1>Terms & Conditions</h1>
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
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                      By accessing and using DJIT TRADING ("the Platform"), you
                      accept and agree to be bound by the terms and provision of
                      this agreement.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>2. Trading Platform License</h2>
                    <p>
                      Permission is granted to temporarily access the trading
                      tools, courses, and materials on DJIT TRADING for
                      personal, educational purposes only.
                    </p>
                    <ul>
                      <li>
                        You may not modify, copy, or redistribute trading
                        strategies
                      </li>
                      <li>
                        You may not use platform materials for commercial
                        teaching purposes
                      </li>
                      <li>
                        You may not remove any copyright or proprietary
                        notations
                      </li>
                      <li>
                        You may not transfer your account access to another
                        person
                      </li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>3. Course Enrollment and Access</h2>
                    <p>
                      When you enroll in a trading course on DJIT TRADING, you
                      get a license from us to view the course via the Platform
                      for personal educational use.
                    </p>
                    <ul>
                      <li>Trading courses are licensed, not sold, to you</li>
                      <li>
                        We reserve the right to revoke access for policy
                        violations
                      </li>
                      <li>
                        Lifetime access applies to course content, not platform
                        features
                      </li>
                      <li>You may not record or distribute course materials</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>4. Payment and Refund Policy</h2>
                    <p>
                      When you make a payment, you agree to use a valid payment
                      method. We offer a 7-day refund policy for course
                      purchases if no more than 30% content is consumed.
                    </p>
                    <ul>
                      <li>
                        All payments are processed through secure payment
                        gateways
                      </li>
                      <li>
                        Subscription fees are automatically renewed unless
                        cancelled
                      </li>
                      <li>
                        Refund requests must be submitted through proper
                        channels
                      </li>
                      <li>
                        No refunds for downloaded materials or completed courses
                      </li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>5. Trading Risk Disclaimer</h2>
                    <p>
                      Trading in financial markets involves substantial risk of
                      loss. DJIT TRADING provides educational content only, not
                      financial advice.
                    </p>
                    <ul>
                      <li>
                        Past performance does not guarantee future results
                      </li>
                      <li>
                        You are solely responsible for your trading decisions
                      </li>
                      <li>We are not registered financial advisors</li>
                      <li>Trading may not be suitable for all investors</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>6. User Conduct and Community Guidelines</h2>
                    <p>
                      Users may post reviews, comments, and interact in
                      community forums as long as content is respectful and
                      follows community guidelines.
                    </p>
                    <ul>
                      <li>No sharing of illegal or harmful content</li>
                      <li>Respect other community members and instructors</li>
                      <li>
                        No spamming or promotional content without permission
                      </li>
                      <li>
                        Maintain professional and constructive discussions
                      </li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>7. Intellectual Property</h2>
                    <p>
                      All trading strategies, course content, platform design,
                      and proprietary tools are intellectual property of DJIT
                      TRADING.
                    </p>
                    <ul>
                      <li>Content is for personal educational use only</li>
                      <li>Unauthorized distribution is strictly prohibited</li>
                      <li>Trading indicators and tools are proprietary</li>
                      <li>Course materials may not be recorded or shared</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>8. Account Termination</h2>
                    <p>
                      We reserve the right to terminate accounts for violations
                      of terms, fraudulent activity, or misuse of platform
                      features.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>9. Limitation of Liability</h2>
                    <p>
                      In no event shall DJIT TRADING be liable for any trading
                      losses, investment decisions, or damages arising from
                      platform use.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>10. Contact Information</h2>
                    <p>
                      If you have any questions about these Terms, please
                      contact us at legal@djittrading.com.
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

export default Terms;
