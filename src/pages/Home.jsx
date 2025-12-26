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
import rectDark from '../assets/testimonial_svg/Rectangle 4811.svg';
import rectTeal from '../assets/testimonial_svg/Rectangle 4812.svg';
import quoteOpen from '../assets/testimonial_svg/❝.svg';
import quoteClose from '../assets/testimonial_svg/❝-1.svg';

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

  const [reviews, setReviews] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedCourses();
    fetchReviews();
  }, []);

  // Add this useEffect for the rotating interval
  useEffect(() => {
    if (reviews.length > 0) {
      const interval = setInterval(() => {
        setCurrentReviewIndex((prevIndex) =>
          prevIndex < reviews.length - 1 ? prevIndex + 1 : 0
        );
      }, 5000); // 5 seconds interval

      return () => clearInterval(interval);
    }
  }, [reviews.length]);

  const fetchFeaturedCourses = async () => {
    try {
      setError(null);
      const response = await axios.get(
        `${API_URL}/api/courses?featured=true&limit=3`
      );

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

  // Add this function to fetch reviews
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      console.log('Fetching reviews from API...');

      const response = await axios.get(
        `${API_URL}/api/reviews?limit=10&sortBy=-createdAt`
      );

      console.log('Reviews API Response:', response.data);

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        console.log(`Loaded ${response.data.data.length} reviews`);
        setReviews(response.data.data);
      } else {
        console.log('No reviews found, using fallback');
        // Fallback to static testimonials if no reviews found
        setReviews(getFallbackReviews());
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      console.error("Error details:", error.response?.data || error.message);

      // Keep the static testimonials as fallback
      setReviews(getFallbackReviews());
    } finally {
      setReviewsLoading(false);
    }
  };

  // Add this helper function for fallback reviews
  const getFallbackReviews = () => {
    return [
      {
        _id: "1",
        reviewerName: "Rajesh Kumar",
        rating: 5,
        reviewText: "DJIT Trading completely transformed my understanding of the market. The Tamil courses made complex concepts incredibly easy to grasp and apply.",
        courseName: "Advanced Trading Strategies",
        createdAt: new Date().toISOString()
      },
      {
        _id: "2",
        reviewerName: "Priya Shankar",
        rating: 5,
        reviewText: "The community support and practical strategies helped me achieve consistent profits. Highly recommended for serious traders!",
        courseName: "Options Trading Mastery",
        createdAt: new Date().toISOString()
      },
      {
        _id: "3",
        reviewerName: "Vikram Patel",
        rating: 5,
        reviewText: "Best investment I ever made was in DJIT courses. The technical analysis module alone is worth the entire course fee.",
        courseName: "Technical Analysis Pro",
        createdAt: new Date().toISOString()
      }
    ];
  };

  // Add helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return "DJ";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Add helper function to format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric"
      });
    } catch (error) {
      return "Recently";
    }
  };

  // Add helper function to get stars for rating
  const renderStars = (rating) => {
    return (
      <div className={styles.ratingStars}>
        {[...Array(5)].map((_, index) => (
          <span
            key={index}
            className={index < rating ? styles.starFilled : styles.starEmpty}
          >
            ★
          </span>
        ))}
      </div>
    );
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
  const [currentHeading, setCurrentHeading] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const headings = [
    "Master the Markets with AI-Powered Insights",
    "Trade Smarter with Real-Time Analytics",
    "Learn Professional Trading Strategies",
    "Join 10,000+ Successful Traders",
  ];

  useEffect(() => {
    const typeSpeed = isDeleting ? 50 : 100;
    const current = headings[currentHeading];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < current.length) {
          setDisplayText(current.substring(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(current.substring(0, displayText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentHeading((prev) => (prev + 1) % headings.length);
        }
      }
    }, typeSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentHeading, headings]);

  return (
    <div className={styles.homePage}>
      {/* Hero Section with Trading Background */}
      <section className={styles.heroSection}>
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className={styles.heroVideo}
          onEnded={(e) => {
            e.target.currentTime = 0;
            e.target.play();
          }}
        >
          <source
            src="https://res.cloudinary.com/dcfjt8shw/video/upload/hq0atsss2mkigtlwlp6d.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>

        {/* Dark Overlay for Content Readability */}
        <div className={styles.heroOverlay}></div>

        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={10}>
              <div className={styles.heroContent}>
                {/* Small Company Name
                <div className={styles.companyNameSmall}>
                  <span className={styles.companyTextSmall}>
                    DJIT TRADING
                  </span>
                </div> */}

                {/* Trusted Badge */}
                {/* <div className={styles.trustedBadge}>
                  <span className={styles.trustedText}>
                    Trusted by 10,000+ Professional Traders
                  </span>
                </div> */}

                {/* Terminal Text Animation as Main Heading */}
                <div className={styles.terminalHeading}>
                  <div className={styles.terminalTextWrapper}>
                    <span className={styles.prompt}>$ </span>
                    <span className={styles.typedText}>{displayText}</span>
                    <span className={styles.cursor}>|</span>
                  </div>
                </div>

                <p className={styles.heroSubtitle} style={{ color: "white", paddingTop: "40px", fontWeight: "bold", fontSize: "24px" }}>
                  Professional Trading Platform for Modern Investors
                </p>

                {/* <div className={styles.taglineContainer}>
                  <p className={styles.tagline}>
                    Advanced Tools • Real-Time Data • Expert Guidance
                  </p>
                </div> */}

                <p className={styles.description} style={{ color: "white", padding: "40px" }}>
                  Access cutting-edge trading technology with AI-powered
                  analytics, real-time market insights, and professional-grade
                  charting tools. Learn trading strategies in Tamil with
                  industry experts.
                </p>

                <div className={styles.heroButtons}>
                  <Button
                    as={Link}
                    to="/about"
                    className={styles.primaryBtn}
                    size="lg"
                  >
                    Start Trading
                  </Button>
                  <Button
                    as={Link}
                    to="/courses"
                    variant="outline-light"
                    className={styles.secondaryBtn}
                    size="lg"
                  >
                    View Courses
                  </Button>
                  <Button
                    as={Link}
                    to="/demo"
                    className={styles.tertiaryBtn}
                    size="lg"
                  >
                    Free Demo
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section with Beige Background */}
      <section className={styles.statsSection}>
        <Container>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <strong>10K+</strong>
              <span>Active Traders</span>
            </div>
            <div className={styles.stat}>
              <strong>95%</strong>
              <span>Success Rate</span>
            </div>
            <div className={styles.stat}>
              <strong>50ms</strong>
              <span>Execution Speed</span>
            </div>
            <div className={styles.stat}>
              <strong>24/5</strong>
              <span>Global Markets</span>
            </div>
          </div>
        </Container>
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
          <Row className="g-4">
            {/* Row 1 */}
            <Col lg={4} md={6}>
              <div className={`${styles.featureCard} ${styles.featureCardOrange}`}>
                <i className="fa-solid fa-book"></i>
                <h5>Comprehensive Courses</h5>
                <p>
                  From basics to advanced strategies, learn everything about trading in Tamil with structured curriculum.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6}>
              <div className={`${styles.featureCard} ${styles.featureCardBlue}`}>
                <i className="fa-solid fa-users"></i>
                <h5>Community Driven</h5>
                <p>
                  Connect with fellow traders, share ideas, and learn from experiences in our active community.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6}>
              <div className={`${styles.featureCard} ${styles.featureCardOrange}`}>
                <i className="fa-solid fa-screwdriver-wrench"></i>
                <h5>Financial Tools</h5>
                <p>
                  Access advanced FG, SIP, and SWP calculators for better financial planning and analysis.
                </p>
              </div>
            </Col>

            {/* Row 2 */}
            <Col lg={4} md={6}>
              <div className={`${styles.featureCard} ${styles.featureCardBlue}`}>
                <i className="fa-solid fa-mobile-screen-button"></i>
                <h5>Mobile Friendly</h5>
                <p>
                  Learn anytime, anywhere with our fully responsive and mobile-optimized trading platform.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6}>
              <div className={`${styles.featureCard} ${styles.featureCardOrange}`}>
                <i className="fa-solid fa-bullseye"></i>
                <h5>Practical Strategies</h5>
                <p>
                  Real-world trading strategies specifically designed for Indian market conditions.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6}>
              <div className={`${styles.featureCard} ${styles.featureCardBlue}`}>
                <i className="fa-solid fa-headset"></i>
                <h5>24/5 Support</h5>
                <p>
                  Get instant help when you need it with our dedicated support team during market hours.
                </p>
              </div>
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
                  Real success stories from real traders who transformed their journey
                </p>
              </div>
            </Col>
          </Row>

          {reviewsLoading ? (
            <Row>
              <Col className="text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading testimonials...</p>
              </Col>
            </Row>
          ) : reviews.length > 0 ? (
            <Row className="justify-content-center g-4">
              {/* Display 3 reviews starting from currentReviewIndex */}
              {[0, 1, 2].map((offset) => {
                const index = (currentReviewIndex + offset) % reviews.length;
                const review = reviews[index];

                return (
                  <Col key={index} lg={4} md={6}>
                    <div className={styles.testimonialWrapper}>
                      {/* Back Layer */}
                      <div className={styles.blueShadowLayer}>
                        <img
                          src={rectDark}
                          alt=""
                          className={styles.blueShadowSvg}
                        />
                      </div>

                      {/* Front Layer */}
                      <div className={styles.orangeCardLayer}>
                        <img
                          src={rectTeal}
                          alt=""
                          className={styles.orangeCardSvg}
                        />

                        {/* Quotation Marks */}
                        <img
                          src={quoteOpen}
                          alt=""
                          className={styles.quoteOpenSvg}
                        />
                        <img
                          src={quoteClose}
                          alt=""
                          className={styles.quoteCloseSvg}
                        />

                        {/* Default Content - Review text + Name */}
                        <div className={styles.defaultContent}>
                          <p className={styles.testimonialText}>
                            {review.reviewText}
                          </p>
                          <div className={styles.reviewerNameDefault}>
                            — {review.reviewerName}
                          </div>
                        </div>

                        {/* Hover Content - Full Details */}
                        <div className={styles.hoverContent}>
                          <div className={styles.reviewerName}>
                            {review.reviewerName}
                          </div>
                          {review.courseName && (
                            <div className={styles.courseName}>
                              {review.courseName}
                            </div>
                          )}
                          {review.rating && (
                            <div className={styles.rating}>
                              {renderStars(review.rating)}
                            </div>
                          )}
                          {review.createdAt && (
                            <div className={styles.reviewDate}>
                              {formatDate(review.createdAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Row>
              <Col className="text-center">
                <p>No reviews yet. Be the first to share your experience!</p>
              </Col>
            </Row>
          )}

          {/* CTA to view all reviews */}
          <Row className="mt-5">
            <Col className="text-center">
              <Button
                as={Link}
                to="/reviews"
                className={styles.viewAllReviewsBtn}
              >
                View All Reviews
                <i className="fas fa-arrow-right ms-2"></i>
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Download App Section - Trade On The Go */}
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
            {/* Left Side - Features & Buttons */}
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className={styles.appContent}>
                {/* Feature Cards */}
                <div className={styles.appFeatures}>
                  <div className={styles.appFeature}>
                    <div className={styles.featureIconBox}>
                      <i className="fa-solid fa-bell"></i>
                    </div>
                    <div className={styles.featureText}>
                      <strong>Real-time Alerts</strong>
                      <span>Instant market notifications</span>
                    </div>
                  </div>

                  <div className={styles.appFeature}>
                    <div className={styles.featureIconBox}>
                      <i className="fa-solid fa-chart-line"></i>
                    </div>
                    <div className={styles.featureText}>
                      <strong>Live Charts</strong>
                      <span>Advanced technical analysis</span>
                    </div>
                  </div>

                  <div className={styles.appFeature}>
                    <div className={styles.featureIconBox}>
                      <i className="fa-solid fa-bolt"></i>
                    </div>
                    <div className={styles.featureText}>
                      <strong>Quick Orders</strong>
                      <span>Execute trades in seconds</span>
                    </div>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className={styles.downloadButtons}>
                  <a href="#" className={styles.storeButton}>
                    <i className="fa-brands fa-apple"></i>
                    <div className={styles.storeText}>
                      <span>Download on the</span>
                      <strong>App Store</strong>
                    </div>
                  </a>

                  <a
                    href="https://play.google.com/store/apps/details?id=com.cybomb.djit_trading"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.storeButton}
                  >
                    <i className="fa-brands fa-google-play"></i>
                    <div className={styles.storeText}>
                      <span>Get it on</span>
                      <strong>Google Play</strong>
                    </div>
                  </a>
                </div>
              </div>
            </Col>

            {/* Right Side - Phone Mockup with Orange Background */}
            <Col lg={6}>
              <div className={styles.phoneContainer}>
                {/* Orange Background Rectangle */}
                <div className={styles.orangePhoneBg}>
                  {/* Phone Frame */}
                  <div className={styles.phoneFrame}>
                    <div className={styles.phoneScreen}>
                      <div className={styles.screenContent}>
                        {/* App Header */}
                        <div className={styles.appHeader}>
                          <div className={styles.appLogo}>DJIT</div>
                          <div className={styles.marketStatus}>
                            <span className={styles.liveDot}></span>
                            Live
                          </div>
                        </div>

                        {/* Stock Ticker */}
                        <div className={styles.stockTicker}>
                          <div className={styles.stockItem}>
                            <span className={styles.stockSymbol}>NIFTY</span>
                            <span className={styles.stockPrice}>22,415.25</span>
                            <span className={styles.stockChange}>+1.2%</span>
                          </div>
                          <div className={styles.stockItem}>
                            <span className={styles.stockSymbol}>SENSEX</span>
                            <span className={styles.stockPrice}>73,805.64</span>
                            <span className={styles.stockChange}>+0.8%</span>
                          </div>
                        </div>

                        {/* Chart Placeholder */}
                        <div className={styles.chartPlaceholder}></div>

                        {/* Quick Actions */}
                        <div className={styles.quickActions}>
                          <button className={styles.actionBtn}>Buy</button>
                          <button className={styles.actionBtn}>Sell</button>
                          <button className={styles.actionBtn}>Chart</button>
                          <button className={styles.actionBtn}>Watchlist</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alert Notification Card */}
                  <div className={styles.alertCard}>
                    <div className={styles.alertIcon}>
                      <i className="fa-solid fa-bell"></i>
                    </div>
                    <div className={styles.alertText}>
                      <strong>Alert: NIFTY</strong>
                      <span>Breakout detected</span>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section - Ready to Master */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBackground}>
          {/* Orange Circle Decoration */}
          <div className={styles.orangeCircle}></div>
        </div>
        <Container>
          <Row className="text-center">
            <Col lg={8} className="mx-auto">
              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>
                  Ready to Master Stock Market Trading?
                </h2>
                <p className={styles.ctaSubtitle}>
                  Join 10,000+ successful traders who transformed their skills and achieved financial freedom with DJIT Trading
                </p>
                <div className={styles.ctaButtons}>
                  <Link
                    to="/courses"
                    className={styles.primaryCta}
                  >
                    Explore All Courses
                  </Link>
                  <Link
                    to="/register"
                    className={styles.secondaryCta}
                  >
                    Start Growing Today
                  </Link>
                </div>
                <div className={styles.trustBadges}>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>
                    </span>
                    Premium Content
                  </span>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>
                      <i className="fa-solid fa-star"></i>
                    </span>
                    4.8/5 Rating
                  </span>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>

                    </span>
                    10K+ Students
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      {/* Enroll Confirmation Modal */}
      < Modal
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
      </Modal >
    </div >
  );
};

export default Home;