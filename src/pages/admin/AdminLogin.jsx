import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import './AdminLogin.css'

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/admin'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert({ show: false, message: '', type: '' })

    const result = await login(formData.email, formData.password)

    if (result.success) {
      setAlert({
        show: true,
        message: 'Login successful! Redirecting...',
        type: 'success'
      })
    } else {
      setAlert({
        show: true,
        message: result.message,
        type: 'danger'
      })
    }
    setLoading(false)
  }

  return (
    <Container className="admin-login-container">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col md={6} lg={4}>
          <Card className="admin-login-card shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div className="admin-login-icon">🔐</div>
                <h2 className="admin-login-title">Admin Portal</h2>
                <p className="admin-login-subtitle text-muted">
                  Secure admin access only
                </p>
              </div>

              {alert.show && (
                <Alert variant={alert.type} className="mb-3">
                  {alert.message}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Admin Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter admin email"
                    required
                    className="admin-form-control"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                    className="admin-form-control"
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    className="admin-login-btn"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Signing In...
                      </>
                    ) : (
                      'Sign In to Admin Panel'
                    )}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-4">
                <small className="text-muted">
                  This area is restricted to authorized personnel only.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AdminLogin