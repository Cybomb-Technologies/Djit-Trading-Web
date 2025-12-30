import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Image, Table, Toast, ToastContainer } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, ChartPie, Star, Edit2, Camera, Save, X, FileText, CheckCircle, Clock } from 'lucide-react';
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

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  const showToast = (message, variant = 'success') => {
    setToast({ show: true, message, variant });
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    phone2: '',
    birthday: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    address2: { type: '', street: '', city: '', state: '', zipCode: '', country: '' },
    address3: { street: '' },
    tradingViewId: '',
    tradingSegment: '',
    discordId: '',
    profilePicture: { url: '', filename: '' },
    emailSubscriberStatus: '',
    smsSubscriberStatus: '',
    source: '',
    language: '',
    lastActivity: '',
    lastActivityDate: '',
    labels: []
  });

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

        const userProfile = profileRes.data.user || profileRes.data;
        setProfile(userProfile);

        if (userProfile.profile) {
          setFormData({
            firstName: userProfile.profile.firstName || '',
            lastName: userProfile.profile.lastName || '',
            phone: userProfile.profile.phone || '',
            phone2: userProfile.profile.phone2 || '',
            birthday: userProfile.profile.birthday ? new Date(userProfile.profile.birthday).toISOString().split('T')[0] : '',
            address: userProfile.profile.address || { street: '', city: '', state: '', zipCode: '', country: '' },
            address2: userProfile.profile.address2 || { type: '', street: '', city: '', state: '', zipCode: '', country: '' },
            address3: userProfile.profile.address3 || { street: '' },
            tradingViewId: userProfile.profile.tradingViewId || '',
            tradingSegment: userProfile.profile.tradingSegment || '',
            discordId: userProfile.profile.discordId || '',
            profilePicture: userProfile.profile.profilePicture || { url: '', filename: '' },
            emailSubscriberStatus: userProfile.profile.emailSubscriberStatus || '',
            smsSubscriberStatus: userProfile.profile.smsSubscriberStatus || '',
            source: userProfile.profile.source || '',
            language: userProfile.profile.language || '',
            lastActivity: userProfile.profile.lastActivity || '',
            lastActivityDate: userProfile.profile.lastActivityDate ? new Date(userProfile.profile.lastActivityDate).toISOString().split('T')[0] : '',
            labels: userProfile.profile.labels || []
          });
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
    } else if (name.startsWith('address2.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, address2: { ...prev.address2, [field]: value } }));
    } else if (name.startsWith('address3.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, address3: { ...prev.address3, [field]: value } }));
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
        showToast('Profile picture uploaded successfully!');
        setImageError(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to upload profile picture', 'danger');
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
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to update profile', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const getProfilePicture = () => {
    if (profile?.profile?.profilePicture?.url) {
      let url = profile.profile.profilePicture.url;
      // Construct base URL from API_URL (remove /api suffix if present)
      const baseUrl = API_URL.replace(/\/api\/?$/, '');

      // Patch: Fix "yourdomain.com" if it exists in the URL (legacy/misconfigured env data)
      if (url.includes('yourdomain.com')) {
        url = url.replace(/https?:\/\/yourdomain\.com/, baseUrl);
      }

      // If absolute URL (and not yourdomain.com which we just fixed), return as is
      if (url.startsWith('http')) return url;

      // Sanitize Windows backslashes to forward slashes
      url = url.replace(/\\/g, '/');

      // Ensure URL starts with / if it doesn't
      if (!url.startsWith('/')) {
        url = `/${url}`;
      }

      const finalUrl = `${baseUrl}${url}`;
      console.log("Profile Picture URL:", finalUrl); // Debug log
      return finalUrl;
    }
    return null;
  };

  const getInitials = () => {
    if (profile?.profile?.firstName) {
      return `${profile.profile.firstName[0]}${profile.profile.lastName ? profile.profile.lastName[0] : ''}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>;
  if (!isAuthenticated) return <div className={styles.notAuthenticated}>Please log in to view your profile.</div>;

  const completed = enrollments.filter(e => e.progress === 100).length;
  const progressAvg = enrollments.length > 0 ? Math.round(enrollments.reduce((a, b) => a + (b.progress || 0), 0) / enrollments.length) : 0;

  return (
    <div className={styles.tradersPage}>
      {/* Helper Toast Container */}
      <ToastContainer className="p-3" style={{ zIndex: 99999, position: 'fixed', top: '100px', right: '20px' }}>
        <Toast
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          delay={3000}
          autohide
          style={{
            background: toast.variant === 'danger' ? '#dc3545' : 'linear-gradient(135deg, #182724 0%, #14B8A6 100%)',
            color: 'white',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            fontFamily: "'Poppins', sans-serif"
          }}
        >
          <Toast.Header closeButton={false} style={{ background: 'rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <strong className="me-auto" style={{ fontSize: '0.95rem' }}>
              {toast.variant === 'danger' ? 'Error' : 'Success'}
            </strong>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => setToast({ ...toast, show: false })}
              aria-label="Close"
            ></button>
          </Toast.Header>
          <Toast.Body className="text-white" style={{ fontSize: '0.9rem' }}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
      <Container className="position-relative">
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
                      onError={(e) => {
                        console.error("Image load error:", e.target.src);
                        setImageError(true);
                      }}
                    />
                  ) : (
                    <div className={styles.avatar}>{getInitials()}</div>
                  )}
                  {isEditing && (
                    <div className="position-absolute bottom-0 end-0">
                      <label className="btn btn-sm btn-light rounded-circle shadow-sm p-1" style={{ cursor: 'pointer' }}>
                        <Camera size={16} className="text-dark" />
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
                  <div className="text-center">
                    <span className={styles.statNumber}>{enrollments.length}</span>
                    <div className={styles.statLabel}>Courses</div>
                  </div>
                  <div className="text-center">
                    <span className={styles.statNumber}>{completed}</span>
                    <div className={styles.statLabel}>Done</div>
                  </div>
                  <div className="text-center">
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
                  <BookOpen size={20} /> Browse Courses
                </button>
                <button className={styles.actionBtn} onClick={() => navigate('/progress')}>
                  <ChartPie size={20} /> My Progress
                </button>
                <button className={styles.actionBtn} onClick={() => setShowReviewModal(true)}>
                  <Star size={20} /> Write a Review
                </button>
              </div>
            </div>
          </Col>

          <Col lg={8}>
            {/* Trader Profile Form / Details */}
            <div className={styles.detailsCard}>
              <div className={styles.cardHeader + " d-flex justify-content-between align-items-center"}>
                <h5>Trader Profile</h5>
                <Button
                  className={isEditing ? styles.outlineBtn : styles.primaryBtn}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <><X size={14} className="me-2" /> Cancel</> : <><Edit2 size={14} className="me-2" /> Edit Profile</>}
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
                        <Form.Label className={styles.formLabel}>Alt. Phone</Form.Label>
                        <Form.Control className={styles.formControl} type="tel" name="phone2" value={formData.phone2} onChange={handleInputChange} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>Birthday</Form.Label>
                        <Form.Control className={styles.formControl} type="date" name="birthday" value={formData.birthday} onChange={handleInputChange} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>Trading Segment</Form.Label>
                        <div className="mt-2">
                          <Form.Check inline type="radio" name="tradingSegment" value="Stock" label="Stock" checked={formData.tradingSegment === 'Stock'} onChange={handleInputChange} />
                          <Form.Check inline type="radio" name="tradingSegment" value="Options" label="Options" checked={formData.tradingSegment === 'Options'} onChange={handleInputChange} />
                          <Form.Check inline type="radio" name="tradingSegment" value="Forex" label="Forex" checked={formData.tradingSegment === 'Forex'} onChange={handleInputChange} />
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>TradingView ID</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="tradingViewId" value={formData.tradingViewId} onChange={handleInputChange} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>Discord ID</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="discordId" value={formData.discordId} onChange={handleInputChange} />
                      </Col>
                      <Col md={12} className="mb-3">
                        <Form.Label className={styles.formLabel}>Labels (comma separated)</Form.Label>
                        <Form.Control
                          className={styles.formControl}
                          type="text"
                          name="labels"
                          value={formData.labels.join(', ')}
                          onChange={(e) => setFormData(prev => ({ ...prev, labels: e.target.value.split(',').map(l => l.trim()).filter(Boolean) }))}
                        />
                      </Col>
                    </Row>

                    <h6 className={styles.sectionTitle}>Primary Address</h6>
                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Label className={styles.formLabel}>Street</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="address.street" value={formData.address.street} onChange={handleInputChange} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>City</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="address.city" value={formData.address.city} onChange={handleInputChange} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>State</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="address.state" value={formData.address.state} onChange={handleInputChange} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>Zip Code</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleInputChange} />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>Country</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="address.country" value={formData.address.country} onChange={handleInputChange} />
                      </Col>
                    </Row>

                    <h6 className={styles.sectionTitle}>Secondary Address</h6>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>Type</Form.Label>
                        <Form.Select className={styles.formControl} name="address2.type" value={formData.address2.type} onChange={handleInputChange}>
                          <option value="">Select Type</option>
                          <option value="BILLING">Billing</option>
                          <option value="SHIPPING">Shipping</option>
                        </Form.Select>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className={styles.formLabel}>Street</Form.Label>
                        <Form.Control className={styles.formControl} type="text" name="address2.street" value={formData.address2.street} onChange={handleInputChange} />
                      </Col>
                    </Row>

                    <div className="text-end mt-4">
                      <Button type="submit" className={styles.primaryBtn} disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" /> : <><Save size={16} className="me-2" /> Save Changes</>}
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <div className="profile-details">
                    <Row>
                      <Col md={6} className={styles.detailRow}>
                        <span className={styles.detailLabel}>Full Name</span>
                        <span className={styles.detailValue}>{formData.firstName} {formData.lastName || '-'}</span>
                      </Col>
                      <Col md={6} className={styles.detailRow}>
                        <span className={styles.detailLabel}>Email</span>
                        <span className={styles.detailValue}>{user?.email}</span>
                      </Col>
                      <Col md={6} className={styles.detailRow}>
                        <span className={styles.detailLabel}>Phone</span>
                        <span className={styles.detailValue}>{formData.phone || '-'}</span>
                      </Col>
                      <Col md={6} className={styles.detailRow}>
                        <span className={styles.detailLabel}>Trading Segment</span>
                        <span className={styles.detailValue}>{formData.tradingSegment || '-'}</span>
                      </Col>
                      <Col md={6} className={styles.detailRow}>
                        <span className={styles.detailLabel}>TradingView ID</span>
                        <span className={styles.detailValue}>{formData.tradingViewId || '-'}</span>
                      </Col>
                      <Col md={6} className={styles.detailRow}>
                        <span className={styles.detailLabel}>Discord ID</span>
                        <span className={styles.detailValue}>{formData.discordId || '-'}</span>
                      </Col>
                      <Col md={6} className={styles.detailRow}>
                        <span className={styles.detailLabel}>Joined</span>
                        <span className={styles.detailValue}>{formatDate(user?.createdAt)}</span>
                      </Col>
                      {formData.labels && formData.labels.length > 0 && (
                        <Col md={12} className={styles.detailRow}>
                          <span className={styles.detailLabel}>Labels</span>
                          <div className="mt-1">
                            {formData.labels.map((l, i) => (
                              <span key={i} className={styles.labelBadge}>{l}</span>
                            ))}
                          </div>
                        </Col>
                      )}
                    </Row>

                    {formData.address && formData.address.street && (
                      <>
                        <div className={styles.sectionTitle}>Primary Address</div>
                        <Row>
                          <Col md={12}><span className={styles.detailValue}>{formData.address.street}, {formData.address.city}, {formData.address.state} {formData.address.zipCode}, {formData.address.country}</span></Col>
                        </Row>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* My Courses Table */}
            <div className={styles.enrollmentsCard}>
              <div className={styles.cardHeader}>
                <h5>My Courses</h5>
              </div>
              <div className={styles.cardBody}>
                {enrollments.length > 0 ? (
                  <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Progress</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.map(enrollment => (
                          <tr key={enrollment._id}>
                            <td>
                              <div className="fw-bold">{enrollment.course?.title || 'Untitled Course'}</div>
                              <small className="text-muted">Enrolled: {formatDate(enrollment.enrollmentDate)}</small>
                            </td>
                            <td style={{ width: '30%' }}>
                              <div className="d-flex align-items-center">
                                <div className={styles.progressBar}>
                                  <div className={styles.progressFill} style={{ width: `${enrollment.progress || 0}%` }}></div>
                                </div>
                                <span className={styles.progressLabel}>{enrollment.progress || 0}%</span>
                              </div>
                            </td>
                            <td>
                              {enrollment.progress === 100 ? (
                                <span className="text-success fw-bold"><CheckCircle size={14} className="me-1" /> Completed</span>
                              ) : enrollment.progress > 0 ? (
                                <span className="text-primary fw-bold"><Clock size={14} className="me-1" /> In Progress</span>
                              ) : (
                                <span className="text-muted">Not Started</span>
                              )}
                            </td>
                            <td>
                              <Button
                                className={enrollment.progress === 100 ? styles.outlineBtn : styles.primaryBtn}
                                size="sm"
                                onClick={() => navigate(`/learning/${enrollment.course?._id || enrollment.course}`)}
                              >
                                {enrollment.progress === 100 ? 'Review' : 'Continue'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-3">You haven't enrolled in any courses yet.</p>
                    <Button className={styles.primaryBtn} onClick={() => navigate('/courses')}>
                      Browse Courses
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <ReviewModal
        show={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        user={user}
        profile={profile}
      />
    </div>
  );
};

export default Traders;