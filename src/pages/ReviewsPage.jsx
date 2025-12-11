import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Spinner,
  Alert,
  Badge,
  Pagination,
  Dropdown,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import styles from "./ReviewsPage.module.css";
import {
  StarFill,
  Star,
  Search,
  Filter,
  SortAlphaDown,
  SortAlphaUp,
  SortNumericDown,
  SortNumericUp,
  Calendar,
} from "react-bootstrap-icons";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  const reviewsPerPage = 9;

  useEffect(() => {
    fetchReviews();
    fetchReviewStats();
  }, [currentPage, sortBy, filterCourse, filterRating]);

  useEffect(() => {
    if (searchTerm) {
      const delayDebounceFn = setTimeout(() => {
        fetchReviews();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      fetchReviews();
    }
  }, [searchTerm]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build sort parameter
      let sortParam = "-createdAt"; // Default: newest first
      if (sortBy === "oldest") sortParam = "createdAt";
      if (sortBy === "highest") sortParam = "-rating";
      if (sortBy === "lowest") sortParam = "rating";
      if (sortBy === "name_asc") sortParam = "reviewerName";
      if (sortBy === "name_desc") sortParam = "-reviewerName";

      const response = await axios.get(`${API_URL}/api/reviews`, {
        params: {
          page: currentPage,
          limit: reviewsPerPage,
          sortBy: sortParam,
          courseName: filterCourse !== "all" ? filterCourse : undefined,
          rating: filterRating !== "all" ? filterRating : undefined,
          search: searchTerm || undefined,
        },
      });

      if (response.data.success) {
        setReviews(response.data.data || []);
        setTotalReviews(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);

        // Extract unique courses
        const uniqueCourses = [
          ...new Set(
            response.data.data
              .map((review) => review.courseName)
              .filter((course) => course && course !== "")
          ),
        ];
        setCourses(uniqueCourses);
      } else {
        setError("Failed to load reviews");
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError(
        error.response?.data?.message || "Unable to load reviews at the moment."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reviews`);
      if (response.data.success && response.data.data) {
        const allReviews = response.data.data;
        const total = allReviews.length;
        const averageRating =
          allReviews.reduce((sum, review) => sum + review.rating, 0) / total;

        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allReviews.forEach((review) => {
          ratingDistribution[review.rating] =
            (ratingDistribution[review.rating] || 0) + 1;
        });

        setStats({
          total,
          averageRating: parseFloat(averageRating.toFixed(1)),
          ratingDistribution,
        });
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (type, value) => {
    if (type === "course") setFilterCourse(value);
    if (type === "rating") setFilterRating(value);
    if (type === "sort") setSortBy(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterCourse("all");
    setFilterRating("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const renderStars = (rating) => {
    return (
      <div className={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? styles.starFilled : styles.starEmpty}
          >
            {star <= rating ? <StarFill /> : <Star />}
          </span>
        ))}
        <span className={styles.ratingNumber}>{rating.toFixed(1)}</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "DJ";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className={styles.reviewsPage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={10}>
              <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>Student Reviews & Testimonials</h1>
                <p className={styles.heroSubtitle}>
                  Real experiences from our trading community. Read what thousands of students
                  have to say about their journey with DJIT Trading.
                </p>
                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <strong>{stats.total.toLocaleString()}+</strong>
                    <span>Reviews</span>
                  </div>
                  <div className={styles.heroStat}>
                    <strong>{stats.averageRating}/5</strong>
                    <span>Average Rating</span>
                  </div>
                  <div className={styles.heroStat}>
                    <strong>{courses.length}+</strong>
                    <span>Courses Reviewed</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Filters Section */}
      <section className={styles.filtersSection}>
        <Container>
          <Card className={styles.filtersCard}>
            <Card.Body>
              <Row className="align-items-center">
                <Col md={12} lg={4} className="mb-3 mb-lg-0">
                  <InputGroup>
                    <InputGroup.Text className={styles.searchIcon}>
                      <Search />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search reviews, students, or courses..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className={styles.searchInput}
                    />
                  </InputGroup>
                </Col>

                <Col md={6} lg={2} className="mb-3 mb-md-0">
                  <Form.Select
                    value={filterCourse}
                    onChange={(e) => handleFilterChange("course", e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Courses</option>
                    <option value="General Platform Review">General Platform</option>
                    {courses.map((course, index) => (
                      <option key={index} value={course}>
                        {course}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={6} lg={2} className="mb-3 mb-md-0">
                  <Form.Select
                    value={filterRating}
                    onChange={(e) => handleFilterChange("rating", e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    <option value="3">⭐⭐⭐ 3 Stars</option>
                    <option value="2">⭐⭐ 2 Stars</option>
                    <option value="1">⭐ 1 Star</option>
                  </Form.Select>
                </Col>

                <Col md={6} lg={2} className="mb-3 mb-md-0">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-primary" className={styles.sortDropdown}>
                      {sortBy === "newest" && <>Newest <SortAlphaDown /></>}
                      {sortBy === "oldest" && <>Oldest <SortAlphaUp /></>}
                      {sortBy === "highest" && <>Highest Rated <SortNumericDown /></>}
                      {sortBy === "lowest" && <>Lowest Rated <SortNumericUp /></>}
                      {sortBy === "name_asc" && <>Name A-Z <SortAlphaDown /></>}
                      {sortBy === "name_desc" && <>Name Z-A <SortAlphaUp /></>}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleFilterChange("sort", "newest")}>
                        <SortAlphaDown className="me-2" /> Newest First
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange("sort", "oldest")}>
                        <SortAlphaUp className="me-2" /> Oldest First
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange("sort", "highest")}>
                        <SortNumericDown className="me-2" /> Highest Rated
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange("sort", "lowest")}>
                        <SortNumericUp className="me-2" /> Lowest Rated
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange("sort", "name_asc")}>
                        <SortAlphaDown className="me-2" /> Name A-Z
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange("sort", "name_desc")}>
                        <SortAlphaUp className="me-2" /> Name Z-A
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>

                <Col md={6} lg={2}>
                  <Button
                    variant="outline-secondary"
                    onClick={handleClearFilters}
                    className={styles.clearButton}
                  >
                    <Filter className="me-2" />
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Container>
      </section>

      {/* Main Content */}
      <section className={styles.reviewsSection}>
        <Container>
          {error && (
            <Alert variant="danger" className="mb-4">
              <strong>Error:</strong> {error}
            </Alert>
          )}

          {loading ? (
            <div className={styles.loadingContainer}>
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className={styles.noReviews}>
              <div className={styles.noReviewsIcon}>
                <Search size={48} />
              </div>
              <h4>No reviews found</h4>
              <p className="text-muted">
                {searchTerm || filterCourse !== "all" || filterRating !== "all"
                  ? "Try adjusting your search or filters"
                  : "Be the first to share your experience!"}
              </p>
              <Button
                as={Link}
                to="/"
                variant="primary"
                className={styles.submitReviewBtn}
              >
                Submit Your Review
              </Button>
            </div>
          ) : (
            <>
              {/* Rating Distribution */}
              <Card className={styles.statsCard}>
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={4}>
                      <div className={styles.averageRating}>
                        <h2>{stats.averageRating}</h2>
                        <div className={styles.ratingStars}>
                          {renderStars(Math.round(stats.averageRating))}
                        </div>
                        <p className={styles.ratingText}>
                          Based on {stats.total} reviews
                        </p>
                      </div>
                    </Col>
                    <Col md={8}>
                      <div className={styles.ratingBars}>
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = stats.ratingDistribution[rating] || 0;
                          const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                          return (
                            <div key={rating} className={styles.ratingBar}>
                              <div className={styles.ratingLabel}>
                                <span>{rating} star</span>
                                <span>{count}</span>
                              </div>
                              <div className={styles.progressBar}>
                                <div
                                  className={styles.progressFill}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Reviews Grid */}
              <Row>
                {reviews.map((review) => (
                  <Col lg={4} md={6} key={review._id} className="mb-4">
                    <Card className={styles.reviewCard}>
                      <Card.Body>
                        {/* Review Header */}
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewerAvatar}>
                            {getInitials(review.reviewerName)}
                          </div>
                          <div className={styles.reviewerInfo}>
                            <h6 className={styles.reviewerName}>
                              {review.reviewerName}
                              {review.anonymous && (
                                <Badge bg="secondary" className="ms-2">
                                  Anonymous
                                </Badge>
                              )}
                            </h6>
                            <div className={styles.reviewMeta}>
                              <span className={styles.reviewDate}>
                                <Calendar size={12} className="me-1" />
                                {formatDate(review.createdAt)}
                              </span>
                              <Badge bg="light" text="dark" className={styles.courseBadge}>
                                {review.courseName}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className={styles.reviewRating}>
                          {renderStars(review.rating)}
                        </div>

                        {/* Review Title */}
                        {review.title && (
                          <h6 className={styles.reviewTitle}>{review.title}</h6>
                        )}

                        {/* Review Text */}
                        <p className={styles.reviewText}>
                          "{truncateText(review.reviewText)}"
                        </p>

                        {/* Read More Link */}
                        {review.reviewText.length > 150 && (
                          <Button
                            variant="link"
                            className={styles.readMoreBtn}
                            onClick={() => {
                              // Implement modal or expand functionality
                              alert(review.reviewText);
                            }}
                          >
                            Read full review →
                          </Button>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <Pagination className={styles.pagination}>
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    />
                    {[...Array(totalPages)].map((_, i) => (
                      <Pagination.Item
                        key={i + 1}
                        active={i + 1 === currentPage}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    />
                  </Pagination>
                  <div className={styles.paginationInfo}>
                    Showing {(currentPage - 1) * reviewsPerPage + 1} to{" "}
                    {Math.min(currentPage * reviewsPerPage, totalReviews)} of{" "}
                    {totalReviews} reviews
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>Share Your Experience</h2>
                <p className={styles.ctaText}>
                  Your feedback helps us improve and inspires other traders on their journey.
                  Share your success story with our community!
                </p>
                <div className={styles.ctaButtons}>
                  <Button
                    as={Link}
                    to="/traders"
                    variant="primary"
                    className={styles.ctaButton}
                  >
                    Submit Your Review
                  </Button>
                  <Button
                    as={Link}
                    to="/courses"
                    variant="outline-light"
                    className={styles.ctaButton}
                  >
                    Explore Courses
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

export default ReviewsPage;