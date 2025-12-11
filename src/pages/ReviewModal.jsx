import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Star, StarFill } from 'react-bootstrap-icons';
import axios from 'axios';
import styles from './ReviewModal.module.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ReviewModal = ({ show, onHide, user, profile }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  const [reviewData, setReviewData] = useState({
    reviewerName: '',
    rating: 0,
    reviewText: '',
    courseName: '',
    title: '',
    anonymous: false
  });

  useEffect(() => {
    if (show && user) {
      // Initialize form with user data
      const fullName = profile?.profile ? 
        `${profile.profile.firstName || ''} ${profile.profile.lastName || ''}`.trim() : 
        '';
      
      setReviewData(prev => ({
        ...prev,
        reviewerName: fullName || user.username || 'Anonymous User'
      }));

      // Fetch user's completed courses for suggestions
      fetchCompletedCourses();
    }
  }, [show, user, profile]);

  useEffect(() => {
    if (!show) {
      // Reset form when modal closes
      setReviewData({
        reviewerName: '',
        rating: 0,
        reviewText: '',
        courseName: '',
        title: '',
        anonymous: false
      });
      setError('');
      setSuccess('');
    }
  }, [show]);

  const fetchCompletedCourses = async () => {
    try {
      setLoadingCourses(true);
      const token = localStorage.getItem('token');
      const userId = user.id || user._id;
      
      const response = await axios.get(
        `${API_URL}/api/enrollments/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const enrollments = response.data.enrollments || response.data || [];
      const completedCourses = enrollments
        .filter(enrollment => enrollment.progress === 100 || enrollment.completed)
        .map(enrollment => ({
          id: enrollment.course?._id || enrollment.course,
          title: enrollment.course?.title || 'Unknown Course',
          instructor: enrollment.course?.instructor || 'Unknown'
        }));
      
      setCourses(completedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Don't show error to user, just log it
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleRatingClick = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
    if (error) setError('');
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validation
  if (reviewData.rating === 0) {
    setError('Please select a rating');
    return;
  }
  
  if (!reviewData.reviewText.trim()) {
    setError('Please write your review');
    return;
  }
  
  if (reviewData.reviewText.length < 20) {
    setError('Review must be at least 20 characters');
    return;
  }
  
  if (reviewData.reviewText.length > 500) {
    setError('Review must be less than 500 characters');
    return;
  }
  
  try {
    setSubmitting(true);
    setError('');
    
    const token = localStorage.getItem('token');
    const userId = user?.id || user?._id;
    const userEmail = user?.email;
    
    const reviewPayload = {
      reviewerName: reviewData.reviewerName,
      rating: reviewData.rating,
      reviewText: reviewData.reviewText,
      title: reviewData.title,
      courseName: reviewData.courseName.trim() || 'General Platform Review',
      anonymous: reviewData.anonymous,
      // Include these for non-authenticated requests
      userId: userId || 'guest-user', // Provide a fallback
      userEmail: userEmail || 'guest@example.com'
    };
    
    // Add Authorization header only if token exists
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios.post(`${API_URL}/api/reviews`, reviewPayload, {
      headers: headers
    });
    
    if (response.data.success) {
      setSuccess('Thank you for your review! It has been submitted successfully.');
      
      // Reset form but keep success message for 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
    
  } catch (error) {
    console.error('Error submitting review:', error);
    const errorMessage = error.response?.data?.message || 
      error.response?.data?.error || 
      'Failed to submit review. Please try again.';
    setError(errorMessage);
  } finally {
    setSubmitting(false);
  }
};
  const handleClose = () => {
    onHide();
    // Reset form after a delay to allow success message to be seen
    setTimeout(() => {
      setReviewData({
        reviewerName: '',
        rating: 0,
        reviewText: '',
        courseName: '',
        title: '',
        anonymous: false
      });
      setError('');
      setSuccess('');
    }, 300);
  };

  const characterCount = reviewData.reviewText.length;
  const maxCharacters = 500;

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      size="lg"
      centered
      backdrop="static"
      className={styles.reviewModal}
      dialogClassName={styles.modalDialog}
      contentClassName={styles.modalContent}
      style={{ 
    position: 'fixed',
    top: '80px', 
    zIndex: 1050
  }}

    >
      <Modal.Header closeButton className={`border-0 pb-0 ${styles.modalHeader}`}>
        <Modal.Title className="w-100">
          <div className="text-center">
            <h4 className="fw-bold mb-1 text-primary">Share Your Experience</h4>
            <p className="text-muted mb-0 small">Your feedback helps us improve</p>
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className={`pt-0 ${styles.modalBody}`}>
        {success ? (
          <div className="text-center py-4">
            <div className={`${styles.successIcon} mb-3`}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h5 className="fw-bold text-success mb-2">Review Submitted!</h5>
            <p className="text-muted mb-0">{success}</p>
            <p className="text-muted small mt-3">
              <i className="fas fa-spinner fa-spin me-1"></i>
              Closing...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="danger" className="py-2 mb-3" dismissible onClose={() => setError('')}>
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              {/* Reviewer Information */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3 border-bottom pb-2">
                  <i className="fas fa-user me-2"></i>
                  Reviewer Information
                </h6>
                <Row className="align-items-center">
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-medium mb-1">
                        Display Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="reviewerName"
                        value={reviewData.reviewerName}
                        onChange={handleInputChange}
                        disabled={reviewData.anonymous}
                        size="sm"
                        placeholder="Your name will appear with the review"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="anonymous"
                        label="Post anonymously"
                        checked={reviewData.anonymous}
                        onChange={handleInputChange}
                        className="small fw-normal"
                      />
                      <Form.Text className="text-muted small">
                        Your name won't be displayed
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
              
              {/* Star Rating */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3 border-bottom pb-2">
                  <i className="fas fa-star me-2"></i>
                  Overall Rating
                </h6>
                <div className="text-center">
                  <div className={`${styles.starRating} mb-3`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`${styles.starButton} ${reviewData.rating >= star ? styles.active : ''}`}
                        onClick={() => handleRatingClick(star)}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        {reviewData.rating >= star ? (
                          <StarFill size={38} />
                        ) : (
                          <Star size={38} />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className={`${styles.ratingText} mb-2`}>
                    <span className="fw-bold fs-5">
                      {reviewData.rating > 0 ? `${reviewData.rating}.0` : '0.0'}
                    </span>
                    <span className="text-muted ms-1">/ 5.0</span>
                  </div>
                  <div className="text-muted small">
                    {reviewData.rating === 5 && 'Excellent - Absolutely loved it!'}
                    {reviewData.rating === 4 && 'Very Good - Great experience'}
                    {reviewData.rating === 3 && 'Good - Met expectations'}
                    {reviewData.rating === 2 && 'Fair - Could be better'}
                    {reviewData.rating === 1 && 'Poor - Needs improvement'}
                    {reviewData.rating === 0 && 'Click stars to rate'}
                  </div>
                </div>
              </div>
              
              {/* Review Details */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3 border-bottom pb-2">
                  <i className="fas fa-edit me-2"></i>
                  Review Details
                </h6>
                
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-medium mb-1">Review Title (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={reviewData.title}
                    onChange={handleInputChange}
                    placeholder="Summarize your experience in a few words"
                    size="sm"
                    maxLength="100"
                    className={styles.titleInput}
                  />
                  <div className="d-flex justify-content-between">
                    <Form.Text className="text-muted small">
                      Helps others understand your review
                    </Form.Text>
                    <Form.Text className="text-muted small">
                      {reviewData.title.length}/100
                    </Form.Text>
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-medium mb-1">
                    Your Review <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    name="reviewText"
                    value={reviewData.reviewText}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder={`Share detailed feedback about your learning experience. For example:
• What did you find most valuable?
• How was the instructor's teaching style?
• Was the content practical and relevant?
• Any suggestions for improvement?`}
                    maxLength={maxCharacters}
                    required
                    size="sm"
                    className={`${styles.textarea} ${characterCount > maxCharacters ? 'is-invalid' : ''}`}
                  />
                  <div className="d-flex justify-content-between mt-2">
                    <Form.Text className="text-muted small">
                      {characterCount < 20 ? (
                        <span className="text-warning">
                          Minimum 20 characters required ({20 - characterCount} more)
                        </span>
                      ) : (
                        'Minimum 20 characters'
                      )}
                    </Form.Text>
                    <Form.Text className={`small ${characterCount > maxCharacters - 50 ? 'text-warning' : 'text-muted'}`}>
                      {characterCount} / {maxCharacters}
                    </Form.Text>
                  </div>
                </Form.Group>
                
                {/* Course Selection - Text box with suggestions */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-medium mb-1">
                    <i className="fas fa-graduation-cap me-1"></i>
                    Course Reviewed (Optional)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="courseName"
                    value={reviewData.courseName}
                    onChange={handleInputChange}
                    placeholder="Enter the course name you're reviewing"
                    size="sm"
                    list="courseSuggestions"
                  />
                  {/* Course suggestions datalist */}
                  <datalist id="courseSuggestions">
                    {courses.map(course => (
                      <option key={course.id} value={course.title} />
                    ))}
                    <option value="General Platform Review" />
                    <option value="Instructor Feedback" />
                    <option value="Overall Learning Experience" />
                  </datalist>
                  <Form.Text className="text-muted small">
                    Type the course name or select from suggestions. Leave blank for general feedback.
                    {courses.length > 0 && (
                      <span className="ms-1">
                        {courses.length} completed course{courses.length !== 1 ? 's' : ''} available
                      </span>
                    )}
                  </Form.Text>
                </Form.Group>
              </div>
              
              {/* Review Guidelines */}
              <div className={`${styles.guidelines} mb-4 p-3 rounded`}>
                <h6 className="fw-bold mb-2">
                  <i className="fas fa-lightbulb me-2"></i>
                  Review Guidelines
                </h6>
                <ul className="mb-0 small">
                  <li>Share specific examples from your learning journey</li>
                  <li>Focus on the content, teaching style, and practical value</li>
                  <li>Be constructive - what worked well and what could improve?</li>
                  <li>Your review will be visible to other students and instructors</li>
                </ul>
              </div>
              
              {/* Submit Buttons */}
              <div className="d-flex gap-3 justify-content-end pt-3 border-top">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  size="sm"
                  disabled={submitting || characterCount < 20 || reviewData.rating === 0}
                  className="px-4"
                >
                  {submitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer className={`border-0 pt-0 ${styles.modalFooter}`}>
        <p className="text-muted small text-center w-100 mb-0">
          <i className="fas fa-shield-alt me-1"></i>
          Your review is confidential and will be used to improve our platform
        </p>
      </Modal.Footer>
    </Modal>
  );
};

export default ReviewModal;