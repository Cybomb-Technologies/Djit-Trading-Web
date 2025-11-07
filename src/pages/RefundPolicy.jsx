import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import styles from "./Legal.module.css";

const RefundPolicy = () => {
  return (
    <div className={styles.legalPage}>
      <Container>
        <Row className="mb-3">
          <Col>
            <div className={styles.pageHeader}>
              <h1>Refund Policy</h1>
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
                    <h2>1. Must Read Before Making a Purchase</h2>
                    <p>
                      This course is offered solely for educational purposes and
                      is intended for beginners who wish to learn about the Trading
                      and indicators we use. Participation in this course is voluntary
                      — you are not required or pressured to enroll.
                    </p>
                    <p>
                      By purchasing, you acknowledge and agree that <strong>no refunds will be granted once access is provided</strong>.
                      Trading involves inherent risk and may not be suitable for everyone.
                    </p>
                    <p>
                      Any examples, techniques, or strategies discussed are for demonstration purposes only and do not constitute financial
                      or investment advice. Always conduct your own research or consult a licensed professional before making trading decisions.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>2. No Tips or Calls Provided</h2>
                    <p>
                      <strong>IMPORTANT:</strong> We do not provide any kind of tips, calls, or trading suggestions to anyone.
                      Our courses are strictly for educational purposes only.
                    </p>
                    <p>
                      If you are purchasing this course with the expectation of receiving tips or signals,
                      kindly <strong>do not waste your money or time</strong>.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>3. No Profit Guarantee</h2>
                    <p>
                      These courses are designed to educate and share our trading strategies,
                      but we do not guarantee that purchasing this course will make you profitable.
                      Trading outcomes vary from person to person.
                    </p>
                    <p>
                      You will learn about our trading strategy and related concepts,
                      but <strong>profits or returns are not assured</strong>.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>4. Refund Policy Terms</h2>
                    <ul>
                      <li>No refunds will be issued after course access is granted.</li>
                      <li>All sales are final — please review the course details carefully before purchasing.</li>
                      <li>
                        Since this is digital content, once enrolled, your access cannot be revoked
                        and hence refunds cannot be processed.
                      </li>
                      <li>
                        By proceeding with the payment, you confirm that you have read and understood
                        the refund policy.
                      </li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>5. Disclaimer</h2>
                    <p>
                      DJIT TRADING is an educational platform only. We are not SEBI registered financial advisors
                      and do not provide investment recommendations.
                    </p>
                    <p>
                      Trading in financial markets involves risk of loss. Always invest at your own discretion
                      and responsibility.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>6. Thank You</h2>
                    <p>
                      Thank you for purchasing our course. We truly appreciate your trust and commitment
                      to learning. We aim to provide valuable knowledge and clarity in the world of trading.
                    </p>
                    <p>
                      If you have any questions regarding this Refund Policy, feel free to reach out to us at
                      <strong> support@djittrading.com</strong>.
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

export default RefundPolicy;
