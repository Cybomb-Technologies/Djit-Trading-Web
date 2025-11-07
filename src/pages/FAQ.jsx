// FAQ.jsx
import React, { useState } from "react";
import { Container, Row, Col, Card, Accordion, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import styles from "./FAQ.module.css";

const FAQ = () => {
  const [activeKey, setActiveKey] = useState("0");

  const faqCategories = [
    {
      title: "Getting Started",
      icon: "🚀",
      color: "#FF6B6B",
      questions: [
        {
          question: "What is DJIT Trading?",
          answer:
            "DJIT Trading is a comprehensive trading education platform designed specifically for Indian traders. We provide expert-led courses in Tamil and English, advanced trading tools, and a supportive community to help traders master financial markets with confidence.",
        },
        {
          question: "Do I need any prior trading experience?",
          answer:
            "Absolutely not! DJIT Trading welcomes traders of all experience levels. Our structured curriculum begins with foundational concepts and gradually progresses to advanced strategies. We have dedicated beginner courses that start from the very basics of stock market operations.",
        },
        {
          question: "Is DJIT Trading suitable for complete beginners?",
          answer:
            "Yes! Our 'Zero to Hero' program is specifically designed for complete beginners. We start with understanding what stocks are, how markets work, and gradually build up to sophisticated trading strategies. Over 65% of our students started with zero trading knowledge.",
        },
      ],
    },
    {
      title: "Courses & Learning",
      icon: "📚",
      color: "#4ECDC4",
      questions: [
        {
          question: "What courses does DJIT Trading offer?",
          answer:
            "We offer comprehensive courses in Intraday Trading, Options Trading, Technical Analysis, Risk Management, Swing Trading, and Futures Trading. All courses are available in Tamil with English subtitles.",
        },
        {
          question: "Are the courses suitable for beginners?",
          answer:
            "Yes! We have courses for all levels - from complete beginners to advanced traders. Each course is clearly marked with its difficulty level, and we recommend starting with our Technical Analysis Foundation course if you're new to trading.",
        },
        {
          question: "How long do I have access to the course material?",
          answer:
            "Once you enroll in a course, you get lifetime access to all course materials, including future updates. You can learn at your own pace and revisit the content anytime.",
        },
        {
          question: "Do you provide certificates after course completion?",
          answer:
            "Yes, upon successful completion of any course, you will receive a certificate of completion from DJIT Trading that you can add to your profile or resume.",
        },
        {
          question: "What types of courses do you offer?",
          answer:
            "We offer comprehensive courses in multiple categories: Stock Market Fundamentals, Technical Analysis, Options Trading, Futures & Derivatives, Risk Management, and Portfolio Strategy. All courses are available in both Tamil and English with lifetime access.",
        },
        {
          question: "Are the courses available in Tamil?",
          answer:
            "Yes! All our core courses are available in Tamil with native Tamil instructors. We believe in breaking language barriers in financial education. Our Tamil courses include local market examples and culturally relevant trading scenarios.",
        },
        {
          question: "How long do I have access to the courses?",
          answer:
            "You get lifetime access to all courses you purchase! This includes all future updates, additional materials, and new content we add to the courses. Learn at your own pace without any time pressure.",
        },
        {
          question: "Do you provide practical trading sessions?",
          answer:
            "Yes! We conduct weekly live trading sessions where our experts trade in real markets while explaining their strategies. We also provide simulated trading environments for practice without financial risk.",
        },
      ],
    },
    {
      title: "Technical & Platform",
      icon: "💻",
      color: "#45B7D1",
      questions: [
        {
          question: "What trading tools are included?",
          answer:
            "DJIT Trading provides advanced FG (Financial Growth), SIP (Systematic Investment Plan), and SWP (Systematic Withdrawal Plan) calculators. Plus, you get access to our proprietary charting tools, market scanners, and real-time alert systems.",
        },
        {
          question: "Can I access the platform on mobile?",
          answer:
            "Absolutely! Our platform is fully responsive and optimized for all devices. We also have dedicated mobile apps for iOS and Android with all features including live streaming, charting, and course access on the go.",
        },
        {
          question: "Do you provide real-time market data?",
          answer:
            "Yes, premium members get access to real-time NSE and BSE data, advanced charting with 50+ technical indicators, and customizable watchlists. Our data feeds are directly sourced from exchange-approved providers.",
        },
        {
          question: "Can I access courses on mobile devices?",
          answer:
            "Absolutely! Our platform is fully mobile-friendly. You can access all courses, tools, and community features on your smartphone or tablet through any modern web browser.",
        },
        {
          question: "Is the platform available in Tamil?",
          answer:
            "Yes, DJIT Trading is specifically designed for Tamil-speaking traders. All our course content, support, and community discussions are available in Tamil.",
        },
        {
          question: "What are the system requirements?",
          answer:
            "You need a stable internet connection and a modern web browser (Chrome, Firefox, Safari, or Edge). No special software or high-end hardware is required.",
        },
      ],
    },
    {
      title: "Payments & Pricing",
      icon: "💰",
      color: "#96CEB4",
      questions: [
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept all major payment methods: Credit/Debit cards, Net Banking, UPI, PayPal, and popular digital wallets. All transactions are secured with 256-bit SSL encryption and we never store your payment details.",
        },
        {
          question: "Do you offer installment plans?",
          answer:
            "A: No, we don't provide installment plans. Course access requires full payment at enrollment.",
        },
        {
          question: "Is there a money-back guarantee?",
          answer:
            "We offer a 15-day no-questions-asked money-back guarantee on all courses. If you're not completely satisfied with your learning experience, we'll provide a full refund within 15 days of purchase.",
        },
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept all major payment methods including Credit/Debit cards, UPI, Net Banking, and popular digital wallets. All payments are processed securely through encrypted gateways.",
        },
        {
          question: "Do you offer refunds?",
          answer:
            "Yes, we offer a 7-day money-back guarantee. If you're not satisfied with the course within 7 days of purchase, you can request a full refund - no questions asked.",
        },
        {
          question: "Are there any hidden costs?",
          answer:
            "No hidden costs! The course price you see is the final price. There are no additional fees for course materials, certificates, or community access.",
        },
        {
          question: "Do you offer EMI options?",
          answer:
            "No, we don't offer EMI options. All courses are available through one-time payment only.",
        },
      ],
    },
    {
      title: "Trading",
      icon: "📊",
      color: "#FFBE0B",
      questions: [
        {
          question: "Can I start trading with just the course knowledge?",
          answer:
            "Our courses provide comprehensive knowledge, but we strongly recommend starting with paper trading (virtual trading) first to practice without risking real money. Gain confidence before trading with actual capital.",
        },
        {
          question: "What is the minimum capital required to start trading?",
          answer:
            "The minimum capital depends on your trading style. For intraday trading, you can start with ₹10,000-25,000. For options trading, we recommend starting with at least ₹50,000. Always start small and scale up as you gain experience.",
        },
        {
          question: "Do you provide trading tips or buy/sell signals?",
          answer:
            "No, we focus on education rather than tips. Our goal is to make you an independent trader who can analyze markets and make informed decisions. The community section allows traders to share their analysis, but these are educational discussions, not recommendations.",
        },
      ],
    },
    {
      title: "Community & Support",
      icon: "👥",
      color: "#FF6B6B",
      questions: [
        {
          question: "What community features do you offer?",
          answer:
            "DJIT Trading includes access to our exclusive trader community with daily market discussions, expert Q&A sessions, peer learning groups, and mentorship programs. Connect with 10,000+ active traders!",
        },
        {
          question: "How do I get help during my learning journey?",
          answer:
            "We provide multiple support channels: 24/5 dedicated support team, course-specific discussion forums, weekly live Q&A sessions with instructors, and direct messaging for premium members.",
        },
        {
          question: "Do you offer one-on-one mentorship?",
          answer:
            "Yes! Our premium mentorship program pairs you with experienced traders who provide personalized guidance, portfolio reviews, and strategy development sessions tailored to your trading goals.",
        },
        {
          question: "What support do you provide?",
          answer:
            "We offer 24/5 support (Monday to Friday, 9 AM to 6 PM IST) through email, chat, and phone. You can reach out for any course-related queries, technical issues, or general questions.",
        },
        {
          question: "How can I contact support?",
          answer:
            "You can reach us at support@djittrading.com or call us at +91 98765 43210. We also have a live chat feature available on our website during business hours.",
        },
        {
          question: "Is there a community or forum for students?",
          answer:
            "Yes! We have an active Traders Community where students can discuss strategies, share insights, and learn from each other. It's a great place to network with fellow traders.",
        },
      ],
    },
    {
      title: "Certification & Career",
      icon: "📜",
      color: "#6A4C93",
      questions: [
        {
          question: "Do I get a certificate after course completion?",
          answer:
            "Yes! Upon successfully completing any course, you'll receive a verified certificate that you can showcase on LinkedIn, include in your professional portfolio, or share with potential employers.",
        },
        {
          question: "Are your certificates recognized?",
          answer:
            "DJIT Trading certificates are recognized by leading financial institutions and trading communities. Our certification program follows industry standards and is valued by employers in the financial sector.",
        },
        {
          question: "Can DJIT Trading help me start a trading career?",
          answer:
            "Absolutely! Many of our students have transitioned to full-time trading careers. We provide career guidance, internship opportunities with partner brokers, and job placement assistance for qualified students.",
        },
      ],
    },
  ];

  // Function to handle email click
  const handleEmailClick = () => {
    window.location.href = "mailto:support@djittrading.com";
  };

  // Function to handle phone click
  const handlePhoneClick = () => {
    window.location.href = "tel:+919876543210";
  };

  // Function to handle live chat click
  const handleLiveChatClick = () => {
    // You can integrate with your live chat service here
    // For now, we'll open a new window with a contact form
    window.open("/contact", "_blank");
  };

  return (
    <div className={styles.faqPage}>
      {/* Hero Section */}
      <section className={styles.faqHero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroOverlay}></div>
        </div>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <div className={styles.heroContent}>
                <div className={styles.trustedBadge}>
                  <span className={styles.trustedText}>
                    <span className={styles.checkIcon}>✓</span>
                    Trusted by 10,000+ Traders
                  </span>
                </div>

                <h1 className={styles.heroTitle}>
                  Frequently Asked{" "}
                  <span className={styles.gradientText}>Questions</span>
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
                  <Button
                    as={Link}
                    to="/courses"
                    className={styles.primaryBtn}
                    size="lg"
                  >
                    <span className={styles.btnIcon}>📚</span>
                    Explore Courses
                  </Button>
                  <Button
                    href="#contact"
                    variant="outline-light"
                    className={styles.secondaryBtn}
                    size="lg"
                  >
                    <span className={styles.btnIcon}>💬</span>
                    Contact Support
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Categories Section - Redesigned */}
      <section className={styles.categoriesSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Browse by Category</h2>
                <p className={styles.sectionSubtitle}>
                  Find answers organized by topics that matter to you
                </p>
              </div>
            </Col>
          </Row>
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
                      <div className={styles.categoryLeft}>
                        <div
                          className={styles.categoryIcon}
                          style={{ backgroundColor: category.color }}
                        >
                          {category.icon}
                        </div>
                        <div className={styles.categoryText}>
                          <h4 className={styles.categoryTitle}>
                            {category.title}
                          </h4>
                          <p className={styles.categoryCount}>
                            {category.questions.length} Questions
                          </p>
                        </div>
                      </div>
                      <div className={styles.categoryRight}>
                        <span className={styles.categoryArrow}>→</span>
                      </div>
                    </div>
                    <div className={styles.categoryDivider}></div>
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
              <Row className="mb-4">
                <Col>
                  <div className={styles.categoryHeader}>
                    <div className={styles.categoryIconWrapper}>
                      <span
                        className={styles.categoryTitleIcon}
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </span>
                    </div>
                    <div className={styles.categoryTitleContent}>
                      <h3 className={styles.categoryTitle}>{category.title}</h3>
                      <p className={styles.categorySubtitle}>
                        {category.questions.length} questions about{" "}
                        {category.title.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>
              <Row className="justify-content-center">
                <Col lg={10}>
                  <Card className={styles.faqCard}>
                    <Card.Body>
                      <Accordion
                        activeKey={activeKey}
                        onSelect={(key) => setActiveKey(key)}
                      >
                        {category.questions.map((faq, index) => (
                          <Accordion.Item
                            key={index}
                            eventKey={`${catIndex}-${index}`}
                            className={styles.accordionItem}
                          >
                            <Accordion.Header
                              className={styles.accordionHeader}
                            >
                              <div className={styles.questionContent}>
                                <span
                                  className={styles.questionNumber}
                                  style={{ backgroundColor: category.color }}
                                >
                                  Q{index + 1}
                                </span>
                                <span className={styles.question}>
                                  {faq.question}
                                </span>
                                <div className={styles.accordionArrow}>
                                  <span className={styles.arrowIcon}>▼</span>
                                </div>
                              </div>
                            </Accordion.Header>
                            <Accordion.Body className={styles.accordionBody}>
                              <div className={styles.answerContent}>
                                <span
                                  className={styles.answerLabel}
                                  style={{ backgroundColor: category.color }}
                                >
                                  A
                                </span>
                                <span className={styles.answer}>
                                  {faq.answer}
                                </span>
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          ))}
        </Container>
      </section>

      {/* Contact Section */}
      <section id="contact" className={styles.contactSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Still Have Questions?</h2>
                <p className={styles.sectionSubtitle}>
                  Our support team is here to help you succeed in your trading
                  journey
                </p>
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={4} className="mb-4">
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>📧</div>
                <h5>Email Support</h5>
                <p
                  className={styles.clickableText}
                  onClick={handleEmailClick}
                  style={{ cursor: "pointer" }}
                >
                  support@djittrading.com
                </p>
                <small>Typically replies within 2 hours</small>
                <Button
                  variant="outline-primary"
                  className="mt-3"
                  onClick={handleEmailClick}
                >
                  Send Email
                </Button>
              </div>
            </Col>
            <Col lg={4} className="mb-4">
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>💬</div>
                <h5>Contact Us</h5>
                <p>Available 24/5 Market Hours</p>
                <small>Get instant help from our team</small>
                <Button
                  variant="outline-primary"
                  className="mt-3"
                  onClick={handleLiveChatClick}
                >
                  Get in Touch
                </Button>
              </div>
            </Col>
            <Col lg={4} className="mb-4">
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>📞</div>
                <h5>Phone Support</h5>
                <p
                  className={styles.clickableText}
                  onClick={handlePhoneClick}
                  style={{ cursor: "pointer" }}
                >
                  +91 9715092104
                </p>
                <small>Mon-Sat, 9 AM - 6 PM IST</small>
                <Button
                  variant="outline-primary"
                  className="mt-3"
                  onClick={handlePhoneClick}
                >
                  Call Now
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBackground}>
          <div className={styles.ctaOverlay}></div>
        </div>
        <Container>
          <Row className="text-center">
            <Col lg={8} className="mx-auto">
              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>
                  Ready to Start Your Trading Journey?
                </h2>
                <p className={styles.ctaSubtitle}>
                  Join 10,000+ successful traders who transformed their skills
                  with DJIT Trading
                </p>
                <div className={styles.ctaButtons}>
                  <Button
                    as={Link}
                    to="/courses"
                    size="lg"
                    className={styles.primaryCta}
                  >
                    <span className={styles.btnIcon}>🚀</span>
                    Explore All Courses
                  </Button>
                  <Button
                    as={Link}
                    to="/register"
                    variant="outline-light"
                    size="lg"
                    className={styles.secondaryCta}
                  >
                    <span className={styles.btnIcon}>📖</span>
                    Create Free Account
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default FAQ;
