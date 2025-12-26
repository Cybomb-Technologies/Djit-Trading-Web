import React from "react";
import { Container, Row, Col } from "react-bootstrap";
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
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              About <span className={styles.gradientText}>DJIT TRADING</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Empowering Traders Through Education and Innovation
            </p>
            <p className={styles.description}>
              DJIT Trading was founded with a simple mission: to democratize
              trading education and make professional-level market knowledge
              accessible to everyone in Tamil and English. We believe that
              with the right guidance, tools, and community, anyone can
              master the art of trading.
            </p>

            <div className={styles.heroButtons}>
              <Link to="/courses" className={styles.primaryBtn}>
                Explore Courses
              </Link>
              <Link to="/contact" className={styles.secondaryBtn}>
                Get In Touch
              </Link>
            </div>

            {/* Stats Section */}
            <div className={styles.heroStats}>
              {stats.map((stat, index) => (
                <div key={index} className={styles.stat}>
                  <strong>{stat.number}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Our Mission & Vision Section */}
      <section className={styles.missionSection}>
        <Container>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Mission & Vision</h2>
            <p className={styles.sectionSubtitle}>
              Driving financial literacy and trading excellence across India
            </p>
          </div>
          <Row>
            <Col lg={6} className="mb-4">
              <div className={styles.missionCard}>
                <div className={styles.missionIcon}>
                  <i className="fa-solid fa-bullseye"></i>
                </div>
                <h3 className={styles.cardTitle}>Our Mission</h3>
                <p>
                  To democratize trading education by providing high-quality,
                  accessible learning resources in Tamil and English. We aim
                  to empower every aspiring trader with the knowledge, tools,
                  and confidence needed.
                </p>
                <ul className={styles.missionList}>
                  <li>Make trading education accessible to all</li>
                  <li>Provide practical, real-world strategies</li>
                  <li>Foster a supportive trading community</li>
                  <li>Continuously innovate our teaching methods</li>
                </ul>
              </div>
            </Col>
            <Col lg={6} className="mb-4">
              <div className={styles.visionCard}>
                <div className={styles.visionIcon}>
                  <i className="fa-solid fa-binoculars"></i>
                </div>
                <h3 className={styles.cardTitle}>Our Vision</h3>
                <p>
                  To become India's most trusted platform for trading
                  education, recognized for transforming beginners into
                  confident, successful traders through smart trading.
                </p>
                <ul className={styles.visionList}>
                  <li>Create 100,000 successful traders by 2025</li>
                  <li>Expand to regional languages across India</li>
                  <li>Develop AI-powered trading assistants</li>
                  <li>Establish physical learning centers</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Our Values Section */}
      <section className={styles.valuesSection}>
        <Container>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Values</h2>
            <p className={styles.sectionSubtitle}>
              The principles that guide everything we do at DJIT Trading
            </p>
          </div>
          <Row>
            {[
              { icon: "fa-graduation-cap", title: "Education First", desc: "Knowledge is the foundation. Comprehensive learning from basics to advanced." },
              { icon: "fa-handshake", title: "Integrity", desc: "Transparency and honesty. We focus on skill development, not false promises." },
              { icon: "fa-globe", title: "Accessibility", desc: "Breaking barriers with Tamil content and affordable pricing options." },
              { icon: "fa-rocket", title: "Innovation", desc: "Evolving methods, latest trends, and new tools for better learning." },
              { icon: "fa-users", title: "Community", desc: "Strong network of traders supporting and growing with each other." },
              { icon: "fa-lightbulb", title: "Excellence", desc: "Delivering highest quality content and resources for our students." }
            ].map((item, idx) => (
              <Col lg={4} md={6} className="mb-4" key={idx}>
                <div className={styles.valueCard}>
                  <div className={styles.valueIcon}>
                    <i className={`fa-solid ${item.icon}`}></i>
                  </div>
                  <h5>{item.title}</h5>
                  <p>{item.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Why Choose DJIT Trading Section */}
      <section className={styles.whyChooseSection}>
        <Container>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Why Choose DJIT?</h2>
            <p className={styles.sectionSubtitle}>
              What sets us apart in the world of trading education
            </p>
          </div>
          <Row>
            {[
              { icon: "fa-language", title: "Tamil & English", desc: "Learn in your preferred language for better understanding." },
              { icon: "fa-flag", title: "Indian Market Focus", desc: "Strategies tailored specifically for Indian market conditions." },
              { icon: "fa-chart-line", title: "Practical Tools", desc: "Access to advanced calculators and analysis resources." },
              { icon: "fa-infinity", title: "Lifetime Access", desc: "One-time enrollment for lifetime content updates." },
              { icon: "fa-chalkboard-teacher", title: "Expert Instructors", desc: "Learn from seasoned traders with proven track records." },
              { icon: "fa-mobile-alt", title: "Mobile Learning", desc: "Dedicated app for learning anytime, anywhere." }
            ].map((item, idx) => (
              <Col lg={4} md={6} className="mb-4" key={idx}>
                <div className={styles.valueCard}>
                  <div className={styles.valueIcon}>
                    <i className={`fa-solid ${item.icon}`}></i>
                  </div>
                  <h5>{item.title}</h5>
                  <p>{item.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <Container>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              Ready to Begin Your Journey?
            </h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of successful traders who transformed their skills with DJIT Trading.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/courses" className={styles.primaryCta}>
                Explore Courses
              </Link>
              <Link to="/contact" className={styles.secondaryCta}>
                Contact Us
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default About;