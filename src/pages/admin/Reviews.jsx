import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Table, 
  Badge, 
  Form, 
  InputGroup, 
  Button, 
  Modal,
  Alert,
  Spinner,
  Dropdown,
  Pagination,
  Card,
  Row,
  Col,
  Nav,
  Tab,
  Tabs
} from 'react-bootstrap';
import { 
  Search, 
  StarFill, 
  Star, 
  Trash, 
  Eye, 
  EyeSlash,
  Filter,
  ThreeDots,
  CheckCircle,
  XCircle,
  Clock
} from 'react-bootstrap-icons';
import axios from 'axios';
import './Reviews.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [hiddenReviews, setHiddenReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiddenLoading, setHiddenLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHideModal, setShowHideModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hiddenPage, setHiddenPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hiddenTotalPages, setHiddenTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalHiddenReviews, setTotalHiddenReviews] = useState(0);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [hideReason, setHideReason] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    hiddenCount: 0,
    byCourse: [],
    byRating: [],
    recentReviews: []
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchReviews();
    fetchReviewStats();
    extractCourses();
  }, [currentPage, sortField, sortOrder, filterCourse, filterRating, filterStatus, activeTab]);

  useEffect(() => {
    if (activeTab === 'hidden') {
      fetchHiddenReviews();
    }
  }, [activeTab, hiddenPage]);

  useEffect(() => {
    if (searchTerm && activeTab === 'all') {
      const delayDebounceFn = setTimeout(() => {
        fetchReviews();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else if (searchTerm && activeTab === 'hidden') {
      const delayDebounceFn = setTimeout(() => {
        fetchHiddenReviews();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, activeTab]);

 const fetchReviews = async () => {
  try {
    setLoading(true);
    setError('');
    
    console.log('📡 Fetching admin reviews (no auth)...');
    
    // NO AUTH HEADER NEEDED
    const response = await axios.get(`${API_URL}/api/reviews/admin/all`, {
      params: {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
        courseName: filterCourse !== 'all' ? filterCourse : undefined,
        rating: filterRating !== 'all' ? filterRating : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined,
        showHidden: false
      }
    });

    console.log('✅ Admin reviews loaded:', response.data.data?.length);
    
    setReviews(response.data.data || []);
    setTotalReviews(response.data.total || 0);
    setTotalPages(response.data.totalPages || 1);
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    setError(error.response?.data?.message || 'Failed to load reviews.');
  } finally {
    setLoading(false);
  }
};


  const fetchHiddenReviews = async () => {
    try {
      setHiddenLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/reviews/admin/all`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: hiddenPage,
          limit: itemsPerPage,
          status: 'hidden',
          search: searchTerm || undefined
        }
      });

      setHiddenReviews(response.data.data || []);
      setTotalHiddenReviews(response.data.total || 0);
      setHiddenTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching hidden reviews:', error);
      setError('Failed to load hidden reviews.');
    } finally {
      setHiddenLoading(false);
    }
  };

  const fetchReviewStats = async () => {
  try {
    console.log('📊 Fetching stats (no auth)...');
    
    // NO AUTH HEADER
    const response = await axios.get(`${API_URL}/api/reviews/admin/stats/summary`);
    
    console.log('✅ Stats loaded');
    setStats(response.data.data || {
      total: 0,
      averageRating: 0,
      hiddenCount: 0,
      byCourse: [],
      byRating: [],
      recentReviews: []
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    calculateLocalStats();
  }
};
  const calculateLocalStats = () => {
    if (reviews.length === 0) return;

    const total = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / total;
    const hiddenCount = reviews.filter(r => r.hidden).length;
    
    const byCourse = {};
    const byRating = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    const byStatus = {
      approved: 0,
      pending: 0,
      rejected: 0,
      hidden: 0
    };

    reviews.forEach(review => {
      // Course distribution
      const courseName = review.courseName || 'General Platform Review';
      byCourse[courseName] = (byCourse[courseName] || 0) + 1;
      
      // Rating distribution
      byRating[review.rating] = (byRating[review.rating] || 0) + 1;
      
      // Status distribution
      byStatus[review.status || 'approved'] = (byStatus[review.status || 'approved'] || 0) + 1;
    });

    setStats({
      total,
      averageRating: parseFloat(averageRating.toFixed(1)),
      hiddenCount,
      byCourse: Object.keys(byCourse).map(name => ({
        _id: name,
        count: byCourse[name],
        averageRating: reviews
          .filter(r => r.courseName === name)
          .reduce((sum, r) => sum + r.rating, 0) / byCourse[name]
      })),
      byRating: Object.keys(byRating).map(rating => ({
        _id: parseInt(rating),
        count: byRating[rating]
      })),
      recentReviews: reviews.slice(0, 5)
    });
  };

  const extractCourses = () => {
    const allReviews = [...reviews, ...hiddenReviews];
    const uniqueCourses = [...new Set(allReviews.map(review => review.courseName))];
    setCourses(uniqueCourses.filter(course => course && course !== ''));
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      await axios.delete(`${API_URL}/api/reviews/admin/${selectedReview._id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Remove from state based on active tab
      if (activeTab === 'all') {
        setReviews(prev => prev.filter(r => r._id !== selectedReview._id));
      } else {
        setHiddenReviews(prev => prev.filter(r => r._id !== selectedReview._id));
      }
      
      setShowDeleteModal(false);
      setSelectedReview(null);
      setSuccess('Review deleted successfully!');
      
      // Refresh stats
      fetchReviewStats();
      fetchReviews();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting review:', error);
      setError(error.response?.data?.message || 'Failed to delete review.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleHideReview = async () => {
    if (!selectedReview || !hideReason.trim()) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      await axios.put(`${API_URL}/api/reviews/admin/${selectedReview._id}/hide`, 
        { hideReason },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update in state
      setReviews(prev => prev.filter(r => r._id !== selectedReview._id));
      setHiddenReviews(prev => [...prev, { ...selectedReview, hidden: true, status: 'hidden', hideReason }]);
      
      setShowHideModal(false);
      setHideReason('');
      setSelectedReview(null);
      setSuccess('Review hidden successfully! It will no longer appear on the homepage.');
      
      // Refresh stats
      fetchReviewStats();
      fetchReviews();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error hiding review:', error);
      setError(error.response?.data?.message || 'Failed to hide review.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUnhideReview = async (review) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      await axios.put(`${API_URL}/api/reviews/admin/${review._id}/unhide`, 
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update in state
      setHiddenReviews(prev => prev.filter(r => r._id !== review._id));
      setReviews(prev => [...prev, { ...review, hidden: false, status: 'approved' }]);
      
      setSuccess('Review unhidden successfully! It will now appear on the homepage.');
      
      // Refresh stats
      fetchReviewStats();
      fetchReviews();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error unhiding review:', error);
      setError(error.response?.data?.message || 'Failed to unhide review.');
    }
  };

  const handleUpdateStatus = async (review, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      await axios.put(`${API_URL}/api/reviews/admin/${review._id}/status`, 
        { status: newStatus },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update in state
      setReviews(prev => prev.map(r => 
        r._id === review._id ? { ...r, status: newStatus } : r
      ));

      setSuccess(`Review ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating review status:', error);
      setError(error.response?.data?.message || 'Failed to update review status.');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const renderStars = (rating, size = 14) => {
    return (
      <div className="d-inline-flex align-items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="me-1">
            {star <= rating ? (
              <StarFill className="text-warning" size={size} />
            ) : (
              <Star className="text-muted" size={size} />
            )}
          </span>
        ))}
        <span className="ms-1 small fw-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getStatusBadge = (status, hidden = false) => {
    if (hidden) {
      return <Badge bg="warning" text="dark" className="px-2 py-1"><EyeSlash size={12} className="me-1" /> Hidden</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return <Badge bg="success" className="px-2 py-1"><CheckCircle size={12} className="me-1" /> Approved</Badge>;
      case 'pending':
        return <Badge bg="warning" text="dark" className="px-2 py-1"><Clock size={12} className="me-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge bg="danger" className="px-2 py-1"><XCircle size={12} className="me-1" /> Rejected</Badge>;
      case 'hidden':
        return <Badge bg="warning" text="dark" className="px-2 py-1"><EyeSlash size={12} className="me-1" /> Hidden</Badge>;
      default:
        return <Badge bg="secondary" className="px-2 py-1">Unknown</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCourse('all');
    setFilterRating('all');
    setFilterStatus('all');
    setCurrentPage(1);
    setHiddenPage(1);
    setSortField('createdAt');
    setSortOrder('desc');
  };

  if (loading && reviews.length === 0 && activeTab === 'all') {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading reviews...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-2">
            <i className="fas fa-star me-2 text-warning"></i>
            User Reviews Management
          </h2>
          <p className="text-muted mb-0">
            Manage, hide/unhide, and monitor user feedback and ratings
          </p>
        </div>
        <div className="d-flex gap-2">
          <Badge bg="light" text="dark" className="fs-6 px-3 py-2 border">
            <i className="fas fa-eye me-2"></i>
            {totalReviews} Visible
          </Badge>
          <Badge bg="warning" text="dark" className="fs-6 px-3 py-2 border">
            <i className="fas fa-eye-slash me-2"></i>
            {stats.hiddenCount || totalHiddenReviews} Hidden
          </Badge>
        </div>
      </div>

      {/* Success and Error Messages */}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-3">
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm stats-card">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                <i className="fas fa-star text-primary fs-4"></i>
              </div>
              <div>
                <Card.Text className="text-muted small mb-1">Average Rating</Card.Text>
                <Card.Title className="mb-0">
                  {stats.averageRating.toFixed(1)}/5.0
                </Card.Title>
                <Card.Text className="small text-muted mb-0">
                  Based on {totalReviews} visible reviews
                </Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm stats-card">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                <i className="fas fa-check-circle text-success fs-4"></i>
              </div>
              <div>
                <Card.Text className="text-muted small mb-1">Approved Reviews</Card.Text>
                <Card.Title className="mb-0">
                  {stats.byRating.find(r => r._id === 5)?.count || 0}
                </Card.Title>
                <Card.Text className="small text-muted mb-0">
                  5-Star ratings
                </Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm stats-card">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                <i className="fas fa-eye-slash text-warning fs-4"></i>
              </div>
              <div>
                <Card.Text className="text-muted small mb-1">Hidden Reviews</Card.Text>
                <Card.Title className="mb-0">{stats.hiddenCount || totalHiddenReviews}</Card.Title>
                <Card.Text className="small text-muted mb-0">
                  Not shown on homepage
                </Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm stats-card">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-info bg-opacity-10 p-3 rounded-circle me-3">
                <i className="fas fa-book text-info fs-4"></i>
              </div>
              <div>
                <Card.Text className="text-muted small mb-1">Courses Reviewed</Card.Text>
                <Card.Title className="mb-0">{stats.byCourse.length}</Card.Title>
                <Card.Text className="small text-muted mb-0">
                  {stats.byCourse[0]?._id || 'No reviews yet'}
                </Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="border-bottom"
            fill
          >
            <Tab eventKey="all" title={
              <span>
                <i className="fas fa-list me-2"></i>
                All Reviews ({totalReviews})
              </span>
            }>
              {/* Filters and Search for All Reviews */}
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12} lg={4}>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0">
                        <Search size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Search reviews, users, courses, or emails..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-start-0"
                      />
                    </InputGroup>
                  </Col>
                  
                  <Col md={4} lg={2}>
                    <Form.Select 
                      value={filterCourse}
                      onChange={(e) => {
                        setFilterCourse(e.target.value);
                        setCurrentPage(1);
                      }}
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

                  <Col md={4} lg={2}>
                    <Form.Select 
                      value={filterRating}
                      onChange={(e) => {
                        setFilterRating(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All Ratings</option>
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                      <option value="3">⭐⭐⭐ 3 Stars</option>
                      <option value="2">⭐⭐ 2 Stars</option>
                      <option value="1">⭐ 1 Star</option>
                    </Form.Select>
                  </Col>

                  <Col md={4} lg={2}>
                    <Form.Select 
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All Status</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </Form.Select>
                  </Col>

                  <Col md={12} lg={2}>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-secondary" 
                        className="w-100"
                        onClick={clearFilters}
                      >
                        <i className="fas fa-filter me-2"></i>
                        Clear
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Reviews Table for All Reviews */}
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '5%' }}>
                        Rating
                      </th>
                      <th style={{ width: '15%' }}>Reviewer
                      </th>
                      <th style={{ width: '30%' }}>Review</th>
                      <th style={{ width: '15%' }}>Course</th>
                      <th style={{ width: '15%' }}>Date
                      </th>
                      <th style={{ width: '10%' }}>Status</th>
                      <th style={{ width: '10%' }} className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <div className="text-muted">
                            <i className="fas fa-search fa-2x mb-3"></i>
                            <p className="mb-2">No reviews found</p>
                            <small className="text-muted">Try adjusting your filters or check back later</small>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      reviews.map((review) => (
                        <tr key={review._id}>
                          <td>
                            {renderStars(review.rating, 16)}
                          </td>
                          <td>
                            <div>
                              <div className="d-flex align-items-center">
                                <strong>{review.reviewerName}</strong>
                                {review.anonymous && (
                                  <Badge bg="secondary" className="ms-2" size="sm">Anonymous</Badge>
                                )}
                              </div>
                              <div className="small text-muted text-truncate" style={{ maxWidth: '150px' }}>
                                {review.userEmail}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              {review.title && (
                                <strong className="d-block mb-1">{review.title}</strong>
                              )}
                              <p className="mb-0 review-text-truncate">
                                {truncateText(review.reviewText, 120)}
                              </p>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 mt-1 text-decoration-none"
                                onClick={() => {
                                  setSelectedReview(review);
                                  setShowReviewModal(true);
                                }}
                              >
                                <small>Read full review →</small>
                              </Button>
                            </div>
                          </td>
                          <td>
                            <Badge bg="light" text="dark" className="border badge-course">
                              {review.courseName}
                            </Badge>
                          </td>
                          <td>
                            <div className="small">
                              <div>{formatDate(review.createdAt)}</div>
                            </div>
                          </td>
                          <td>
                            {getStatusBadge(review.status || 'approved', review.hidden)}
                          </td>
                          <td className="text-center">
                            <Dropdown>
                              <Dropdown.Toggle 
                                variant="light" 
                                size="sm" 
                                id={`dropdown-${review._id}`}
                                className="btn-action"
                              >
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item onClick={() => {
                                  setSelectedReview(review);
                                  setShowReviewModal(true);
                                }}>
                                  <i className="fas fa-eye me-2"></i> View Details
                                </Dropdown.Item>
                                {review.status !== 'approved' && (
                                  <Dropdown.Item onClick={() => handleUpdateStatus(review, 'approved')}>
                                    <i className="fas fa-check-circle me-2 text-success"></i> Approve
                                  </Dropdown.Item>
                                )}
                                {review.status !== 'rejected' && (
                                  <Dropdown.Item onClick={() => handleUpdateStatus(review, 'rejected')}>
                                    <i className="fas fa-times-circle me-2 text-danger"></i> Reject
                                  </Dropdown.Item>
                                )}
                                
                                {/* Hide option for approved reviews */}
                                {!review.hidden && review.status === 'approved' && (
                                  <>
                                    <Dropdown.Divider />
                                    <Dropdown.Item 
                                      onClick={() => {
                                        setSelectedReview(review);
                                        setHideReason('');
                                        setShowHideModal(true);
                                      }}
                                      className="text-warning"
                                    >
                                      <i className="fas fa-eye-slash me-2"></i> Hide from Homepage
                                    </Dropdown.Item>
                                  </>
                                )}
                                
                                <Dropdown.Divider />
                                <Dropdown.Item 
                                  onClick={() => {
                                    setSelectedReview(review);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-danger"
                                >
                                  <i className="fas fa-trash me-2"></i> Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination for All Reviews */}
              {totalPages > 1 && (
                <Card.Footer className="border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, totalReviews)} of {totalReviews} reviews
                    </div>
                    <Pagination className="mb-0">
                      <Pagination.Prev 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      />
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        if (pageNum <= totalPages) {
                          return (
                            <Pagination.Item
                              key={pageNum}
                              active={pageNum === currentPage}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Pagination.Item>
                          );
                        }
                        return null;
                      })}
                      {totalPages > 5 && (
                        <>
                          <Pagination.Ellipsis />
                          <Pagination.Item
                            active={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </Pagination.Item>
                        </>
                      )}
                      <Pagination.Next 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      />
                    </Pagination>
                  </div>
                </Card.Footer>
              )}
            </Tab>

            <Tab eventKey="hidden" title={
              <span>
                <i className="fas fa-eye-slash me-2"></i>
                Hidden Reviews ({totalHiddenReviews})
              </span>
            }>
              {/* Search for Hidden Reviews */}
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12} lg={8}>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0">
                        <Search size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Search hidden reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-start-0"
                      />
                    </InputGroup>
                  </Col>
                  <Col md={12} lg={4}>
                    <Button 
                      variant="outline-secondary" 
                      className="w-100"
                      onClick={clearFilters}
                    >
                      <i className="fas fa-filter me-2"></i>
                      Clear Search
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Hidden Reviews Table */}
              {hiddenLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="warning" />
                  <p className="mt-3 text-muted">Loading hidden reviews...</p>
                </div>
              ) : hiddenReviews.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-eye fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No hidden reviews found</p>
                  <small className="text-muted">Reviews you hide will appear here</small>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th style={{ width: '5%' }}>Rating</th>
                          <th style={{ width: '15%' }}>Reviewer</th>
                          <th style={{ width: '30%' }}>Review</th>
                          <th style={{ width: '15%' }}>Course</th>
                          <th style={{ width: '15%' }}>Hidden Reason</th>
                          <th style={{ width: '10%' }}>Date Hidden</th>
                          <th style={{ width: '10%' }} className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hiddenReviews.map((review) => (
                          <tr key={review._id}>
                            <td>
                              {renderStars(review.rating, 16)}
                            </td>
                            <td>
                              <div>
                                <div className="d-flex align-items-center">
                                  <strong>{review.reviewerName}</strong>
                                  {review.anonymous && (
                                    <Badge bg="secondary" className="ms-2" size="sm">Anonymous</Badge>
                                  )}
                                </div>
                                <div className="small text-muted text-truncate" style={{ maxWidth: '150px' }}>
                                  {review.userEmail}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <p className="mb-0 review-text-truncate">
                                  {truncateText(review.reviewText, 80)}
                                </p>
                              </div>
                            </td>
                            <td>
                              <Badge bg="light" text="dark" className="border badge-course">
                                {review.courseName}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="warning" text="dark">
                                {review.hideReason || 'No reason specified'}
                              </Badge>
                            </td>
                            <td>
                              <div className="small">
                                <div>{formatDate(review.updatedAt)}</div>
                              </div>
                            </td>
                            <td className="text-center">
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleUnhideReview(review)}
                                className="me-2"
                              >
                                <i className="fas fa-eye me-1"></i> Unhide
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedReview(review);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <i className="fas fa-trash me-1"></i>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination for Hidden Reviews */}
                  {hiddenTotalPages > 1 && (
                    <Card.Footer className="border-top">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-muted small">
                          Showing {((hiddenPage - 1) * itemsPerPage) + 1} to{' '}
                          {Math.min(hiddenPage * itemsPerPage, totalHiddenReviews)} of {totalHiddenReviews} hidden reviews
                        </div>
                        <Pagination className="mb-0">
                          <Pagination.Prev 
                            disabled={hiddenPage === 1}
                            onClick={() => setHiddenPage(prev => Math.max(prev - 1, 1))}
                          />
                          {Array.from({ length: Math.min(5, hiddenTotalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            if (pageNum <= hiddenTotalPages) {
                              return (
                                <Pagination.Item
                                  key={pageNum}
                                  active={pageNum === hiddenPage}
                                  onClick={() => setHiddenPage(pageNum)}
                                >
                                  {pageNum}
                                </Pagination.Item>
                              );
                            }
                            return null;
                          })}
                          {hiddenTotalPages > 5 && (
                            <>
                              <Pagination.Ellipsis />
                              <Pagination.Item
                                active={hiddenPage === hiddenTotalPages}
                                onClick={() => setHiddenPage(hiddenTotalPages)}
                              >
                                {hiddenTotalPages}
                              </Pagination.Item>
                            </>
                          )}
                          <Pagination.Next 
                            disabled={hiddenPage === hiddenTotalPages}
                            onClick={() => setHiddenPage(prev => Math.min(prev + 1, hiddenTotalPages))}
                          />
                        </Pagination>
                      </div>
                    </Card.Footer>
                  )}
                </>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Review Detail Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title className="d-flex align-items-center">
            <i className="fas fa-star text-warning me-2"></i>
            Review Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReview && (
            <div>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h5 className="mb-1">{selectedReview.reviewerName}</h5>
                  <div className="text-muted small mb-2">
                    <i className="fas fa-envelope me-1"></i>
                    {selectedReview.userEmail}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {renderStars(selectedReview.rating, 18)}
                    {selectedReview.anonymous && (
                      <Badge bg="secondary">Anonymous</Badge>
                    )}
                    {getStatusBadge(selectedReview.status || 'approved', selectedReview.hidden)}
                  </div>
                </div>
                <Badge bg="light" text="dark" className="fs-6 border">
                  <i className="fas fa-book me-1"></i>
                  {selectedReview.courseName}
                </Badge>
              </div>

              <div className="mb-4">
                <h6 className="border-bottom pb-2 mb-3">
                  <i className="fas fa-edit me-2"></i>
                  Review Content
                </h6>
                {selectedReview.title && (
                  <h5 className="mb-3 text-primary">{selectedReview.title}</h5>
                )}
                <div className="p-3 bg-light rounded" style={{ lineHeight: '1.6' }}>
                  {selectedReview.reviewText}
                </div>
              </div>

              {selectedReview.hidden && selectedReview.hideReason && (
                <div className="mb-4">
                  <h6 className="border-bottom pb-2 mb-3 text-warning">
                    <i className="fas fa-eye-slash me-2"></i>
                    Hidden Reason
                  </h6>
                  <div className="alert alert-warning">
                    <strong>Reason:</strong> {selectedReview.hideReason}
                  </div>
                </div>
              )}

              <Row className="text-muted small">
                <Col md={6}>
                  <div className="mb-1">
                    <i className="fas fa-calendar me-1"></i>
                    <strong>Submitted:</strong> {formatDate(selectedReview.createdAt)}
                  </div>
                  {selectedReview.updatedAt && selectedReview.updatedAt !== selectedReview.createdAt && (
                    <div className="mb-1">
                      <i className="fas fa-edit me-1"></i>
                      <strong>Last Updated:</strong> {formatDate(selectedReview.updatedAt)}
                    </div>
                  )}
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="mb-1">
                    <i className="fas fa-id-badge me-1"></i>
                    <strong>User ID:</strong> {selectedReview.userId}
                  </div>
                  <div>
                    <i className="fas fa-hashtag me-1"></i>
                    <strong>Review ID:</strong> {selectedReview._id}
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top">
          <div className="d-flex justify-content-between w-100">
            <div>
              {selectedReview && (
                <>
                  {!selectedReview.hidden && selectedReview.status === 'approved' && (
                    <Button 
                      variant="warning" 
                      size="sm"
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedReview(selectedReview);
                        setHideReason('');
                        setShowHideModal(true);
                      }}
                      className="me-2"
                    >
                      <i className="fas fa-eye-slash me-1"></i> Hide
                    </Button>
                  )}
                  {selectedReview.hidden && (
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => {
                        handleUnhideReview(selectedReview);
                        setShowReviewModal(false);
                      }}
                      className="me-2"
                    >
                      <i className="fas fa-eye me-1"></i> Unhide
                    </Button>
                  )}
                </>
              )}
            </div>
            <div>
              <Button 
                variant="secondary" 
                onClick={() => setShowReviewModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Hide Confirmation Modal */}
      <Modal show={showHideModal} onHide={() => setShowHideModal(false)} centered>
        <Modal.Header closeButton className="border-bottom bg-warning">
          <Modal.Title className="text-dark d-flex align-items-center">
            <i className="fas fa-eye-slash me-2"></i>
            Hide Review from Homepage
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This review will be hidden from the homepage testimonials section.</p>
          {selectedReview && (
            <div className="alert alert-warning small mb-3">
              <div className="fw-bold mb-1">{selectedReview.reviewerName}</div>
              <div className="mb-1">
                <strong>Course:</strong> {selectedReview.courseName}
              </div>
              <div>
                <strong>Rating:</strong> {renderStars(selectedReview.rating, 12)}
              </div>
              {selectedReview.title && (
                <div className="mt-2">
                  <em>"{selectedReview.title}"</em>
                </div>
              )}
            </div>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Reason for hiding:</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter reason for hiding this review (e.g., inappropriate content, spam, etc.)"
              value={hideReason}
              onChange={(e) => setHideReason(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              This will help you remember why this review was hidden.
            </Form.Text>
          </Form.Group>
          
          <p className="text-warning small mb-0">
            <i className="fas fa-info-circle me-1"></i>
            Hidden reviews can be unhidden later from the "Hidden Reviews" tab.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowHideModal(false);
              setHideReason('');
            }}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="warning" 
            onClick={handleHideReview}
            disabled={deleteLoading || !hideReason.trim()}
          >
            {deleteLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Hiding...
              </>
            ) : (
              <>
                <i className="fas fa-eye-slash me-1"></i>
                Hide Review
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="text-danger d-flex align-items-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Delete Review
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this review?</p>
          {selectedReview && (
            <div className="alert alert-warning small mb-3">
              <div className="fw-bold mb-1">{selectedReview.reviewerName}</div>
              <div className="mb-1">
                <strong>Course:</strong> {selectedReview.courseName}
              </div>
              <div>
                <strong>Rating:</strong> {renderStars(selectedReview.rating, 12)}
              </div>
              {selectedReview.title && (
                <div className="mt-2">
                  <em>"{selectedReview.title}"</em>
                </div>
              )}
            </div>
          )}
          <p className="text-danger small mb-0">
            <i className="fas fa-info-circle me-1"></i>
            This action cannot be undone and will permanently delete the review.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteReview}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash me-1"></i>
                Delete Review
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Reviews;