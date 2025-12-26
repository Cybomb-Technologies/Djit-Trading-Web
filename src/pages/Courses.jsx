import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  InputGroup,
  Alert,
  Spinner,
  Modal,
  ProgressBar,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import EnrollModal from "./EnrollModal";
import styles from "./Courses.module.css";
import CourseDisclaimer from "./Courses-disclaime";
import {
  Package,
  BarChart,
  Zap,
  FileText,
  Info,
  AlertTriangle,
  Gift,
  Rocket,
  GraduationCap,
  BookOpen,
  Check,
  Layout,
  Clock,
  Users,
  Globe
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Get user ID helper function
  const getUserId = () => {
    return user?.id || user?._id || user?.userId;
  };

  useEffect(() => {
    fetchCourses();
    if (isAuthenticated) {
      fetchEnrolledCourses();
    } else {
      setEnrollmentsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterCourses();
  }, [courses, enrolledCourses, searchTerm, categoryFilter, levelFilter]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`);
      setCourses(response.data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      showAlert("Error loading courses", "danger");

      // Fallback mock data if API fails
      const mockCourses = [
        {
          _id: "mock_djit_hunter",
          title: "Djit Hunter - Master Entry Course",
          description: "DJIT Hunter – Master Entry Course is a specialized trading program designed to help you identify high-probability entry points in the market.",
          thumbnail: "",
          level: "Advanced",
          featured: true,
          price: 9999,
          instructor: "Dev",
          duration: "8 Weeks",
          lessons: 15,
          studentsEnrolled: 118,
          category: "Trading"
        }
      ];
      setCourses(mockCourses);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      setEnrollmentsLoading(true);
      const token = localStorage.getItem("token");
      const userId = getUserId();

      if (!userId) {
        console.error("User ID not found");
        setEnrollmentsLoading(false);
        return;
      }

      console.log("Fetching enrollments for user:", userId);

      // Use the endpoint that works from your Traders component
      const response = await axios.get(
        `
${API_URL}/api/enrollments/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Enrollments response:", response.data);

      // Handle different response structures
      const enrollments = response.data.enrollments || response.data || [];
      setEnrolledCourses(enrollments);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);

      // If the main endpoint fails, try alternatives
      if (error.response?.status === 404) {
        console.log("Primary endpoint failed, trying alternatives...");
        await tryAlternativeEndpoints();
      } else {
        showAlert("Unable to load your enrolled courses", "warning");
      }
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const tryAlternativeEndpoints = async () => {
    const token = localStorage.getItem("token");
    const userId = getUserId();

    try {
      // Try the endpoint from your Traders component
      const response = await axios.get(
        `
${API_URL}/api/enrollments/user/${getUserId()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const enrollments = response.data.enrollments || response.data || [];
      setEnrolledCourses(enrollments);
      console.log("Alternative endpoint succeeded");
    } catch (altError) {
      console.error("Alternative endpoint also failed:", altError);

      // Final fallback - try to get all enrollments and filter
      try {
        const allResponse = await axios.get(
          `
${API_URL}/api/enrollments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const allEnrollments =
          allResponse.data.enrollments || allResponse.data || [];
        const userEnrollments = allEnrollments.filter((enrollment) => {
          const enrollmentUserId = enrollment.user?._id || enrollment.user;
          return enrollmentUserId === userId;
        });

        setEnrolledCourses(userEnrollments);
        console.log("Fallback filtering succeeded");
      } catch (finalError) {
        console.error("All enrollment endpoints failed:", finalError);
        setEnrolledCourses([]); // Set empty array to avoid errors
      }
    }
  };

  const fetchCourseDetails = async (courseId) => {
    try {
      setLoadingDetails(true);
      const response = await axios.get(`
      ${API_URL}/api/courses/${courseId}/details`);
      setCourseDetails(response.data.course);
    } catch (error) {
      console.error("Error fetching course details:", error);
      showAlert("Error loading course details", "danger");
      const basicCourse = courses.find((course) => course._id === courseId);
      setCourseDetails(basicCourse);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(
        (course) => course.category === categoryFilter
      );
    }

    if (levelFilter) {
      filtered = filtered.filter((course) => course.level === levelFilter);
    }

    setFilteredCourses(filtered);
  };

  // Check if user is enrolled in a course and get enrollment data
  const getEnrollmentData = (courseId) => {
    return enrolledCourses.find((enrollment) => {
      const enrollmentCourseId = enrollment.course?._id || enrollment.course;
      return enrollmentCourseId === courseId;
    });
  };

  const isUserEnrolled = (courseId) => {
    return !!getEnrollmentData(courseId);
  };

  const getCourseProgress = (courseId) => {
    const enrollment = getEnrollmentData(courseId);
    return enrollment ? enrollment.progress || 0 : 0;
  };

  const isCourseCompleted = (courseId) => {
    const enrollment = getEnrollmentData(courseId);
    return enrollment ? enrollment.completed || false : false;
  };

  const handleEnrollClick = (course) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/courses" } });
      return;
    }

    // If user is already enrolled, go directly to learning page
    if (isUserEnrolled(course._id)) {
      navigate(`/learning/${course._id}`);
      return;
    }

    // Otherwise show enroll modal
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  const handleViewDetails = async (course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
    await fetchCourseDetails(course._id);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCourse(null);
    setCourseDetails(null);
  };

  const handleEnrollSuccess = () => {
    setShowEnrollModal(false);
    setSelectedCourse(null);
    // Refresh enrolled courses after successful enrollment
    if (isAuthenticated) {
      fetchEnrolledCourses();
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

  const getEnrollButtonText = (course) => {
    if (!isAuthenticated) return "Enroll Now";

    if (isUserEnrolled(course._id)) {
      return "Course Enrolled";
    } else {
      return "Enroll Now";
    }
  };

  const getEnrollButtonVariant = (course) => {
    if (!isAuthenticated) return isCourseFree(course) ? "success" : "primary";

    if (isUserEnrolled(course._id)) {
      return "success";
    } else {
      return isCourseFree(course) ? "success" : "primary";
    }
  };

  const getEnrollButtonIcon = (course) => {
    if (!isAuthenticated) return isCourseFree(course) ? <Gift size={18} /> : <Rocket size={18} />;

    if (isUserEnrolled(course._id)) {
      return <Check size={18} />;
    } else {
      return isCourseFree(course) ? <Gift size={18} /> : <Rocket size={18} />;
    }
  };

  const categories = [...new Set(courses.map((course) => course.category))];
  const levels = ["Beginner", "Intermediate", "Advanced"];

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

  const getProgressVariant = (progress) => {
    if (progress === 100) return "success";
    if (progress >= 50) return "primary";
    if (progress > 0) return "warning";
    return "secondary";
  };

  // Course Details Modal Component with Icons
  const CourseDetailsModal = ({
    show,
    onHide,
    course,
    courseDetails,
    loadingDetails,
  }) => {
    // Use courseDetails if available, otherwise fallback to basic course data
    const displayCourse = courseDetails || course;

    if (!displayCourse) return null;

    const isEnrolled = isUserEnrolled(course._id);
    const progress = getCourseProgress(course._id);
    const isCompleted = isCourseCompleted(course._id);

    return (
      <Modal
        show={show}
        onHide={onHide}
        size="lg"
        centered
        dialogClassName={styles.customModal}
        className={styles.modalTopLayer}
      >
        <Modal.Header closeButton>
          <Modal.Title>{displayCourse.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetails ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading course details...</p>
            </div>
          ) : (
            <>
              <Row>
                <Col md={6}>
                  <div className={styles.modalImage}>
                    {displayCourse.thumbnail ? (
                      <img
                        src={displayCourse.thumbnail}
                        alt={displayCourse.title}
                        className="img-fluid rounded"
                      />
                    ) : (
                      <div
                        className={`${styles.imagePlaceholder} ${styles.modalPlaceholder}`}
                      >
                        {displayCourse.title.charAt(0)}
                      </div>
                    )}
                    <div className="mt-3">
                      <Badge
                        bg={getLevelVariant(displayCourse.level)}
                        className="me-2"
                      >
                        {displayCourse.level}
                      </Badge>
                      {displayCourse.featured && (
                        <Badge bg="primary" className="me-2">
                          Featured
                        </Badge>
                      )}
                      {isCourseFree(displayCourse) && (
                        <Badge bg="success">Free</Badge>
                      )}
                      {isEnrolled && (
                        <Badge
                          bg={isCompleted ? "success" : "primary"}
                          className="ms-2"
                        >
                          {isCompleted ? "Completed" : "Enrolled"}
                        </Badge>
                      )}
                    </div>

                    {/* Progress bar for enrolled users */}
                    {isEnrolled && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted">Your Progress</small>
                          <small className="fw-bold">{progress}%</small>
                        </div>
                        <ProgressBar
                          now={progress}
                          variant={getProgressVariant(progress)}
                          style={{ height: "6px" }}
                        />
                      </div>
                    )}
                  </div>
                </Col>
                <Col md={6}>
                  <div className={styles.modalContent}>
                    <h5 className="mb-3">Course Details</h5>

                    {/* Icon-based Course Meta Information */}
                    <div className={styles.modalMetaGrid}>
                      <div className={styles.modalMetaItem}>
                        <div className={styles.modalMetaIcon}>
                          <Users size={20} />
                        </div>
                        <div className={styles.modalMetaText}>
                          <div className={styles.modalMetaLabel}>Instructor</div>
                          <div className={styles.modalMetaValue}>
                            {displayCourse.instructor}
                          </div>
                        </div>
                      </div>

                      <div className={styles.modalMetaItem}>
                        <div className={styles.modalMetaIcon}>
                          <Layout size={20} />
                        </div>
                        <div className={styles.modalMetaText}>
                          <div className={styles.modalMetaLabel}>Category</div>
                          <div className={styles.modalMetaValue}>
                            {displayCourse.category}
                          </div>
                        </div>
                      </div>

                      <div className={styles.modalMetaItem}>
                        <div className={styles.modalMetaIcon}>
                          <Clock size={20} />
                        </div>
                        <div className={styles.modalMetaText}>
                          <div className={styles.modalMetaLabel}>Duration</div>
                          <div className={styles.modalMetaValue}>
                            {displayCourse.duration}
                          </div>
                        </div>
                      </div>

                      <div className={styles.modalMetaItem}>
                        <div className={styles.modalMetaIcon}>
                          <BookOpen size={20} />
                        </div>
                        <div className={styles.modalMetaText}>
                          <div className={styles.modalMetaLabel}>Lessons</div>
                          <div className={styles.modalMetaValue}>
                            {displayCourse.lessons}
                          </div>
                        </div>
                      </div>

                      <div className={styles.modalMetaItem}>
                        <div className={styles.modalMetaIcon}>
                          <Globe size={20} />
                        </div>
                        <div className={styles.modalMetaText}>
                          <div className={styles.modalMetaLabel}>Language</div>
                          <div className={styles.modalMetaValue}>
                            {displayCourse.language || "Tamil"}
                          </div>
                        </div>
                      </div>

                      <div className={styles.modalMetaItem}>
                        <div className={styles.modalMetaIcon}>
                          <Rocket size={20} />
                        </div>
                        <div className={styles.modalMetaText}>
                          <div className={styles.modalMetaLabel}>Delivery Time</div>
                          <div className={styles.modalMetaValue}>
                            {displayCourse.deliveryTime || "48 Working Hours"}
                          </div>
                        </div>
                      </div>

                      <div className={styles.modalMetaItem}>
                        <div className={styles.modalMetaIcon}>
                          <GraduationCap size={20} />
                        </div>
                        <div className={styles.modalMetaText}>
                          <div className={styles.modalMetaLabel}>
                            Students Enrolled
                          </div>
                          <div className={styles.modalMetaValue}>
                            {displayCourse.studentsEnrolled}
                          </div>
                        </div>
                      </div>

                      <div className={styles.modalMetaItem}>
                        <div className={styles.modalMetaIcon}>
                          <span className={styles.priceIcon}>
                            ₹
                          </span>
                        </div>
                        <div className={styles.modalMetaText}>
                          <div className={styles.modalMetaLabel}>Price</div>
                          <div className={styles.modalMetaValue}>
                            {isCourseFree(displayCourse) ? (
                              <span className="text-success fw-bold">Free</span>
                            ) : (
                              <>
                                <span className="fw-bold">
                                  ₹
                                  {displayCourse.discountedPrice ||
                                    displayCourse.price}
                                </span>
                                {displayCourse.discountedPrice && (
                                  <span className="text-muted text-decoration-line-through ms-2 small">
                                    ₹{displayCourse.price}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Steps Section */}
              {displayCourse.steps && displayCourse.steps.length > 0 && (
                <div className="mt-4">
                  <div className={styles.modalSectionTitle}>
                    Course Structure
                  </div>
                  <div className={styles.stepsList}>
                    <div className="d-flex align-items-center mb-2">
                      <Badge bg="primary" className="me-2">
                        {displayCourse.steps.length} Steps
                      </Badge>
                    </div>
                    <div className={styles.stepsList}>
                      {displayCourse.steps.map((step, index) => (
                        <div key={index} className={styles.stepItem}>
                          <span className={styles.stepNumber}>{index + 1}</span>
                          <span className={styles.stepText}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Course Contains Section */}
              {displayCourse.courseContains &&
                displayCourse.courseContains.length > 0 && (
                  <div className="mt-4">
                    <div className="d-flex align-items-center mb-3">
                      <span className={`${styles.sectionIcon} me-2`}><Package size={20} /></span>
                      <h6 className="mb-0">Course Modules</h6>
                    </div>
                    <div className={styles.featuresList}>
                      {displayCourse.courseContains.map((item, index) => (
                        <div key={index} className={styles.featureItem}>
                          <span className={styles.featureIcon}><Check size={16} /></span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Indicators Section */}
              {displayCourse.indicators &&
                displayCourse.indicators.length > 0 && (
                  <div className="mt-4">
                    <div className="d-flex align-items-center mb-3">
                      <span className={`${styles.sectionIcon} me-2`}><BarChart size={20} /></span>
                      <h6 className="mb-0">Indicators You Will Get</h6>
                    </div>
                    <div className={styles.indicatorsList}>
                      {displayCourse.indicators.map((indicator, index) => (
                        <div key={index} className={styles.indicatorItem}>
                          <div className={styles.indicatorHeader}>
                            <span className={styles.indicatorIcon}><Zap size={16} /></span>
                            <strong className={styles.indicatorName}>
                              {indicator.name}
                            </strong>
                          </div>
                          <p className={styles.indicatorDescription}>
                            {indicator.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Notes Section */}
              {displayCourse.notes && displayCourse.notes.length > 0 && (
                <div className="mt-4">
                  <div className="d-flex align-items-center mb-3">
                    <span className={`${styles.sectionIcon} me-2`}><FileText size={20} /></span>
                    <h6 className="mb-0">Notes You Will Get</h6>
                  </div>
                  <div className={styles.notesList}>
                    {displayCourse.notes.map((note, index) => (
                      <div key={index} className={styles.noteItem}>
                        <span className={styles.noteIcon}><FileText size={16} /></span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Description */}
              {displayCourse.detailedDescription && (
                <div className="mt-4">
                  <div className="d-flex align-items-center mb-3">
                    <span className={`${styles.sectionIcon} me-2`}><Info size={20} /></span>
                    <h6 className="mb-0">About This Course</h6>
                  </div>
                  <div className={styles.descriptionContent}>
                    <p>{displayCourse.detailedDescription}</p>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              {displayCourse.disclaimer && (
                <div className="mt-4 p-3 bg-light rounded">
                  <div className="d-flex align-items-center mb-2">
                    <span className={`${styles.sectionIcon} me-2`}><AlertTriangle size={20} /></span>
                    <h6 className="mb-0">Important Notice</h6>
                  </div>
                  <p className="mb-0 small">{displayCourse.disclaimer}</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>
            Close
          </Button>
          <Button
            variant={getEnrollButtonVariant(displayCourse)}
            onClick={() => {
              onHide();
              handleEnrollClick(displayCourse);
            }}
            disabled={loadingDetails}
            className={styles.enrollButton}
          >
            <span className="me-2">{getEnrollButtonIcon(displayCourse)}</span>
            {getEnrollButtonText(displayCourse)}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <div className={styles.coursesPage}>
      {/* Enhanced Header Section */}
      {/* Enhanced Header Section */}
      {/* Search and Filters - Custom Design (Full Width) */}
      <div className={styles.searchFilterSection}>
        <Container>
          <div className={styles.searchContentContainer}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInputCustom}
                placeholder="Search courses, instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className={styles.searchCustomBtn}>
                <i className="fa-solid fa-search"></i>
              </button>
            </div>

            <div className={styles.filterWrapper}>
              <select
                className={styles.customSelect}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                className={styles.customSelect}
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="">All Levels</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Container>
      </div>
      <Container>
        {/* Alert */}
        {alert.show && (
          <Alert
            variant={alert.type}
            dismissible
            onClose={() => setAlert({ show: false, message: "", type: "" })}
          >
            {alert.message}
          </Alert>
        )}

        {/* Loading indicator for enrollments */}
        {isAuthenticated && enrollmentsLoading && (
          <div className="text-center mb-3">
            <Spinner animation="border" size="sm" variant="primary" />
            <span className="ms-2">Loading your enrollments...</span>
          </div>
        )}


        {/* Results Count */}
        <Row className="mb-4">
          <Col>
            <div className={styles.resultsInfo}>
              Showing {filteredCourses.length} of {courses.length} courses
              {isAuthenticated && !enrollmentsLoading && (
                <span className="text-muted ms-2">
                  • {enrolledCourses.length} enrolled
                </span>
              )}
            </div>
          </Col>
        </Row>

        {/* Courses Grid */}
        <Row>
          {loading ? (
            <Col className="text-center">
              <div className={styles.loading}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading courses...</p>
              </div>
            </Col>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course) => {
              const isEnrolled = isUserEnrolled(course._id);
              const progress = getCourseProgress(course._id);
              const isCompleted = isCourseCompleted(course._id);

              return (
                <Col lg={12} key={course._id} className="mb-5">
                  <div
                    className={styles.courseCardWide}
                    onClick={() => handleViewDetails(course)}
                    style={{ cursor: 'pointer' }}
                  >

                    {/* LEFT SIDE: IMAGE & BADGE */}
                    <div className={styles.cardImageSection}>
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className={styles.cardImage}
                        />
                      ) : (
                        <div className={`${styles.imagePlaceholder} ${styles.cardImage}`}>
                          {course.title.charAt(0)}
                        </div>
                      )}

                      <span className={styles.badgeAdvanced}>
                        {course.level || "Advanced"}
                      </span>

                    </div>

                    {/* RIGHT SIDE: CONTENT */}
                    <div className={styles.cardContentSection}>
                      <div>
                        <h3 className={styles.cardTitle}>{course.title}</h3>
                        <p className={styles.cardDescription}>
                          {course.description.substring(0, 150)}...
                        </p>

                        {/* META GRID */}
                        <div className={styles.metaGrid}>
                          <div className={styles.metaItem}>
                            <i className={`fa-solid fa-chalkboard-user ${styles.metaIcon}`}></i>
                            <div className={styles.metaText}>
                              <span className={styles.metaLabel}>Instructor</span>
                              <span className={styles.metaValue}>{course.instructor || "Dev"}</span>
                            </div>
                          </div>

                          <div className={styles.metaItem}>
                            <i className={`fa-solid fa-stopwatch ${styles.metaIcon}`}></i>
                            <div className={styles.metaText}>
                              <span className={styles.metaLabel}>Duration</span>
                              <span className={styles.metaValue}>{course.duration || "8 Weeks"}</span>
                            </div>
                          </div>

                          <div className={styles.metaItem}>
                            <i className={`fa-solid fa-book-open ${styles.metaIcon}`}></i>
                            <div className={styles.metaText}>
                              <span className={styles.metaLabel}>Lessons</span>
                              <span className={styles.metaValue}>{course.lessons || "15"}</span>
                            </div>
                          </div>

                          <div className={styles.metaItem}>
                            <i className={`fa-solid fa-users ${styles.metaIcon}`}></i>
                            <div className={styles.metaText}>
                              <span className={styles.metaLabel}>Students</span>
                              <span className={styles.metaValue}>{course.studentsEnrolled || "118"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PRICE & ACTION */}
                      <div className={styles.priceSectionWide}>
                        <div className={styles.priceWide}>
                          ₹{course.discountedPrice || course.price}
                        </div>
                        {course.discountedPrice && (
                          <div className={styles.originalPriceWide}>
                            ₹{course.price}
                          </div>
                        )}
                        <button
                          className={styles.viewDetailsBtnWide}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(course);
                          }}
                        >
                          View Details
                        </button>
                      </div>

                    </div>

                    {/* ENROLL BOTTOM BAR */}
                    <div
                      className={`${styles.enrollBottomBar} ${isEnrolled ? styles.enrolled : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnrollClick(course);
                      }}
                      style={isEnrolled ? { background: '#28a745' } : {}}
                    >
                      <span className="me-2">{getEnrollButtonIcon(course)}</span>
                      {getEnrollButtonText(course).toUpperCase()}
                      {!isEnrolled && <i className="fa-solid fa-arrow-right-to-bracket ms-2"></i>}
                    </div>
                  </div>
                </Col>
              );
            })
          ) : (
            <Col className="text-center">
              <div className={styles.noResults}>
                <h4>No courses found</h4>
                <p>Try adjusting your search criteria</p>
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("");
                    setLevelFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Col>
          )}
        </Row>

        {/* Enroll Modal */}
        <EnrollModal
          show={showEnrollModal}
          onHide={() => setShowEnrollModal(false)}
          course={selectedCourse}
          onEnrollSuccess={handleEnrollSuccess}
          showAlert={showAlert}
        />

        {/* Course Details Modal */}
        <CourseDetailsModal
          show={showDetailsModal}
          onHide={handleCloseDetailsModal}
          course={selectedCourse}
          courseDetails={courseDetails}
          loadingDetails={loadingDetails}
        />

      </Container>

      {/* Important Notice Section */}
      <div className={styles.importantNotice}>
        <div className={styles.noticeHeaderContainer}>
          <div className={styles.warningIcon}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div className={styles.noticeTitle}>Important Note</div>
          <div className={styles.noticeSubtitle}>
            Must Read Before Making a Purchase
          </div>
        </div>

        <div className={styles.noticeList}>
          {/* Item 1 */}
          <div className={styles.noticeItem}>
            <div className={`${styles.noticeIcon} ${styles.iconBlue}`}>
              <i className="fa-solid fa-book"></i>
            </div>
            <div className={styles.noticeTextContent}>
              <span className={styles.itemTitle}>Educational Purpose Only</span>
              <p className={styles.itemDescription}>
                This course is offered solely for educational purposes and is
                intended for beginners who wish to learn about the Trading and
                indicators I use. Participation in this course is voluntary—you
                are not required or pressured to enroll. By purchasing, you
                acknowledge and agree that no refunds will be granted once
                access is provided. Trading involves inherent risk and may not
                be suitable for everyone. Any examples, techniques, or
                strategies discussed are for demonstration only and do not
                constitute financial or investment advice. Always conduct your
                own research or consult a licensed professional before making
                trading decisions.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className={styles.noticeItem}>
            <div className={`${styles.noticeIcon} ${styles.iconRed}`}>
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <div className={styles.noticeTextContent}>
              <span className={`${styles.itemTitle} ${styles.red}`}>
                IMPORTANT
              </span>
              <p className={styles.itemDescription}>
                WE DIDN'T PROVIDE ANY KIND OF TIPS OR CALLS ARE SUGGESTIONS TO
                ANYONE. The courses are only for educational purpose. If you
                purchasing this courses for tips kindly don't waste your money
                and time.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className={styles.noticeItem}>
            <div className={`${styles.noticeIcon} ${styles.iconTeal}`}>
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div className={styles.noticeTextContent}>
              <span className={styles.itemTitle}>No Profit Guarantee</span>
              <p className={styles.itemDescription}>
                This courses are only for educational purpose. We don't give you
                the guarantee if you purchase this course you will be
                profitable. But you will know about our trading strategy and
                more.
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Courses;
