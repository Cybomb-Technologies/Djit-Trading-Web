import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Badge, Button } from 'react-bootstrap'
import axios from 'axios'
import './AdminDashboard.css'

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentEnrollments, setRecentEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  const getAuthToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('token')
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setStats(response.data.stats)
      setRecentEnrollments(response.data.stats.recentEnrollments || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      if (error.response?.status === 403) {
        console.log('Access denied - check admin permissions')
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    setLoading(true)
    fetchDashboardData()
  }

  if (loading) {
    return (
      <div className="dashboard-loading text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading dashboard data...</p>
      </div>
    )
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'danger'
      default: return 'secondary'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Get appropriate icon for course category
  const getCourseIcon = (courseTitle) => {
    const title = courseTitle?.toLowerCase() || ''
    if (title.includes('web') || title.includes('development')) return 'fas fa-code'
    if (title.includes('design') || title.includes('ui/ux')) return 'fas fa-palette'
    if (title.includes('data') || title.includes('analytics')) return 'fas fa-chart-bar'
    if (title.includes('mobile') || title.includes('app')) return 'fas fa-mobile-alt'
    if (title.includes('business') || title.includes('marketing')) return 'fas fa-briefcase'
    if (title.includes('language') || title.includes('english')) return 'fas fa-language'
    return 'fas fa-book'
  }

  // Inline styles for icons
  const iconStyles = {
    headerIcon: {
      marginRight: '12px',
      color: '#3498db',
      fontSize: '1.2em'
    },
    statIconWrapper: {
      width: '60px',
      height: '60px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(52, 152, 219, 0.1)',
      flexShrink: 0,
      marginRight: '16px'
    },
    statIcon: {
      fontSize: '1.5rem'
    },
    usersIcon: { color: '#3498db' },
    coursesIcon: { color: '#2ecc71' },
    enrollmentsIcon: { color: '#f39c12' },
    revenueIcon: { color: '#9b59b6' },
    statDecoration: {
      position: 'absolute',
      bottom: '10px',
      right: '15px',
      fontSize: '1.2rem',
      opacity: 0.1,
      color: '#3498db'
    },
    tableHeaderIcon: {
      marginRight: '6px',
      color: '#3498db',
      width: '16px',
      fontSize: '0.9em'
    },
    statusIcon: {
      marginRight: '4px',
      fontSize: '0.8em'
    },
    rankBadge: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: '0.85rem',
      color: 'white'
    },
    userAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3498db, #2980b9)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '0.85rem',
      marginRight: '8px'
    },
    courseIcon: {
      marginRight: '8px',
      color: '#3498db'
    },
    smallIcon: {
      marginRight: '4px',
      fontSize: '0.8em'
    }
  }

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="dashboard-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="dashboard-title">
              <span style={iconStyles.headerIcon}>📊</span>
              Dashboard Overview
            </h2>
            <p className="dashboard-subtitle text-muted">
              <span style={{...iconStyles.headerIcon, fontSize: '1em'}}>ℹ️</span>
              Welcome back! Here's what's happening with your platform today.
            </p>
          </div>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={refreshData}
            className="refresh-btn"
          >
            <span style={{marginRight: '8px'}}>🔄</span>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <Row className="stats-grid mb-5">
        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div style={iconStyles.statIconWrapper}>
                <span style={{...iconStyles.statIcon, ...iconStyles.usersIcon}}>👥</span>
              </div>
              <div className="flex-grow-1">
                <div className="stat-number">{stats?.totalUsers || 0}</div>
                <div className="stat-label">
                  <span style={iconStyles.smallIcon}>➕</span>
                  Total Users
                </div>
                <div className="stat-trend text-success">
                  <span style={iconStyles.smallIcon}>📈</span>
                  Active users
                </div>
              </div>
              <div style={iconStyles.statDecoration}>
                <span>👥</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div style={iconStyles.statIconWrapper}>
                <span style={{...iconStyles.statIcon, ...iconStyles.coursesIcon}}>📚</span>
              </div>
              <div className="flex-grow-1">
                <div className="stat-number">{stats?.totalCourses || 0}</div>
                <div className="stat-label">
                  <span style={iconStyles.smallIcon}>🎓</span>
                  Total Courses
                </div>
                <div className="stat-trend text-info">
                  <span style={iconStyles.smallIcon}>📊</span>
                  Available courses
                </div>
              </div>
              <div style={iconStyles.statDecoration}>
                <span>💻</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div style={iconStyles.statIconWrapper}>
                <span style={{...iconStyles.statIcon, ...iconStyles.enrollmentsIcon}}>🎓</span>
              </div>
              <div className="flex-grow-1">
                <div className="stat-number">{stats?.totalEnrollments || 0}</div>
                <div className="stat-label">
                  <span style={iconStyles.smallIcon}>👨‍🎓</span>
                  Total Enrollments
                </div>
                <div className="stat-trend text-warning">
                  <span style={iconStyles.smallIcon}>➕</span>
                  Student enrollments
                </div>
              </div>
              <div style={iconStyles.statDecoration}>
                <span>📜</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div style={iconStyles.statIconWrapper}>
                <span style={{...iconStyles.statIcon, ...iconStyles.revenueIcon}}>💰</span>
              </div>
              <div className="flex-grow-1">
                <div className="stat-number">{formatCurrency(stats?.totalRevenue || 0)}</div>
                <div className="stat-label">
                  <span style={iconStyles.smallIcon}>💼</span>
                  Total Revenue
                </div>
                <div className="stat-trend text-success">
                  <span style={iconStyles.smallIcon}>🥧</span>
                  Total earnings
                </div>
              </div>
              <div style={iconStyles.statDecoration}>
                <span>💵</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Data Tables Section */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="admin-card h-100">
            <Card.Header className="card-header-custom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <span style={iconStyles.headerIcon}>📋</span>
                  Recent Enrollments
                </h5>
                <Badge bg="primary" className="enrollment-count">
                  <span style={iconStyles.smallIcon}>🎓</span>
                  {recentEnrollments.length} Total
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {recentEnrollments.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-header-custom">
                      <tr>
                        <th><span style={iconStyles.tableHeaderIcon}>👤</span>User</th>
                        <th><span style={iconStyles.tableHeaderIcon}>📖</span>Course</th>
                        <th><span style={iconStyles.tableHeaderIcon}>📅</span>Date</th>
                        <th><span style={iconStyles.tableHeaderIcon}>💵</span>Amount</th>
                        <th><span style={iconStyles.tableHeaderIcon}>ℹ️</span>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEnrollments.map((enrollment) => (
                        <tr key={enrollment._id} className="table-row-custom">
                          <td>
                            <div className="user-info">
                              <div style={iconStyles.userAvatar}>
                                {enrollment.user?.username?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong className="d-block">{enrollment.user?.username}</strong>
                                <small className="text-muted">
                                  <span style={iconStyles.smallIcon}>✉️</span>
                                  {enrollment.user?.email}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span style={iconStyles.courseIcon}>
                                {(() => {
                                  const title = enrollment.course?.title?.toLowerCase() || ''
                                  if (title.includes('web') || title.includes('development')) return '💻'
                                  if (title.includes('design') || title.includes('ui/ux')) return '🎨'
                                  if (title.includes('data') || title.includes('analytics')) return '📊'
                                  if (title.includes('mobile') || title.includes('app')) return '📱'
                                  if (title.includes('business') || title.includes('marketing')) return '💼'
                                  if (title.includes('language') || title.includes('english')) return '🔤'
                                  return '📚'
                                })()}
                              </span>
                              <span className="course-title">{enrollment.course?.title}</span>
                            </div>
                          </td>
                          <td>
                            <div className="date-info">
                              <span style={{...iconStyles.smallIcon, color: '#6c757d'}}>⏰</span>
                              {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                              <br />
                              <small className="text-muted">
                                {new Date(enrollment.enrollmentDate).toLocaleTimeString()}
                              </small>
                            </div>
                          </td>
                          <td>
                            <span className="amount fw-bold">
                              {enrollment.amount ? formatCurrency(enrollment.amount) : 'Free'}
                            </span>
                          </td>
                          <td>
                            <Badge 
                              bg={getStatusVariant(enrollment.paymentStatus)}
                              className="status-badge"
                            >
                              <span style={iconStyles.statusIcon}>
                                {enrollment.paymentStatus === 'completed' ? '✅' :
                                 enrollment.paymentStatus === 'pending' ? '⏳' : '⚠️'}
                              </span>
                              {enrollment.paymentStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5 empty-state">
                  <span style={{fontSize: '3rem', opacity: 0.5, marginBottom: '1rem', display: 'block'}}>🎓</span>
                  <p className="text-muted">No recent enrollments</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="admin-card h-100">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0">
                <span style={iconStyles.headerIcon}>🔥</span>
                Popular Courses
              </h5>
            </Card.Header>
            <Card.Body>
              {stats?.popularCourses?.length > 0 ? (
                <div className="popular-courses-list">
                  {stats.popularCourses.map((course, index) => (
                    <div key={course._id || index} className="course-item d-flex align-items-center mb-3 pb-3 border-bottom">
                      <div className="course-rank me-3">
                        <div 
                          style={{
                            ...iconStyles.rankBadge,
                            background: index === 0 ? 'linear-gradient(135deg, #f0d6abff, #bbada0ff)' :
                                        index === 1 ? 'linear-gradient(135deg, #e0f6f8ff, #b9f1f5ff)' :
                                        index === 2 ? 'linear-gradient(135deg, #ecd1bfff, #f7bbb4ff)' :
                                        'linear-gradient(135deg, #c1dceeff, #c3e6fdff)'
                          }}
                        >
                          {index === 0 ? '🏆' :
                           index === 1 ? '🥈' :
                           index === 2 ? '🥉' : '⭐'}
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-start">
                          <span style={{...iconStyles.courseIcon, marginTop: '2px'}}>
                            {(() => {
                              const title = course.course?.title?.toLowerCase() || ''
                              if (title.includes('web') || title.includes('development')) return '💻'
                              if (title.includes('design') || title.includes('ui/ux')) return '🎨'
                              if (title.includes('data') || title.includes('analytics')) return '📊'
                              if (title.includes('mobile') || title.includes('app')) return '📱'
                              if (title.includes('business') || title.includes('marketing')) return '💼'
                              if (title.includes('language') || title.includes('english')) return '🔤'
                              return '📚'
                            })()}
                          </span>
                          <div className="flex-grow-1">
                            <h6 className="course-name mb-1">{course.course?.title}</h6>
                            <div className="course-stats d-flex justify-content-between">
                              <small className="text-muted">
                                <span style={iconStyles.smallIcon}>👥</span>
                                {course.enrollments} enrollments
                              </small>
                              {course.revenue && (
                                <small className="text-success fw-semibold">
                                  <span style={iconStyles.smallIcon}>💰</span>
                                  {formatCurrency(course.revenue)}
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 empty-state">
                  <span style={{fontSize: '3rem', opacity: 0.5, marginBottom: '1rem', display: 'block'}}>📚</span>
                  <p className="text-muted">No course data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboard