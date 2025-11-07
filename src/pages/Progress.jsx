import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, ProgressBar, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './Progress.module.css'

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Progress = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // 'all', 'in-progress', 'completed', 'not-started'

  // Get user ID from auth context
  const getUserId = () => {
    if (!user) return null
    return user.id || user._id || user.userId || user.userID
  }

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const token = localStorage.getItem('token')
        
        if (!token) {
          throw new Error('No authentication token found')
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }

        const response = await axios.get(`${API_URL}/api/enrollments/user/${getUserId()}`, config)
        const enrollmentsData = response.data.enrollments || response.data || []
        setEnrollments(enrollmentsData)

      } catch (error) {
        console.error('Error fetching enrollments:', error)
        const errorMessage = error.response?.data?.message || 
          error.message || 
          'Failed to load your progress. Please try again.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollments()
  }, [isAuthenticated, user])

  const filteredEnrollments = enrollments.filter(enrollment => {
    switch (filter) {
      case 'in-progress':
        return enrollment.progress > 0 && enrollment.progress < 100
      case 'completed':
        return enrollment.progress === 100 || enrollment.completed
      case 'not-started':
        return enrollment.progress === 0
      default:
        return true
    }
  })

  const getProgressVariant = (progress) => {
    if (progress === 100) return 'success'
    if (progress >= 50) return 'primary'
    if (progress > 0) return 'warning'
    return 'secondary'
  }

  const getProgressText = (progress) => {
    if (progress === 0) return 'Not Started'
    if (progress === 100) return 'Completed'
    return `In Progress (${progress}%)`
  }

  const handleContinueLearning = (courseId) => {
    if (!courseId) {
      alert('Course not found. Please try again.')
      return
    }
    navigate(`/learning/${courseId}`)
  }

  const handleBackToProfile = () => {
    navigate('/traders')
  }

  const handleBrowseCourses = () => {
    navigate('/courses')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Calculate overall statistics
  const totalCourses = enrollments.length
  const completedCourses = enrollments.filter(e => e.progress === 100 || e.completed).length
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length
  const notStartedCourses = enrollments.filter(e => e.progress === 0).length
  const averageProgress = totalCourses > 0 
    ? Math.round(enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) / totalCourses)
    : 0

  if (loading) {
    return (
      <Container className={styles.progressPage}>
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading your progress...</span>
          </Spinner>
          <p className="mt-3">Loading your learning progress...</p>
        </div>
      </Container>
    )
  }

  if (!isAuthenticated) {
    return (
      <Container className={styles.progressPage}>
        <div className="text-center py-5">
          <h2>Please log in to view your progress</h2>
          <p className="mb-4">You need to be logged in to access this page.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Log In
          </Button>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className={styles.progressPage}>
        <Alert variant="danger" className="mt-4">
          <Alert.Heading>Error Loading Progress</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline-secondary" onClick={handleBackToProfile}>
              Back to Profile
            </Button>
          </div>
        </Alert>
      </Container>
    )
  }

  return (
    <div className={styles.progressPage}>
      <Container className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h2 mb-1">My Learning Progress</h1>
                <p className="text-muted mb-0">
                  Track your course progress and learning journey
                </p>
              </div>
              <Button variant="outline-primary" onClick={handleBackToProfile}>
                Back to Profile
              </Button>
            </div>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className="text-center h-100">
              <Card.Body>
                <div className="fs-2 fw-bold text-primary">{totalCourses}</div>
                <div className="text-muted">Total Courses</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center h-100">
              <Card.Body>
                <div className="fs-2 fw-bold text-success">{completedCourses}</div>
                <div className="text-muted">Completed</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center h-100">
              <Card.Body>
                <div className="fs-2 fw-bold text-warning">{inProgressCourses}</div>
                <div className="text-muted">In Progress</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center h-100">
              <Card.Body>
                <div className="fs-2 fw-bold text-info">{averageProgress}%</div>
                <div className="text-muted">Average Progress</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Progress Overview */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-light">
                <h5 className="mb-0">Progress Overview</h5>
              </Card.Header>
              <Card.Body>
                {enrollments.length > 0 ? (
                  <div>
                    {enrollments.map(enrollment => (
                      <div key={enrollment._id} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-medium">
                            {enrollment.course?.title || 'Untitled Course'}
                          </span>
                          <span className="text-muted small">
                            {enrollment.progress || 0}%
                          </span>
                        </div>
                        <ProgressBar 
                          now={enrollment.progress || 0} 
                          variant={getProgressVariant(enrollment.progress || 0)}
                          className="mb-2"
                        />
                      </div>
                    ))}
                  </div>
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

        {/* Filter and Course List */}
        <Row>
          <Col>
            <Card>
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Course Details</h5>
                <div>
                  <Button
                    variant={filter === 'all' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="me-2"
                  >
                    All ({totalCourses})
                  </Button>
                  <Button
                    variant={filter === 'in-progress' ? 'warning' : 'outline-warning'}
                    size="sm"
                    onClick={() => setFilter('in-progress')}
                    className="me-2"
                  >
                    In Progress ({inProgressCourses})
                  </Button>
                  <Button
                    variant={filter === 'completed' ? 'success' : 'outline-success'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                    className="me-2"
                  >
                    Completed ({completedCourses})
                  </Button>
                  <Button
                    variant={filter === 'not-started' ? 'secondary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setFilter('not-started')}
                  >
                    Not Started ({notStartedCourses})
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {filteredEnrollments.length > 0 ? (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Enrollment Date</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnrollments.map(enrollment => (
                        <tr key={enrollment._id}>
                          <td>
                            <div>
                              <strong>{enrollment.course?.title || 'Untitled Course'}</strong>
                              {enrollment.course?.description && (
                                <div className="text-muted small mt-1">
                                  {enrollment.course.description.length > 100
                                    ? `${enrollment.course.description.substring(0, 100)}...`
                                    : enrollment.course.description
                                  }
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {formatDate(enrollment.enrollmentDate)}
                          </td>
                          <td style={{ width: '200px' }}>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
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
                              variant={
                                enrollment.progress === 100 ? 'outline-success' :
                                enrollment.progress > 0 ? 'primary' : 'primary'
                              }
                              size="sm"
                              onClick={() => handleContinueLearning(enrollment.course?._id || enrollment.course)}
                            >
                              {enrollment.progress === 100 ? 'Review' :
                               enrollment.progress > 0 ? 'Continue' : 'Start'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-3">
                      {filter === 'all' 
                        ? "You haven't enrolled in any courses yet."
                        : `No ${filter.replace('-', ' ')} courses found.`
                      }
                    </p>
                    {filter !== 'all' && (
                      <Button 
                        variant="outline-primary" 
                        onClick={() => setFilter('all')}
                        className="me-2"
                      >
                        View All Courses
                      </Button>
                    )}
                    <Button variant="primary" onClick={handleBrowseCourses}>
                      Browse Courses
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Learning Tips */}
        {enrollments.length > 0 && (
          <Row className="mt-4">
            <Col>
              <Card className="border-info">
                <Card.Header className="bg-info text-white">
                  <h5 className="mb-0">Learning Tips</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <div className="text-center">
                        <div className="fs-3 text-primary mb-2">🎯</div>
                        <h6>Set Clear Goals</h6>
                        <p className="small text-muted">
                          Define what you want to achieve with each course to stay motivated.
                        </p>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center">
                        <div className="fs-3 text-success mb-2">⏱️</div>
                        <h6>Consistent Practice</h6>
                        <p className="small text-muted">
                          Regular, shorter study sessions are more effective than occasional long ones.
                        </p>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center">
                        <div className="fs-3 text-warning mb-2">🔄</div>
                        <h6>Review Regularly</h6>
                        <p className="small text-muted">
                          Revisit completed lessons to reinforce your learning and retention.
                        </p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  )
}

export default Progress