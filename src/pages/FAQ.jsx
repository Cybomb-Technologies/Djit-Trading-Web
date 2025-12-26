import React, { useState } from "react";
import { Container, Row, Col, Card, Accordion, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import styles from "./FAQ.module.css";

const FAQ = () => {
  const [activeKey, setActiveKey] = useState("0");

  const faqCategories = [
    {
      title: "Getting Started",
      icon: "fa-rocket",
      questions: [
        {
          question: "What is DJIT Trading?",
          answer: "DJIT Trading is a comprehensive trading education platform designed specifically for Indian traders. We provide expert-led courses in Tamil and English, advanced trading tools, and a supportive community to help traders master financial markets with confidence.",
        },
        {
          question: "Do I need any prior trading experience?",
          answer: "Absolutely not! DJIT Trading welcomes traders of all experience levels. Our structured curriculum begins with foundational concepts and gradually progresses to advanced strategies.",
        },
        {
          question: "Is DJIT Trading suitable for complete beginners?",
          answer: "Yes! Our 'Zero to Hero' program is specifically designed for complete beginners. We start with understanding what stocks are, how markets work, and gradually build up to sophisticated trading strategies.",
        },
      ],
    },
    {
      title: "Courses & Learning",
      icon: "fa-book-open",
      questions: [
        {
          question: "What courses does DJIT Trading offer?",
          answer: "We offer comprehensive courses in Intraday Trading, Options Trading, Technical Analysis, Risk Management, Swing Trading, and Futures Trading. All courses are available in Tamil with English subtitles.",
        },
        {
          question: "Are the courses suitable for beginners?",
          answer: "Yes! We have courses for all levels - from complete beginners to advanced traders. Each course is clearly marked with its difficulty level.",
        },
        {
          question: "How long do I have access to the course material?",
          answer: "Once you enroll in a course, you get lifetime access to all course materials, including future updates. You can learn at your own pace and revisit the content anytime.",
        },
      ],
    },
    {
      title: "Payments & Pricing",
      icon: "fa-credit-card",
      questions: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major payment methods: Credit/Debit cards, Net Banking, UPI, PayPal, and popular digital wallets. All transactions are secured.",
        },
        {
          question: "Do you offer refunds?",
          answer: "Yes, we offer a 7-day money-back guarantee. If you're not satisfied with the course within 7 days of purchase, you can request a full refund - no questions asked.",
        },
        {
          question: "Are there any hidden costs?",
          answer: "No hidden costs! The course price you see is the final price. There are no additional fees for course materials, certificates, or community access.",
        },
      ],
    },
    {
      title: "Community & Support",
      icon: "fa-users",
      questions: [
        {
          question: "What community features do you offer?",
          answer: "DJIT Trading includes access to our exclusive trader community with daily market discussions, expert Q&A sessions, peer learning groups, and mentorship programs.",
        },
        {
          question: "How do I get help during my learning journey?",
          answer: "We provide multiple support channels: 24/5 dedicated support team, course-specific discussion forums, weekly live Q&A sessions, and chat support.",
        },
      ],
    },
  ];

  return (
    <div className={styles.faqPage}>
      {/* Hero Section */}
      <section className={styles.faqHero}>
        <Container>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Frequently Asked <span className={styles.gradientText}>Questions</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Get Answers to All Your Trading Questions
            </p>
            <p className={styles.description}>
              Find comprehensive answers to common questions about our
              courses, platform features, payment options, and trading
              community. Can't find what you're looking for? Our support
              team is here to help!
            </p>
            <div className={styles.heroButtons}>
              <Link to="/courses" className={styles.primaryBtn}>
                Explore Courses
              </Link>
              <a href="#contact" className={styles.secondaryBtn}>
                Contact Support
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Categories Section */}
      <section className={styles.categoriesSection}>
        <Container>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Browse by Category</h2>
            <p className={styles.sectionSubtitle}>
              Find answers organized by topics that matter to you
            </p>
          </div>
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className={styles.categoryList}>
                {faqCategories.map((category, index) => (
                  <div
                    key={index}
                    className={styles.categoryItem}
                    onClick={() =>
                      document
                        .getElementById(category.title.replace(/\s+/g, "-"))
                        .scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    <div className={styles.categoryContent}>
                      <div className={styles.categoryIcon}>
                        <i className={`fa-solid ${category.icon}`}></i>
                      </div>
                      <div>
                        <h4 className={styles.categoryTitle}>{category.title}</h4>
                        <p className={styles.categoryCount}>
                          {category.questions.length} Questions
                        </p>
                      </div>
                    </div>
                    <div className={styles.categoryArrow}>
                      <i className="fa-solid fa-chevron-right"></i>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Content Section */}
      <section className={styles.faqContentSection}>
        <Container>
          {faqCategories.map((category, catIndex) => (
            <div
              key={catIndex}
              id={category.title.replace(/\s+/g, "-")}
              className={styles.categorySection}
            >
              <div className={styles.categoryHeader}>
                <div className={styles.categoryIcon}>
                  <i className={`fa-solid ${category.icon}`}></i>
                </div>
                <div className={styles.categoryTitleContent}>
                  <h3>{category.title}</h3>
                  <p className={styles.categorySubtitle}>
                    {category.questions.length} questions
                  </p>
                </div>
              </div>
              <Row className="justify-content-center">
                <Col lg={12}>
                  <Accordion activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
                    {category.questions.map((faq, index) => (
                      <Accordion.Item
                        key={index}
                        eventKey={`${catIndex}-${index}`}
                        className={styles.accordionItem}
                      >
                        <Accordion.Header className={styles.accordionHeader}>
                          <div className={styles.questionContent}>
                            <span className={styles.questionNumber}>Q</span>
                            <span>{faq.question}</span>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body className={styles.accordionBody}>
                          {faq.answer}
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Col>
              </Row>
            </div>
          ))}
        </Container>
      </section>

      {/* Contact Section */}
      <section id="contact" className={styles.contactSection}>
        <Container>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Still Have Questions?</h2>
            <p className={styles.sectionSubtitle}>
              Our support team is here to help you succeed
            </p>
          </div>
          <Row>
            <Col lg={4} className="mb-4">
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <h5>Email Support</h5>
                <p>support@djittrading.com</p>
                <small>Replies within 2 hours</small>
              </div>
            </Col>
            <Col lg={4} className="mb-4">
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>
                  <i className="fa-solid fa-comments"></i>
                </div>
                <h5>Live Chat</h5>
                <p>Available 24/5</p>
                <small>Instant help from our team</small>
              </div>
            </Col>
            <Col lg={4} className="mb-4">
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>
                  <i className="fa-solid fa-phone"></i>
                </div>
                <h5>Phone Support</h5>
                <p>+91 97150 92104</p>
                <small>Mon-Sat, 9 AM - 6 PM IST</small>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <Container>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              Ready to Start Your Journey?
            </h2>
            <p className={styles.ctaSubtitle}>
              Join 10,000+ successful traders who transformed their skills with DJIT Trading
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/courses" className={styles.primaryCta}>
                Explore Courses
              </Link>
              <Link to="/register" className={styles.secondaryCta}>
                Create Free Account
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default FAQ;