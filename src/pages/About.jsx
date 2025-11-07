// About.jsx
import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import styles from "./About.module.css";

const About = () => {
  const stats = [
    { number: "10,000+", label: "Active Students" },
    { number: "25+", label: "Smart Courses" },
    { number: "95%", label: "Success Rate" },
    { number: "6+", label: "Years Experience" },
  ];

  return (
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={10}>
              <div className={styles.heroContent}>
                <div className={styles.trustedBadge}>
                  <span className={styles.trustedText}>
                    <span className={styles.checkIcon}>✓</span>
                    Trusted by 10,000+ traders since 2018
                  </span>
                </div>

                <h1 className={styles.heroTitle}>
                  About{" "}
                  <span className={styles.gradientText}>DJIT TRADING</span>
                </h1>
                <p className={styles.heroSubtitle}>
                  Empowering Traders Through Education and Innovation
                </p>
                <div className={styles.taglineContainer}>
                  <p className={styles.tagline}>
                    Your Journey to Trading Excellence Starts Here
                  </p>
                </div>
                <p className={styles.description}>
                  DJIT Trading was founded with a simple mission: to democratize
                  trading education and make professional-level market knowledge
                  accessible to everyone in Tamil and English. We believe that
                  with the right guidance, tools, and community, anyone can
                  master the art of trading.
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
                    as={Link}
                    to="/contact"
                    variant="outline-light"
                    className={styles.secondaryBtn}
                    size="lg"
                  >
                    <span className={styles.btnIcon}>💬</span>
                    Get In Touch
                  </Button>
                </div>

                {/* Stats Section */}
                <div className={styles.heroStats}>
                  {stats.map((stat, index) => (
                    <div key={index} className={styles.stat}>
                      <div className={styles.statIcon}>
                        {index === 0 && "👥"}
                        {index === 1 && "📊"}
                        {index === 2 && "🚀"}
                        {index === 3 && "📅"}
                      </div>
                      <strong>{stat.number}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Our Mission & Vision Section */}
      <section className={styles.missionSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Our Mission & Vision</h2>
                <p className={styles.sectionSubtitle}>
                  Driving financial literacy and trading excellence across India
                </p>
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={6} className="mb-4">
              <Card className={styles.missionCard}>
                <Card.Body>
                  <div className={styles.missionIcon}>🎯</div>
                  <Card.Title>Our Mission</Card.Title>
                  <Card.Text>
                    To democratize trading education by providing high-quality,
                    accessible learning resources in Tamil and English. We aim
                    to empower every aspiring trader with the knowledge, tools,
                    and confidence needed to navigate financial markets
                    successfully.
                  </Card.Text>
                  <ul className={styles.missionList}>
                    <li>Make trading education accessible to all</li>
                    <li>Provide practical, real-world strategies</li>
                    <li>Foster a supportive trading community</li>
                    <li>Continuously innovate our teaching methods</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className={styles.visionCard}>
                <Card.Body>
                  <div className={styles.visionIcon}>🔭</div>
                  <Card.Title>Our Vision</Card.Title>
                  <Card.Text>
                    To become India's most trusted platform for trading
                    education, recognized for transforming beginners into
                    confident, successful traders. We envision a future where
                    every Indian has the opportunity to achieve financial
                    freedom through smart trading.
                  </Card.Text>
                  <ul className={styles.visionList}>
                    <li>Create 100,000 successful traders by 2025</li>
                    <li>Expand to regional languages across India</li>
                    <li>Develop AI-powered trading assistants</li>
                    <li>Establish physical learning centers</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Our Values Section */}
      <section className={styles.valuesSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Our Values</h2>
                <p className={styles.sectionSubtitle}>
                  The principles that guide everything we do at DJIT Trading
                </p>
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIconWrapper}>
                  <div className={styles.valueIcon}>🎓</div>
                </div>
                <h5>Education First</h5>
                <p>
                  We believe knowledge is the foundation of successful trading.
                  Our courses are meticulously designed to provide comprehensive
                  learning from basics to advanced strategies.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIconWrapper}>
                  <div className={styles.valueIcon}>🤝</div>
                </div>
                <h5>Integrity</h5>
                <p>
                  Transparency and honesty are at our core. We provide realistic
                  expectations and never promise guaranteed returns, focusing
                  instead on skill development.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIconWrapper}>
                  <div className={styles.valueIcon}>🌍</div>
                </div>
                <h5>Accessibility</h5>
                <p>
                  Breaking language and financial barriers by offering courses
                  in Tamil and providing various pricing options to suit
                  different budgets.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIconWrapper}>
                  <div className={styles.valueIcon}>🚀</div>
                </div>
                <h5>Innovation</h5>
                <p>
                  Continuously evolving our teaching methods, incorporating the
                  latest market trends, and developing new tools to enhance the
                  learning experience.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIconWrapper}>
                  <div className={styles.valueIcon}>👥</div>
                </div>
                <h5>Community</h5>
                <p>
                  Building a strong network of traders who support, learn from,
                  and grow with each other through our active community
                  platforms.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIconWrapper}>
                  <div className={styles.valueIcon}>💡</div>
                </div>
                <h5>Excellence</h5>
                <p>
                  Committed to delivering the highest quality content, support,
                  and resources to ensure our students receive the best possible
                  trading education.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Teaching Methodology Section */}
      <section className={styles.methodologySection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Our Teaching Methodology
                </h2>
                <p className={styles.sectionSubtitle}>
                  A proven approach that has transformed thousands of traders
                </p>
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={3} md={6} className="mb-4">
              <div className={styles.methodCard}>
                <div className={styles.methodNumber}>01</div>
                <h5>Foundation First</h5>
                <p>
                  We start with building strong fundamentals - understanding
                  market basics, terminology, and developing the right trading
                  mindset.
                </p>
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-4">
              <div className={styles.methodCard}>
                <div className={styles.methodNumber}>02</div>
                <h5>Practical Application</h5>
                <p>
                  Theory meets practice through real-market examples, case
                  studies, and simulated trading exercises.
                </p>
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-4">
              <div className={styles.methodCard}>
                <div className={styles.methodNumber}>03</div>
                <h5>Progressive Learning</h5>
                <p>
                  Structured curriculum that gradually advances from basic
                  concepts to sophisticated trading strategies.
                </p>
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-4">
              <div className={styles.methodCard}>
                <div className={styles.methodNumber}>04</div>
                <h5>Continuous Support</h5>
                <p>
                  Ongoing mentorship, community interaction, and regular updates
                  to keep pace with market changes.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Why Choose DJIT Trading Section */}
      <section className={styles.whyChooseSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Why Choose DJIT Trading?
                </h2>
                <p className={styles.sectionSubtitle}>
                  What sets us apart in the world of trading education
                </p>
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>🗣️</div>
                </div>
                <h5>Tamil & English Content</h5>
                <p>
                  Learn in the language you're most comfortable with. Our
                  bilingual approach makes complex concepts easier to understand
                  and apply.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>🇮🇳</div>
                </div>
                <h5>Indian Market Focus</h5>
                <p>
                  Strategies and examples specifically tailored for Indian stock
                  markets, accounting for local regulations and market
                  behaviors.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>📊</div>
                </div>
                <h5>Practical Tools</h5>
                <p>
                  Access to advanced calculators, charting tools, and analysis
                  resources that complement your learning and trading
                  activities.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>🔄</div>
                </div>
                <h5>Lifetime Access</h5>
                <p>
                  Once you enroll, you get lifetime access to course materials,
                  including future updates and additional content.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>👨‍🏫</div>
                </div>
                <h5>Expert Instructors</h5>
                <p>
                  Learn from seasoned traders with years of market experience
                  and a proven track record of success in various market
                  conditions.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>📱</div>
                </div>
                <h5>Mobile Learning</h5>
                <p>
                  Learn on the go with our mobile-optimized platform and
                  dedicated app, making education accessible anytime, anywhere.
                </p>
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
                  Ready to Begin Your Trading Journey?
                </h2>
                <p className={styles.ctaSubtitle}>
                  Join thousands of successful traders who transformed their
                  skills and achieved financial independence with DJIT Trading
                </p>
                <div className={styles.ctaButtons}>
                  <Button
                    as={Link}
                    to="/courses"
                    size="lg"
                    className={styles.primaryCta}
                  >
                    <span className={styles.btnIcon}>🚀</span>
                    Explore Courses
                  </Button>
                  <Button
                    as={Link}
                    to="/contact"
                    variant="outline-light"
                    size="lg"
                    className={styles.secondaryCta}
                  >
                    <span className={styles.btnIcon}>💬</span>
                    Contact Us
                  </Button>
                </div>
                <div className={styles.trustBadges}>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>🎓</span>
                    10,000+ Students
                  </span>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>⭐</span>
                    4.8/5 Rating
                  </span>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>📅</span>6 Years
                    Experience
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default About;
