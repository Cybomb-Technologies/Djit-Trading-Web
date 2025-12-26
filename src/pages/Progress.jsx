import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ProgressBar, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Progress.module.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Progress = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const getUserId = () => {
    if (!user) return null;
    return user.id || user._id || user.userId || user.userID;
  };

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_URL}/api/enrollments/user/${getUserId()}`, config);
        setEnrollments(res.data.enrollments || res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load progress');
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [isAuthenticated, user]);

  // Stats Calculation
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.progress === 100).length;
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
  const avgProgress = totalCourses > 0 ? Math.round(enrollments.reduce((a, b) => a + (b.progress || 0), 0) / totalCourses) : 0;

  const filtered = enrollments.filter(e => {
    if (filter === 'completed') return e.progress === 100;
    if (filter === 'in-progress') return e.progress > 0 && e.progress < 100;
    if (filter === 'not-started') return e.progress === 0;
    return true;
  });

  const getStatusBadge = (progress) => {
    if (progress === 100) return <Badge bg="success" className={styles.statusBadge}>Completed</Badge>;
    if (progress > 0) return <Badge bg="warning" text="dark" className={styles.statusBadge}>In Progress</Badge>;
    return <Badge bg="secondary" className={styles.statusBadge}>Not Started</Badge>;
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>;
  if (!isAuthenticated) return <div className="text-center py-5">Please log in.</div>;

  return (
    <div className={styles.progressPage}>
      <Container>
        {/* Header */}
        <div className={styles.pageHeader + " d-flex justify-content-between align-items-center"}>
          <div>
            <h1 className={styles.pageTitle}>My Learning Progress</h1>
            <p className={styles.pageSubtitle}>Track your course progress and achievements</p>
          </div>
          <Button className={styles.outlineBtn} onClick={() => navigate('/traders')}>
            <i className="fas fa-arrow-left me-2"></i> Back to Profile
          </Button>
        </div>

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className={styles.statsCard}>
              <Card.Body className={styles.statsBody}>
                <div className={styles.statsNumber}>{totalCourses}</div>
                <div className={styles.statsLabel}>Total Courses</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className={styles.statsCard}>
              <Card.Body className={styles.statsBody}>
                <div className={styles.statsNumber}>{completedCourses}</div>
                <div className={styles.statsLabel}>Completed</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className={styles.statsCard}>
              <Card.Body className={styles.statsBody}>
                <div className={styles.statsNumber}>{inProgressCourses}</div>
                <div className={styles.statsLabel}>In Progress</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className={styles.statsCard}>
              <Card.Body className={styles.statsBody}>
                <div className={styles.statsNumber}>{avgProgress}%</div>
                <div className={styles.statsLabel}>Avg Progress</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Course List */}
        <Card className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h5 className={styles.cardTitle}>Course Details</h5>
            <div className="d-flex gap-2 flex-wrap">
              {['all', 'in-progress', 'completed', 'not-started'].map(f => (
                <button
                  key={f}
                  className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : styles.filterBtnInactive}`}
                  onClick={() => setFilter(f)}
                >
                  {f.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
          <Card.Body className={styles.cardBody}>
            {filtered.length > 0 ? (
              <Table responsive className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(enrollment => (
                    <tr key={enrollment._id}>
                      <td width="40%">
                        <div className={styles.courseTitle}>{enrollment.course?.title || 'Unknown Course'}</div>
                      </td>
                      <td width="30%">
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar
                            now={enrollment.progress || 0}
                            className={styles.progressBar}
                            style={{ flexGrow: 1 }}
                            variant="info"
                          />
                          <span className="small fw-bold">{enrollment.progress || 0}%</span>
                        </div>
                      </td>
                      <td>{getStatusBadge(enrollment.progress || 0)}</td>
                      <td>
                        <Button
                          className={styles.primaryBtn}
                          size="sm"
                          onClick={() => navigate(`/learning/${enrollment.course?._id || enrollment.course}`)}
                        >
                          {enrollment.progress === 100 ? 'Review' : 'Continue'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-5 text-muted">
                <p>No courses found in this category.</p>
                <Button className={styles.primaryBtn} onClick={() => navigate('/courses')}>
                  Browse Courses
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Learning Tips (Replaced Emojis with Icons) */}
        {enrollments.length > 0 && (
          <Card className={`${styles.contentCard} ${styles.tipsCard}`}>
            <div className={styles.cardHeader + " " + styles.tipsHeader}>
              <h5 className={styles.cardTitle}>Learning Tips</h5>
            </div>
            <Card.Body className={styles.cardBody}>
              <Row>
                <Col md={4} className="text-center mb-3 mb-md-0">
                  <i className={`fas fa-bullseye ${styles.tipIcon}`}></i>
                  <h6 className={styles.tipTitle}>Set Clear Goals</h6>
                  <p className={styles.tipText}>Define achievements to stay motivated.</p>
                </Col>
                <Col md={4} className="text-center mb-3 mb-md-0">
                  <i className={`fas fa-clock ${styles.tipIcon}`}></i>
                  <h6 className={styles.tipTitle}>Consistent Practice</h6>
                  <p className={styles.tipText}>Regular short sessions work best.</p>
                </Col>
                <Col md={4} className="text-center">
                  <i className={`fas fa-sync ${styles.tipIcon}`}></i>
                  <h6 className={styles.tipTitle}>Review Regularly</h6>
                  <p className={styles.tipText}>Revisit lessons to reinforce learning.</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default Progress;