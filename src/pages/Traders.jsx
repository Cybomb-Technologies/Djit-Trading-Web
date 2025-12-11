import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Table, Form, Button, Spinner, Alert, Image } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReviewModal from './ReviewModal';
import styles from './Traders.module.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Traders = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    phone2: '',
    birthday: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    address2: {
      type: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    address3: {
      street: ''
    },
    tradingViewId: '',
    tradingSegment: '',
    discordId: '',
    profilePicture: {
      url: '',
      filename: ''
    },
    emailSubscriberStatus: '',
    smsSubscriberStatus: '',
    source: '',
    language: '',
    lastActivity: '',
    lastActivityDate: '',
    labels: []
  });

  // Get user ID from auth context
  const getUserId = () => {
    if (!user) return null;
    return user.id || user._id || user.userId || user.userID;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        // Try to get current user data without needing ID
        const [profileResponse, enrollmentsResponse] = await Promise.all([
          axios.get(`${API_URL}/api/users/me`, config).catch(() => 
            // Fallback: try with user ID if /me endpoint doesn't exist
            axios.get(`${API_URL}/api/users/${getUserId()}`, config)
          ),
          axios.get(`${API_URL}/api/enrollments/user/${getUserId()}`, config).catch(() =>
            // Fallback: try with user ID if /my-courses endpoint doesn't exist
            axios.get(`${API_URL}/api/enrollments/user/${getUserId()}`, config)
          )
        ]);

        setProfile(profileResponse.data.user || profileResponse.data);
        
        // Set form data if profile exists
        const userProfile = profileResponse.data.user || profileResponse.data;
        if (userProfile.profile) {
          setFormData({
            firstName: userProfile.profile.firstName || '',
            lastName: userProfile.profile.lastName || '',
            phone: userProfile.profile.phone || '',
            phone2: userProfile.profile.phone2 || '',
            birthday: userProfile.profile.birthday ? 
              new Date(userProfile.profile.birthday).toISOString().split('T')[0] : '',
            address: userProfile.profile.address || {
              street: '', city: '', state: '', zipCode: '', country: ''
            },
            address2: userProfile.profile.address2 || {
              type: '', street: '', city: '', state: '', zipCode: '', country: ''
            },
            address3: userProfile.profile.address3 || {
              street: ''
            },
            tradingViewId: userProfile.profile.tradingViewId || '',
            tradingSegment: userProfile.profile.tradingSegment || '',
            discordId: userProfile.profile.discordId || '',
            profilePicture: userProfile.profile.profilePicture || {
              url: '', filename: ''
            },
            emailSubscriberStatus: userProfile.profile.emailSubscriberStatus || '',
            smsSubscriberStatus: userProfile.profile.smsSubscriberStatus || '',
            source: userProfile.profile.source || '',
            language: userProfile.profile.language || '',
            lastActivity: userProfile.profile.lastActivity || '',
            lastActivityDate: userProfile.profile.lastActivityDate ? 
              new Date(userProfile.profile.lastActivityDate).toISOString().split('T')[0] : '',
            labels: userProfile.profile.labels || []
          });
        }

        // Process enrollments data
        const enrollmentsData = enrollmentsResponse.data.enrollments || enrollmentsResponse.data || [];
        setEnrollments(enrollmentsData);

      } catch (error) {
        console.error('Error fetching user data:', error);
        const errorMessage = error.response?.data?.message || 
          error.message || 
          'Failed to load user data. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested objects
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else if (name.startsWith('address2.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address2: {
          ...prev.address2,
          [addressField]: value
        }
      }));
    } else if (name.startsWith('address3.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address3: {
          ...prev.address3,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setImageError(false);
      // Create form data for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('profilePicture', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/users/upload-profile-picture`, uploadFormData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Update form data with the uploaded image URL
        setFormData(prev => ({
          ...prev,
          profilePicture: response.data.profilePicture
        }));
        
        // Update profile state immediately for preview
        setProfile(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            profilePicture: response.data.profilePicture
          }
        }));
        
        alert('Profile picture uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      const errorMessage = error.response?.data?.message || 
        'Failed to upload profile picture. Please try again.';
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${API_URL}/api/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Update local profile state with the returned user data
        setProfile(response.data.user);
        setIsEditing(false);
        
        // Show success message
        alert('Profile updated successfully!');
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 
        'Failed to update profile. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLearning = (courseId) => {
    if (!courseId) {
      alert('Course not found. Please try again.');
      return;
    }
    navigate(`/learning/${courseId}`);
  };

  const handleStartLearning = (courseId) => {
    if (!courseId) {
      alert('Course not found. Please try again.');
      return;
    }
    navigate(`/learning/${courseId}`);
  };

  const handleBrowseCourses = () => {
    navigate('/courses');
  };

  // Open Review Modal
  const handleOpenReviewModal = () => {
    setShowReviewModal(true);
  };

  // Close Review Modal
  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
  };

  const getBadgeVariant = (badge) => {
    switch (badge) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'danger';
      case 'Pro': return 'primary';
      default: return 'secondary';
    }
  };

  const getProgressVariant = (progress) => {
    if (progress === 100) return 'success';
    if (progress >= 50) return 'primary';
    if (progress > 0) return 'warning';
    return 'secondary';
  };

  const getProgressText = (progress) => {
    if (progress === 0) return 'Not Started';
    if (progress === 100) return 'Completed';
    return `In Progress (${progress}%)`;
  };

  const getCourseAction = (enrollment) => {
    if (enrollment.progress === 100) {
      return {
        variant: "outline-success",
        text: 'Review',
        handler: () => handleContinueLearning(enrollment.course?._id || enrollment.course)
      };
    } else if (enrollment.progress > 0) {
      return {
        variant: "primary",
        text: 'Continue',
        handler: () => handleContinueLearning(enrollment.course?._id || enrollment.course)
      };
    } else {
      return {
        variant: "primary",
        text: 'Start Learning',
        handler: () => handleStartLearning(enrollment.course?._id || enrollment.course)
      };
    }
  };

  // Get profile picture URL or return null
  const getProfilePicture = () => {
    if (profile?.profile?.profilePicture?.url) {
      let imageUrl = profile.profile.profilePicture.url;
      
      // Ensure URL is properly formatted
      if (imageUrl.startsWith('/uploads/')) {
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || `${API_URL}`;
        imageUrl = `${backendUrl}${imageUrl}`;
      }
      
      return imageUrl;
    }
    return null;
  };

  // Handle image load error
  const handleImageError = () => {
    console.error('Profile image failed to load');
    setImageError(true);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile?.profile?.firstName && profile?.profile?.lastName) {
      return `${profile.profile.firstName.charAt(0)}${profile.profile.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container className={styles.tradersPage}>
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your profile...</p>
        </div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className={styles.tradersPage}>
        <div className="text-center py-5">
          <h2>Please log in to view your trader profile</h2>
          <p className="mb-4">You need to be logged in to access this page.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Log In
          </Button>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className={styles.tradersPage}>
        <Alert variant="danger" className="mt-4">
          <Alert.Heading>Error Loading Profile</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/courses')}>
              Browse Courses
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const inProgressEnrollments = enrollments.filter(
    enrollment => enrollment.progress > 0 && enrollment.progress < 100
  );

  const completedEnrollments = enrollments.filter(
    enrollment => enrollment.progress === 100 || enrollment.completed
  );

  return (
    <div className={styles.tradersPage}>
      <Container className="py-4">
        <Row>
          <Col lg={4} className="mb-4">
            {/* Profile Card */}
            <Card className="shadow-sm">
              <Card.Body className="text-center">
                <div className="position-relative d-inline-block">
                  {getProfilePicture() && !imageError ? (
                    <Image
                      src={getProfilePicture()}
                      roundedCircle
                      className="mb-3"
                      style={{width: '80px', height: '80px', objectFit: 'cover'}}
                      alt="Profile"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                    />
                  ) : (
                    <div 
                      className={`${styles.avatar} bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3`} 
                      style={{width: '80px', height: '80px', fontSize: '2rem'}}
                    >
                      {getInitials()}
                    </div>
                  )}
                  {isEditing && (
                    <div className="position-absolute bottom-0 end-0">
                      <Form.Group controlId="formProfilePicture">
                        <Form.Label 
                          className="btn btn-light btn-sm rounded-circle shadow-sm"
                          style={{cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                          title="Change profile picture"
                        >
                          <i className="fas fa-camera" style={{fontSize: '0.8rem'}}></i>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            style={{display: 'none'}}
                            disabled={uploading}
                          />
                        </Form.Label>
                      </Form.Group>
                    </div>
                  )}
                </div>
                {uploading && (
                  <div className="mb-2">
                    <Spinner animation="border" size="sm" />
                    <small className="ms-2">Uploading...</small>
                  </div>
                )}
                <h4 className="mb-1">{user?.username || 'User'}</h4>
                <p className="text-muted mb-3">{user?.email || 'No email'}</p>
                
                {profile?.profile?.badge && (
                  <Badge 
                    bg={getBadgeVariant(profile.profile.badge)}
                    className="mb-3 fs-6"
                  >
                    {profile.profile.badge} Trader
                  </Badge>
                )}

                <div className="d-flex justify-content-around mt-4">
                  <div className="text-center">
                    <div className="fw-bold fs-4 text-primary">{enrollments.length}</div>
                    <div className="text-muted small">Courses</div>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold fs-4 text-success">{completedEnrollments.length}</div>
                    <div className="text-muted small">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold fs-4 text-warning">
                      {enrollments.length > 0 
                        ? Math.round(enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) / enrollments.length)
                        : 0
                      }%
                    </div>
                    <div className="text-muted small">Progress</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm mt-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-primary" 
                    onClick={handleBrowseCourses}
                  >
                    <i className="fas fa-book me-2"></i>
                    Browse Courses
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={() => navigate('/progress')}
                  >
                    <i className="fas fa-chart-line me-2"></i>
                    My Progress
                  </Button>
                  <Button 
                    variant="outline-info" 
                    onClick={handleOpenReviewModal}
                    className="d-flex align-items-center justify-content-center gap-2"
                  >
                    <i className="fas fa-star"></i>
                    Write a Review
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Continue Learning Section */}
            {inProgressEnrollments.length > 0 && (
              <Card className="shadow-sm mt-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Continue Learning</h5>
                </Card.Header>
                <Card.Body>
                  {inProgressEnrollments.slice(0, 3).map(enrollment => {
                    const courseAction = getCourseAction(enrollment);
                    return (
                      <div key={enrollment._id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                        <div className="flex-grow-1">
                          <h6 className="mb-1" style={{fontSize: '0.9rem'}}>
                            {enrollment.course?.title || 'Untitled Course'}
                          </h6>
                          <div className="d-flex align-items-center">
                            <div className="progress flex-grow-1 me-2" style={{height: '6px'}}>
                              <div 
                                className="progress-bar"
                                style={{ width: `${enrollment.progress || 0}%` }}
                              ></div>
                            </div>
                            <small className="text-muted">{enrollment.progress || 0}%</small>
                          </div>
                        </div>
                        <Button
                          variant={courseAction.variant}
                          size="sm"
                          onClick={courseAction.handler}
                          style={{minWidth: '80px'}}
                        >
                          {courseAction.text}
                        </Button>
                      </div>
                    );
                  })}
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={8}>
            {/* Profile Form */}
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Trader Profile</h5>
                <Button 
                  variant={isEditing ? "outline-secondary" : "outline-primary"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <i className="fas fa-times me-1"></i>
                      Cancel
                    </>
                  ) : (
                    <>
                      <i className="fas fa-edit me-1"></i>
                      Edit Profile
                    </>
                  )}
                </Button>
              </Card.Header>
              <Card.Body>
                {isEditing ? (
                  <Form onSubmit={handleSubmit}>
                    {/* Profile Picture Upload Section */}
                    <Row className="mb-4">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Profile Picture</Form.Label>
                          <div className="d-flex align-items-center">
                            {formData.profilePicture?.url ? (
                              <Image
                                src={formData.profilePicture.url}
                                roundedCircle
                                style={{width: '60px', height: '60px', objectFit: 'cover'}}
                                className="me-3"
                                alt="Current profile"
                                onError={handleImageError}
                              />
                            ) : (
                              <div 
                                className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{width: '60px', height: '60px', fontSize: '1.2rem'}}
                              >
                                {getInitials()}
                              </div>
                            )}
                            <div className="flex-grow-1">
                              <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                              />
                              <Form.Text className="text-muted">
                                Upload a profile picture (JPG, PNG, max 5MB)
                              </Form.Text>
                            </div>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="Enter first name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Enter last name"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Enter primary phone number"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Alternate Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone2"
                            value={formData.phone2}
                            onChange={handleInputChange}
                            placeholder="Enter alternate phone number"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Birthday</Form.Label>
                          <Form.Control
                            type="date"
                            name="birthday"
                            value={formData.birthday}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Discord ID</Form.Label>
                          <Form.Control
                            type="text"
                            name="discordId"
                            value={formData.discordId}
                            onChange={handleInputChange}
                            placeholder="Enter your Discord ID"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>TradingView ID</Form.Label>
                      <Form.Control
                        type="text"
                        name="tradingViewId"
                        value={formData.tradingViewId}
                        onChange={handleInputChange}
                        placeholder="Enter your TradingView ID"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Trading Segment</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          name="tradingSegment"
                          value="Stock"
                          checked={formData.tradingSegment === 'Stock'}
                          onChange={handleInputChange}
                          label="Stock"
                        />
                        <Form.Check
                          inline
                          type="radio"
                          name="tradingSegment"
                          value="Options"
                          checked={formData.tradingSegment === 'Options'}
                          onChange={handleInputChange}
                          label="Options"
                        />
                        <Form.Check
                          inline
                          type="radio"
                          name="tradingSegment"
                          value="Forex"
                          checked={formData.tradingSegment === 'Forex'}
                          onChange={handleInputChange}
                          label="Forex"
                        />
                      </div>
                    </Form.Group>

                    {/* Additional Profile Fields */}
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Subscriber Status</Form.Label>
                          <Form.Control
                            type="text"
                            name="emailSubscriberStatus"
                            value={formData.emailSubscriberStatus}
                            onChange={handleInputChange}
                            placeholder="Email subscription status"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>SMS Subscriber Status</Form.Label>
                          <Form.Control
                            type="text"
                            name="smsSubscriberStatus"
                            value={formData.smsSubscriberStatus}
                            onChange={handleInputChange}
                            placeholder="SMS subscription status"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Source</Form.Label>
                          <Form.Control
                            type="text"
                            name="source"
                            value={formData.source}
                            onChange={handleInputChange}
                            placeholder="How did you find us?"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Language</Form.Label>
                          <Form.Control
                            type="text"
                            name="language"
                            value={formData.language}
                            onChange={handleInputChange}
                            placeholder="Preferred language"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Activity</Form.Label>
                          <Form.Control
                            type="text"
                            name="lastActivity"
                            value={formData.lastActivity}
                            onChange={handleInputChange}
                            placeholder="Last activity description"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Activity Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="lastActivityDate"
                            value={formData.lastActivityDate}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Labels</Form.Label>
                      <Form.Control
                        type="text"
                        name="labels"
                        value={formData.labels.join(', ')}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          labels: e.target.value.split(',').map(label => label.trim()).filter(label => label)
                        }))}
                        placeholder="Enter labels separated by commas"
                      />
                      <Form.Text className="text-muted">
                        Separate multiple labels with commas
                      </Form.Text>
                    </Form.Group>

                    {/* Address Sections */}
                    <h6 className="border-bottom pb-2">Primary Address</h6>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Street</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleInputChange}
                            placeholder="Enter street address"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleInputChange}
                            placeholder="Enter city"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleInputChange}
                            placeholder="Enter state"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>ZIP Code</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleInputChange}
                            placeholder="Enter ZIP code"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Country</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.country"
                            value={formData.address.country}
                            onChange={handleInputChange}
                            placeholder="Enter country"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6 className="border-bottom pb-2 mt-4">Secondary Address</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Address Type</Form.Label>
                          <Form.Select
                            name="address2.type"
                            value={formData.address2.type}
                            onChange={handleInputChange}
                          >
                            <option value="">Select type</option>
                            <option value="BILLING">Billing</option>
                            <option value="SHIPPING">Shipping</option>
                            <option value="OTHER">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Street</Form.Label>
                          <Form.Control
                            type="text"
                            name="address2.street"
                            value={formData.address2.street}
                            onChange={handleInputChange}
                            placeholder="Enter street address"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            name="address2.city"
                            value={formData.address2.city}
                            onChange={handleInputChange}
                            placeholder="Enter city"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control
                            type="text"
                            name="address2.state"
                            value={formData.address2.state}
                            onChange={handleInputChange}
                            placeholder="Enter state"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>ZIP Code</Form.Label>
                          <Form.Control
                            type="text"
                            name="address2.zipCode"
                            value={formData.address2.zipCode}
                            onChange={handleInputChange}
                            placeholder="Enter ZIP code"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Country</Form.Label>
                          <Form.Control
                            type="text"
                            name="address2.country"
                            value={formData.address2.country}
                            onChange={handleInputChange}
                            placeholder="Enter country"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6 className="border-bottom pb-2 mt-4">Tertiary Address</h6>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Street</Form.Label>
                          <Form.Control
                            type="text"
                            name="address3.street"
                            value={formData.address3.street}
                            onChange={handleInputChange}
                            placeholder="Enter street address"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2">
                      <Button type="submit" variant="primary" disabled={loading || uploading}>
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : 'Save Changes'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline-secondary"
                        onClick={() => setIsEditing(false)}
                        disabled={loading || uploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <div>
                    {/* Profile Picture Display */}
                    <Row className="mb-4">
                      <Col md={12}>
                        <div className="d-flex align-items-center">
                          {getProfilePicture() ? (
                            <Image
                              src={getProfilePicture()}
                              roundedCircle
                              style={{width: '80px', height: '80px', objectFit: 'cover'}}
                              className="me-4"
                              alt="Profile"
                              onError={(e) => {
                                console.log('Image failed to load, showing initials');
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div 
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-4"
                              style={{width: '80px', height: '80px', fontSize: '1.8rem'}}
                            >
                              {getInitials()}
                            </div>
                          )}
                          <div>
                            <h5 className="mb-1">
                              {profile?.profile?.firstName || 'Not provided'} {profile?.profile?.lastName || ''}
                            </h5>
                            <p className="text-muted mb-0">{user?.email}</p>
                            {profile?.profile?.badge && (
                              <Badge 
                                bg={getBadgeVariant(profile.profile.badge)}
                                className="mt-1"
                              >
                                {profile.profile.badge} Trader
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col sm={6}>
                        <div className="mb-3">
                          <strong>First Name:</strong>
                          <div>{profile?.profile?.firstName || 'Not provided'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Last Name:</strong>
                          <div>{profile?.profile?.lastName || 'Not provided'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Phone:</strong>
                          <div>{profile?.profile?.phone || 'Not provided'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Alternate Phone:</strong>
                          <div>{profile?.profile?.phone2 || 'Not provided'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Birthday:</strong>
                          <div>
                            {profile?.profile?.birthday ? 
                              formatDate(profile.profile.birthday) : 
                              'Not provided'
                            }
                          </div>
                        </div>
                        <div className="mb-3">
                          <strong>Language:</strong>
                          <div>{profile?.profile?.language || 'Not provided'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Source:</strong>
                          <div>{profile?.profile?.source || 'Not provided'}</div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-3">
                          <strong>TradingView ID:</strong>
                          <div>{profile?.profile?.tradingViewId || 'Not provided'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Discord ID:</strong>
                          <div>{profile?.profile?.discordId || 'Not provided'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Trading Segment:</strong>
                          <div>{profile?.profile?.tradingSegment || 'Not selected'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Last Activity:</strong>
                          <div>{profile?.profile?.lastActivity || 'Not provided'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Last Activity Date:</strong>
                          <div>
                            {profile?.profile?.lastActivityDate ? 
                              formatDate(profile.profile.lastActivityDate) : 
                              'Not provided'
                            }
                          </div>
                        </div>
                        <div className="mb-3">
                          <strong>Member Since:</strong>
                          <div>
                            {user?.createdAt ? 
                              formatDate(user.createdAt) : 
                              'N/A'
                            }
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* Subscription Status */}
                    <Row className="mt-3">
                      <Col sm={6}>
                        <div className="mb-3">
                          <strong>Email Subscriber Status:</strong>
                          <div>{profile?.profile?.emailSubscriberStatus || 'Not provided'}</div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-3">
                          <strong>SMS Subscriber Status:</strong>
                          <div>{profile?.profile?.smsSubscriberStatus || 'Not provided'}</div>
                        </div>
                      </Col>
                    </Row>

                    {/* Labels */}
                    {profile?.profile?.labels && profile.profile.labels.length > 0 && (
                      <div className="mb-3">
                        <strong>Labels:</strong>
                        <div className="mt-1">
                          {profile.profile.labels.map((label, index) => (
                            <Badge key={index} bg="secondary" className="me-1 mb-1">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Address Information */}
                    {profile?.profile?.address && (
                      <div className="mt-4">
                        <h6>Primary Address</h6>
                        <Row>
                          <Col sm={6}>
                            <div className="mb-2">
                              <strong>Street:</strong>
                              <div>{profile.profile.address.street || 'Not provided'}</div>
                            </div>
                            <div className="mb-2">
                              <strong>City:</strong>
                              <div>{profile.profile.address.city || 'Not provided'}</div>
                            </div>
                            <div className="mb-2">
                              <strong>State:</strong>
                              <div>{profile.profile.address.state || 'Not provided'}</div>
                            </div>
                          </Col>
                          <Col sm={6}>
                            <div className="mb-2">
                              <strong>ZIP Code:</strong>
                              <div>{profile.profile.address.zipCode || 'Not provided'}</div>
                            </div>
                            <div className="mb-2">
                              <strong>Country:</strong>
                              <div>{profile.profile.address.country || 'Not provided'}</div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {profile?.profile?.address2 && profile.profile.address2.street && (
                      <div className="mt-4">
                        <h6>Secondary Address ({profile.profile.address2.type || 'No type'})</h6>
                        <Row>
                          <Col sm={6}>
                            <div className="mb-2">
                              <strong>Street:</strong>
                              <div>{profile.profile.address2.street || 'Not provided'}</div>
                            </div>
                            <div className="mb-2">
                              <strong>City:</strong>
                              <div>{profile.profile.address2.city || 'Not provided'}</div>
                            </div>
                            <div className="mb-2">
                              <strong>State:</strong>
                              <div>{profile.profile.address2.state || 'Not provided'}</div>
                            </div>
                          </Col>
                          <Col sm={6}>
                            <div className="mb-2">
                              <strong>ZIP Code:</strong>
                              <div>{profile.profile.address2.zipCode || 'Not provided'}</div>
                            </div>
                            <div className="mb-2">
                              <strong>Country:</strong>
                              <div>{profile.profile.address2.country || 'Not provided'}</div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {profile?.profile?.address3 && profile.profile.address3.street && (
                      <div className="mt-4">
                        <h6>Tertiary Address</h6>
                        <div className="mb-2">
                          <strong>Street:</strong>
                          <div>{profile.profile.address3.street}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Enrollments Table */}
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">My Courses</h5>
              </Card.Header>
              <Card.Body>
                {enrollments.length > 0 ? (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map(enrollment => {
                        const courseAction = getCourseAction(enrollment);
                        return (
                          <tr key={enrollment._id}>
                            <td>
                              <strong>{enrollment.course?.title || 'Untitled Course'}</strong>
                              <div>
                                <small className="text-muted">
                                  Enrolled: {formatDate(enrollment.enrollmentDate)}
                                </small>
                              </div>
                            </td>
                            <td style={{width: '200px'}}>
                              <div className="d-flex align-items-center">
                                <div className="progress flex-grow-1 me-2" style={{height: '8px'}}>
                                  <div 
                                    className={`progress-bar bg-${getProgressVariant(enrollment.progress || 0)}`}
                                    style={{ width: `${enrollment.progress || 0}%` }}
                                  ></div>
                                </div>
                                <small>{enrollment.progress || 0}%</small>
                              </div>
                            </td>
                            <td>
                              <Badge bg={getProgressVariant(enrollment.progress || 0)}>
                                {getProgressText(enrollment.progress || 0)}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant={courseAction.variant}
                                size="sm"
                                onClick={courseAction.handler}
                              >
                                {courseAction.text}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-3">You haven't enrolled in any courses yet.</p>
                    <Button variant="primary" onClick={handleBrowseCourses}>
                      Browse Courses
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Review Modal */}
      <ReviewModal
        show={showReviewModal}
        onHide={handleCloseReviewModal}
        user={user}
        profile={profile}
      />
    </div>
  );
};

export default Traders;