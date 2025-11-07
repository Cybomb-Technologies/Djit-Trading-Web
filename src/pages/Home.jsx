// Home.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Alert,
  Spinner,
  Modal,
  Form,
  InputGroup,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import styles from "./Home.module.css";


const API_URL = import.meta.env.VITE_API_BASE_URL;


const Home = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState(null);

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/api/courses?featured=true&limit=3`);

      if (response.data.courses && response.data.courses.length > 0) {
        setFeaturedCourses(response.data.courses);
      } else {
        setFeaturedCourses([]);
      }
    } catch (error) {
      console.error("Error fetching featured courses:", error);
      setError("Unable to load featured courses at the moment.");
      setFeaturedCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollClick = (course) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/courses" } });
      return;
    }

    setSelectedCourse(course);
    setCouponCode("");
    setValidatedCoupon(null);
    setShowEnrollModal(true);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim() || !selectedCourse) {
      setValidatedCoupon(null);
      return;
    }

    setCouponLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/coupons/validate`,
        {
          code: couponCode,
          courseId: selectedCourse._id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setValidatedCoupon(response.data.coupon);
      showAlert("Coupon applied successfully!", "success");
    } catch (error) {
      setValidatedCoupon(null);
      showAlert(
        error.response?.data?.message || "Invalid coupon code",
        "danger"
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleEnrollConfirm = async () => {
    if (!selectedCourse) return;

    setEnrolling(true);
    try {
      // Check if course is free
      if (isCourseFree(selectedCourse)) {
        // Direct enrollment for free courses
        await axios.post(
          `${API_URL}/api/enrollments`,
          {
            courseId: selectedCourse._id,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        showAlert("Enrolled successfully! Redirecting to course...", "success");
        setShowEnrollModal(false);

        setTimeout(() => {
          navigate(`/learning/${selectedCourse._id}`);
        }, 2000);
      } else {
        // Paid course - create payment order
        const paymentResponse = await axios.post(
          `${API_URL}/api/payments/create-order`,
          {
            courseId: selectedCourse._id,
            couponCode: validatedCoupon?.code,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const { order, payment } = paymentResponse.data;

        // Initialize Razorpay
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: payment.amount * 100, // Convert to paise
          currency: payment.currency,
          name: "Trading Course Platform",
          description: selectedCourse.title,
          order_id: order.id,
          handler: async function (response) {
            try {
              // Verify payment
              await axios.post(
                `${API_URL}/api/payments/verify`,
                {
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  signature: response.razorpay_signature,
                },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );

              showAlert(
                "Enrollment successful! Redirecting to course...",
                "success"
              );
              setShowEnrollModal(false);

              // Redirect to course page after 2 seconds
              setTimeout(() => {
                navigate(`/learning/${selectedCourse._id}`);
              }, 2000);
            } catch (error) {
              console.error("Payment verification failed:", error);
              showAlert(
                "Payment verification failed. Please contact support.",
                "danger"
              );
            }
          },
          prefill: {
            name: user?.username || "",
            email: user?.email || "",
          },
          theme: {
            color: "#007bff",
          },
          modal: {
            ondismiss: function () {
              showAlert("Payment cancelled", "warning");
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      showAlert(
        error.response?.data?.message || "Enrollment failed. Please try again.",
        "danger"
      );
    } finally {
      setEnrolling(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  const isCourseFree = (course) => {
    if (!course) return false;
    return course.price === 0 || course.discountedPrice === 0;
  };

  const calculateFinalPrice = () => {
    if (!selectedCourse) return 0;

    let price = selectedCourse.discountedPrice || selectedCourse.price;

    if (validatedCoupon) {
      if (validatedCoupon.discountType === "percentage") {
        const discount = (price * validatedCoupon.discountValue) / 100;
        price -= Math.min(discount, validatedCoupon.maxDiscount || discount);
      } else {
        price -= validatedCoupon.discountValue;
      }
    }

    return Math.max(0, price);
  };

  const getLevelVariant = (level) => {
    switch (level) {
      case "Beginner":
        return "success";
      case "Intermediate":
        return "warning";
      case "Advanced":
        return "danger";
      default:
        return "primary";
    }
  };

  return (
    <div className={styles.homePage}>
      {/* Hero Section with Trading Background */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={styles.heroOverlay}></div>
        </div>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={10}>
              <div className={styles.heroContent}>
                {/* Trusted Badge */}
                <div className={styles.trustedBadge}>
                  <span className={styles.trustedText}>
                    <span className={styles.checkIcon}>✓</span>
                    Trusted by 10,000+ traders
                  </span>
                </div>

                <h1 className={styles.heroTitle}>
                  DJIT <span className={styles.gradientText}>TRADING</span>
                </h1>
                <p className={styles.heroSubtitle}>
                  Professional Trading Platform for Modern Investors
                </p>
                <div className={styles.taglineContainer}>
                  <p className={styles.tagline}>
                    Trade Smarter with Advanced Analytics
                  </p>
                </div>
                <p className={styles.description}>
                  Access real-time market data, advanced charting tools, and
                  professional trading features in one powerful platform. Learn
                  trading in Tamil with expert guidance.
                </p>
                <div className={styles.heroButtons}>
                  <Button
                    as={Link}
                    to="/about"
                    className={styles.primaryBtn}
                    size="lg"
                  >
                    <span className={styles.btnIcon}>🎯</span>
                    About Us
                  </Button>
                  <Button
                    as={Link}
                    to="/courses"
                    variant="outline-light"
                    className={styles.secondaryBtn}
                    size="lg"
                  >
                    <span className={styles.btnIcon}>📚</span>
                    View Courses
                  </Button>
                </div>
                <div className={styles.heroStats}>
                  <div className={styles.stat}>
                    <div className={styles.statIcon}>👥</div>
                    <strong>10,000+</strong>
                    <span>Active Students</span>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statIcon}>📊</div>
                    <strong>25+</strong>
                    <span>Smart Courses</span>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statIcon}>🚀</div>
                    <strong>95%</strong>
                    <span>Success Kit</span>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statIcon}>🔄</div>
                    <strong>24/5</strong>
                    <span>Support Available</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>

        {/* Animated Elements */}
        <div className={styles.floatingElement1}></div>
        <div className={styles.floatingElement2}></div>
        <div className={styles.floatingElement3}></div>
      </section>

      {/* Why Choose DJIT Trading Section */}
      <section className={styles.featuresSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Why Choose DJIT Trading?
                </h2>
                <p className={styles.sectionSubtitle}>
                  Everything you need to succeed in trading, all in one place
                </p>
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>📚</div>
                </div>
                <h5>Comprehensive Courses</h5>
                <p>
                  From basics to advanced strategies, learn everything about
                  trading in Tamil with structured curriculum.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>👥</div>
                </div>
                <h5>Community Driven</h5>
                <p>
                  Connect with fellow traders, share ideas, and learn from
                  experiences in our active community.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>🛠️</div>
                </div>
                <h5>Financial Tools</h5>
                <p>
                  Access advanced FG, SIP, and SWP calculators for better
                  financial planning and analysis.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>📱</div>
                </div>
                <h5>Mobile Friendly</h5>
                <p>
                  Learn anytime, anywhere with our fully responsive and
                  mobile-optimized trading platform.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>🎯</div>
                </div>
                <h5>Practical Strategies</h5>
                <p>
                  Real-world trading strategies specifically designed for Indian
                  market conditions.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>🔄</div>
                </div>
                <h5>24/5 Support</h5>
                <p>
                  Get instant help when you need it with our dedicated support
                  team during market hours.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Courses Section - Updated to match Courses.jsx styling */}
      <section className={styles.featuredCoursesSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Featured Courses</h2>
                <p className={styles.sectionSubtitle}>
                  Handpicked courses to kickstart your trading journey
                </p>
              </div>
            </Col>
          </Row>

          {alert.show && (
            <Row className="mb-4">
              <Col>
                <Alert
                  variant={alert.type}
                  dismissible
                  onClose={() =>
                    setAlert({ show: false, message: "", type: "" })
                  }
                >
                  {alert.message}
                </Alert>
              </Col>
            </Row>
          )}

          {loading ? (
            <Row>
              <Col className="text-center">
                <div className={styles.loading}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading courses...</p>
                </div>
              </Col>
            </Row>
          ) : featuredCourses.length > 0 ? (
            <Row>
              {featuredCourses.map((course) => (
                <Col lg={4} md={6} className="mb-4" key={course._id}>
                  <Card className={`${styles.courseCard} h-100`}>
                    <div className={styles.courseImage}>
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} />
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          {course.title?.charAt(0) || "C"}
                        </div>
                      )}
                      <Badge
                        bg={getLevelVariant(course.level)}
                        className={styles.levelBadge}
                      >
                        {course.level}
                      </Badge>
                      {course.featured && (
                        <Badge bg="primary" className={styles.featuredBadge}>
                          Featured
                        </Badge>
                      )}
                      {isCourseFree(course) && (
                        <Badge bg="success" className={styles.freeBadge}>
                          Free
                        </Badge>
                      )}
                    </div>
                    <Card.Body
                      className={`${styles.courseBody} d-flex flex-column`}
                    >
                      <div className={styles.courseHeader}>
                        <Card.Title className={styles.courseTitle}>
                          {course.title}
                        </Card.Title>
                        <Card.Text className={styles.courseDescription}>
                          {course.description?.substring(0, 120)}...
                        </Card.Text>
                      </div>

                      <div className={styles.courseMeta}>
                        <div className={styles.instructor}>
                          <span className={styles.metaLabel}>Instructor:</span>
                          <span className={styles.metaValue}>
                            {course.instructor}
                          </span>
                        </div>
                        <div className={styles.duration}>
                          <span className={styles.metaLabel}>Duration:</span>
                          <span className={styles.metaValue}>
                            {course.duration}
                          </span>
                        </div>
                        <div className={styles.lessons}>
                          <span className={styles.metaLabel}>Lessons:</span>
                          <span className={styles.metaValue}>
                            {course.lessonsCount || course.lessons || 0}
                          </span>
                        </div>
                        <div className={styles.students}>
                          <span className={styles.metaLabel}>Students:</span>
                          <span className={styles.metaValue}>
                            {course.studentsEnrolled ||
                              course.enrolledCount ||
                              0}
                          </span>
                        </div>
                      </div>

                      <div className={`${styles.courseFooter} mt-auto`}>
                        <div className={styles.priceSection}>
                          <div className={styles.coursePrice}>
                            {isCourseFree(course) ? (
                              <span className={styles.freePrice}>Free</span>
                            ) : (
                              <>
                                <span className={styles.currentPrice}>
                                  ₹{course.discountedPrice || course.price}
                                </span>
                                {course.discountedPrice && (
                                  <span className={styles.originalPrice}>
                                    ₹{course.price}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          {course.discountedPrice && !isCourseFree(course) && (
                            <div className={styles.discountBadge}>
                              Save{" "}
                              {Math.round(
                                (1 - course.discountedPrice / course.price) *
                                  100
                              )}
                              %
                            </div>
                          )}
                        </div>
                        <Button
                          variant={isCourseFree(course) ? "success" : "primary"}
                          className={styles.enrollBtn}
                          onClick={() => handleEnrollClick(course)}
                          disabled={
                            enrolling && selectedCourse?._id === course._id
                          }
                        >
                          {enrolling && selectedCourse?._id === course._id ? (
                            <>
                              <Spinner
                                animation="border"
                                size="sm"
                                className="me-2"
                              />
                              Processing...
                            </>
                          ) : isCourseFree(course) ? (
                            "Enroll Free"
                          ) : (
                            "Enroll Now"
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Row>
              <Col className="text-center">
                <div className={styles.noResults}>
                  <h4>No featured courses found</h4>
                  <p>Check back later for new courses</p>
                </div>
              </Col>
            </Row>
          )}

          <Row className="text-center mt-4">
            <Col>
              <Button
                as={Link}
                to="/courses"
                variant="outline-primary"
                size="lg"
                className={styles.viewAllBtn}
              >
                View All Courses
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonialsSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>What Our Students Say</h2>
                <p className={styles.sectionSubtitle}>
                  Real success stories from real traders who transformed their
                  journey
                </p>
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={4} className="mb-4">
              <div className={styles.testimonialCard}>
                <div className={styles.quoteIcon}>❝</div>
                <p className={styles.testimonialText}>
                  "DJIT Trading completely transformed my understanding of the
                  market. The Tamil courses made complex concepts incredibly
                  easy to grasp and apply."
                </p>
                <div className={styles.studentInfo}>
                  <div className={styles.studentAvatar}>RK</div>
                  <strong>Rajesh Kumar</strong>
                  <span>Intraday Trader</span>
                </div>
              </div>
            </Col>
            <Col lg={4} className="mb-4">
              <div className={styles.testimonialCard}>
                <div className={styles.quoteIcon}>❝</div>
                <p className={styles.testimonialText}>
                  "The community support and practical strategies helped me
                  achieve consistent profits. Highly recommended for serious
                  traders!"
                </p>
                <div className={styles.studentInfo}>
                  <div className={styles.studentAvatar}>PS</div>
                  <strong>Priya Shankar</strong>
                  <span>Options Trader</span>
                </div>
              </div>
            </Col>
            <Col lg={4} className="mb-4">
              <div className={styles.testimonialCard}>
                <div className={styles.quoteIcon}>❝</div>
                <p className={styles.testimonialText}>
                  "Best investment I ever made was in DJIT courses. The
                  technical analysis module alone is worth the entire course
                  fee."
                </p>
                <div className={styles.studentInfo}>
                  <div className={styles.studentAvatar}>VP</div>
                  <strong>Vikram Patel</strong>
                  <span>Technical Analyst</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Download App Section */}
      <section className={styles.downloadAppSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Trade On The Go</h2>
                <p className={styles.sectionSubtitle}>
                  Download our mobile app and never miss a trading opportunity
                </p>
              </div>
            </Col>
          </Row>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className={styles.appContent}>
                <div className={styles.appFeatures}>
                  <div className={styles.appFeature}>
                    <div className={styles.featureIcon}>📱</div>
                    <div>
                      <strong>Real-time Alerts</strong>
                      <span>Instant market notifications</span>
                    </div>
                  </div>
                  <div className={styles.appFeature}>
                    <div className={styles.featureIcon}>📊</div>
                    <div>
                      <strong>Live Charts</strong>
                      <span>Advanced technical analysis</span>
                    </div>
                  </div>
                  <div className={styles.appFeature}>
                    <div className={styles.featureIcon}>⚡</div>
                    <div>
                      <strong>Quick Orders</strong>
                      <span>Execute trades in seconds</span>
                    </div>
                  </div>
                </div>

                <div className={styles.downloadButtons}>
                  <a href="#" className={styles.storeButton}>
                    <div className={styles.storeIcon}>
                      <span className={styles.appleIcon}></span>
                    </div>
                    <div className={styles.storeText}>
                      <span>Download on the</span>
                      <strong>App Store</strong>
                    </div>
                  </a>

                  <a href="#" className={styles.storeButton}>
                    <div className={styles.storeIcon}>
                      <span className={styles.playIcon}></span>
                    </div>
                    <div className={styles.storeText}>
                      <span>Get it on</span>
                      <strong>Google Play</strong>
                    </div>
                  </a>
                </div>
              </div>
            </Col>

            <Col lg={6}>
              <div className={styles.phoneMockup}>
                <div className={styles.phoneFrame}>
                  <div className={styles.phoneScreen}>
                    <div className={styles.screenContent}>
                      <div className={styles.appHeader}>
                        <div className={styles.appLogo}>DJIT</div>
                        <div className={styles.marketStatus}>
                          <span className={styles.liveDot}></span>
                          Live Market
                        </div>
                      </div>
                      <div className={styles.stockTicker}>
                        <div className={styles.stockItem}>
                          <span>NIFTY</span>
                          <span className={styles.stockPrice}>22,415.25</span>
                          <span className={styles.stockChange}>+1.2%</span>
                        </div>
                        <div className={styles.stockItem}>
                          <span>SENSEX</span>
                          <span className={styles.stockPrice}>73,805.64</span>
                          <span className={styles.stockChange}>+0.8%</span>
                        </div>
                      </div>
                      <div className={styles.chartPlaceholder}></div>
                      <div className={styles.quickActions}>
                        <button className={styles.actionBtn}>Buy</button>
                        <button className={styles.actionBtn}>Sell</button>
                        <button className={styles.actionBtn}>Chart</button>
                        <button className={styles.actionBtn}>Watchlist</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.floatingNotification}>
                  <div className={styles.notificationIcon}>📈</div>
                  <div className={styles.notificationText}>
                    <strong>Alert: NIFTY</strong>
                    <span>Breakout detected</span>
                  </div>
                </div>
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
                  Ready to Master Stock Market Trading?
                </h2>
                <p className={styles.ctaSubtitle}>
                  Join 10,000+ successful traders who transformed their skills
                  and achieved financial freedom with DJIT Trading
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
                    Start Growing Today
                  </Button>
                </div>
                <div className={styles.trustBadges}>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>🔒</span>
                    Premium Content
                  </span>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>⭐</span>
                    4.8/5 Rating
                  </span>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>💼</span>
                    10K+ Students
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      {/* Enroll Confirmation Modal */}
      <Modal
        show={showEnrollModal}
        onHide={() => setShowEnrollModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Enroll in Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCourse && (
            <div className={styles.enrollModalContent}>
              <div className={styles.courseInfo}>
                <h5>{selectedCourse.title}</h5>
                <p className="text-muted">{selectedCourse.instructor}</p>
              </div>

              <div className={styles.pricingSection}>
                <div className={styles.originalPriceLine}>
                  <span>Course Price:</span>
                  <span>
                    ₹{selectedCourse.discountedPrice || selectedCourse.price}
                  </span>
                </div>

                {validatedCoupon && (
                  <div className={styles.couponDiscount}>
                    <span>Coupon Discount:</span>
                    <span className={styles.discountText}>
                      -₹
                      {(
                        (selectedCourse.discountedPrice ||
                          selectedCourse.price) - calculateFinalPrice()
                      ).toFixed(2)}
                    </span>
                  </div>
                )}

                <hr />
                <div className={styles.finalPrice}>
                  <strong>Final Price:</strong>
                  <strong>₹{calculateFinalPrice()}</strong>
                </div>
              </div>

              {!isCourseFree(selectedCourse) && (
                <div className={styles.couponSection}>
                  <Form.Group>
                    <Form.Label>Have a coupon code?</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={couponLoading}
                      />
                      <Button
                        variant="outline-primary"
                        onClick={validateCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                      >
                        {couponLoading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </div>
              )}

              <div className={styles.enrollBenefits}>
                <h6>What you'll get:</h6>
                <ul>
                  <li>Lifetime access to course content</li>
                  <li>Certificate of completion</li>
                  <li>Q&A support</li>
                  <li>Downloadable resources</li>
                  <li>Mobile and TV access</li>
                </ul>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEnrollConfirm}
            disabled={enrolling || !selectedCourse}
            className={styles.confirmEnrollBtn}
          >
            {enrolling ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : selectedCourse && isCourseFree(selectedCourse) ? (
              "Enroll for Free"
            ) : (
              `Pay ₹${calculateFinalPrice()}`
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Home;
