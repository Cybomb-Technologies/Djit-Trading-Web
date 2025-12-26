import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Image } from 'react-bootstrap';
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
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    phone2: '',
    birthday: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    tradingViewId: '',
    tradingSegment: '',
    discordId: '',
    profilePicture: { url: '', filename: '' }
  });

  const getUserId = () => {
    if (!user) return null;
    return user.id || user._id || user.userId || user.userID;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return setLoading(false);
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const userId = getUserId();

        const [profileRes, enrollmentsRes] = await Promise.all([
          axios.get(`${API_URL}/api/users/me`, config).catch(() =>
            axios.get(`${API_URL}/api/users/${userId}`, config)
          ),
          axios.get(`${API_URL}/api/enrollments/user/${userId}`, config)
        ]);

        setProfile(profileRes.data.user || profileRes.data);
        const userProfile = profileRes.data.user || profileRes.data;

        if (userProfile.profile) {
          setFormData(prev => ({
            ...prev,
            ...userProfile.profile,
            birthday: userProfile.profile.birthday ? new Date(userProfile.profile.birthday).toISOString().split('T')[0] : ''
          }));
        }

        setEnrollments(enrollmentsRes.data.enrollments || enrollmentsRes.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('profilePicture', file);

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/users/upload-profile-picture`, uploadData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setFormData(prev => ({ ...prev, profilePicture: res.data.profilePicture }));
        setProfile(prev => ({
          ...prev,
          profile: { ...prev.profile, profilePicture: res.data.profilePicture }
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/api/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setProfile(res.data.user);
        setIsEditing(false);
      }
    } catch (err) {
      alert('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const getProfilePicture = () => {
    if (profile?.profile?.profilePicture?.url) {
      let url = profile.profile.profilePicture.url;
      if (url.startsWith('/uploads/')) {
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || API_URL;
        url = `${backendUrl}${url}`;
      }
      return url;
    }
    return null;
  };

  const getInitials = () => {
    if (profile?.profile?.firstName) {
      return `${profile.profile.firstName[0]}${profile.profile.lastName ? profile.profile.lastName[0] : ''}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>;
  if (!isAuthenticated) return <div className={styles.notAuthenticated}>Please log in to view your profile.</div>;

  const completed = enrollments.filter(e => e.progress === 100).length;
  const progressAvg = enrollments.length > 0 ? Math.round(enrollments.reduce((a, b) => a + (b.progress || 0), 0) / enrollments.length) : 0;

  return (
    <div className={styles.tradersPage}>
      <Container>
        <Row>
          <Col lg={4}>
            {/* Profile Card */}
            <div className={styles.profileCard}>
              <div className={styles.cardBody + " text-center"}>
                <div className="position-relative d-inline-block mb-3">
                  {getProfilePicture() && !imageError ? (
                    <img
                      src={getProfilePicture()}
                      className={styles.profileImage}
                      alt="Profile"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className={styles.avatar}>{getInitials()}</div>
                  )}
                  {isEditing && (
                    <div className="position-absolute bottom-0 end-0">
                      <label className="btn btn-sm btn-light rounded-circle shadow-sm p-1" style={{ cursor: 'pointer' }}>
                        <i className="fas fa-camera text-dark"></i>
                        <input type="file" hidden onChange={handleFileUpload} />
                      </label>
                    </div>
                  )}
                </div>

                <h4 className={styles.username}>{user?.username}</h4>
                <p className={styles.email}>{user?.email}</p>

                {profile?.profile?.badge && (
                  <span className={styles.badge}>
                    {profile.profile.badge} Trader
                  </span>
                )}

                <div className={styles.stats}>
                  <div>
                    <span className={styles.statNumber}>{enrollments.length}</span>
                    <div className={styles.statLabel}>Courses</div>
                  </div>
                  <div>
                    <span className={styles.statNumber}>{completed}</span>
                    <div className={styles.statLabel}>Done</div>
                  </div>
                  <div>
                    <span className={styles.statNumber}>{progressAvg}%</span>
                    <div className={styles.statLabel}>Avg</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.actionsCard}>
              <div className={styles.cardHeader}>
                <h5>Quick Actions</h5>
              </div>
              <div className={styles.cardBody}>
                <button className={styles.actionBtn} onClick={() => navigate('/courses')}>
                  <i className="fas fa-book"></i> Browse Courses
                </button>
                <button className={styles.actionBtn} onClick={() => navigate('/progress')}>
                  <i className="fas fa-chart-line"></i> My Progress
                </button>
                <button className={styles.actionBtn} onClick={() => setShowReviewModal(true)}>
                  <i className="fas fa-star"></i> Write a Review
                </button>
              </div>
            </div>
          </Col>

          <Col lg={8}>
            <div className={styles.detailsCard}>
              <div className={styles.cardHeader + " d-flex justify-content-between align-items-center"}>
                <h5>Trader Profile</h5>
                <Button
                  className={isEditing ? styles.outlineBtn : styles.primaryBtn}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
              <div className={styles.cardBody}>
                {isEditing ? (
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>First Name</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>Last Name</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>Phone</Form.Label>
                        <Form.Control className={styles.formControl} type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>TradingView ID</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="tradingViewId" value={formData.tradingViewId} onChange={handleInputChange} />
                      </Col>
                    </Row>
                    <div className="text-end mt-3">
                      <Button type="submit" className={styles.primaryBtn}>Save Changes</Button>
                    </div>
                  </Form>
                ) : (
                  <div className="profile-details">
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Full Name</span>
                      <span className={styles.detailValue}>{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Email</span>
                      <span className={styles.detailValue}>{user?.email}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Phone</span>
                      <span className={styles.detailValue}>{formData.phone || '-'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>TradingView ID</span>
                      <span className={styles.detailValue}>{formData.tradingViewId || '-'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Courses */}
            {enrollments.length > 0 && (
              <div className={styles.enrollmentsCard}>
                <div className={styles.cardHeader}>
                  <h5>My Learning</h5>
                </div>
                <div className={styles.cardBody}>
                  {enrollments.slice(0, 3).map(enrollment => (
                    <div key={enrollment._id} className={styles.courseItem}>
                      <div className="flex-grow-1">
                        <div className={styles.courseTitle}>
                          {enrollment.course?.title || 'Untitled Course'}
                        </div>
                        <div className="d-flex align-items-center">
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progressFill}
                              style={{ width: `${enrollment.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="small text-muted">{enrollment.progress}%</span>
                        </div>
                      </div>
                      <Button
                        className={styles.outlineBtn}
                        size="sm"
                        onClick={() => navigate(`/learning/${enrollment.course?._id || enrollment.course}`)}
                      >
                        Continue
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      <ReviewModal show={showReviewModal} handleClose={() => setShowReviewModal(false)} />
    </div>
  );
};

export default Traders;