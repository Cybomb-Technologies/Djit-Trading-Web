import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Table, Badge, Alert, Modal, Form } from 'react-bootstrap'
import axios from 'axios'
import CourseModal from './CourseModal'
import CourseContentModal from './CourseContentModal'

const API_URL = import.meta.env.VITE_API_BASE_URL;

const CourseManagement = () => {
  const [courses, setCourses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showContentModal, setShowContentModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })

  // Get authentication token
  const getAuthToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token')

  // Axios instance without baseURL
  const api = axios.create()
  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    },
    (error) => Promise.reject(error)
  )

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await api.get(`${API_URL}/api/admin/courses`)
      setCourses(response.data.courses || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      if (error.response?.status === 403) {
        showAlert('Access denied. Admin privileges required.', 'danger')
      } else if (error.response?.status === 401) {
        showAlert('Please login again.', 'danger')
      } else {
        showAlert('Error fetching courses', 'danger')
      }
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000)
  }

  const handleShowModal = (course = null) => {
    setEditingCourse(course)
    setShowModal(true)
  }

  const handleShowContentModal = (course) => {
    setSelectedCourse(course)
    setShowContentModal(true)
  }

  const handleShowDetailsModal = (course) => {
    setSelectedCourse(course)
    setShowDetailsModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCourse(null)
  }

  const handleCloseContentModal = () => {
    setShowContentModal(false)
    setSelectedCourse(null)
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedCourse(null)
  }

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await api.delete(`${API_URL}/api/admin/courses/${courseId}`)
        showAlert('Course deleted successfully', 'success')
        fetchCourses()
      } catch (error) {
        console.error('Error deleting course:', error)
        if (error.response?.status === 403) {
          showAlert('You do not have permission to delete courses', 'danger')
        } else {
          showAlert('Error deleting course', 'danger')
        }
      }
    }
  }

  const getLevelVariant = (level) => {
    switch (level) {
      case 'Beginner': return 'success'
      case 'Intermediate': return 'warning'
      case 'Advanced': return 'danger'
      default: return 'secondary'
    }
  }

  // Course Details Modal
  const CourseDetailsModal = ({ show, onHide, course }) => {
    const [localCourse, setLocalCourse] = useState(course || {})

    useEffect(() => {
      setLocalCourse(course || {})
    }, [course])

    const handleInputChange = (field, value) => {
      setLocalCourse(prev => ({ ...prev, [field]: value }))
    }

    const handleArrayChange = (field, index, value) => {
      setLocalCourse(prev => ({
        ...prev,
        [field]: prev[field]?.map((item, i) => i === index ? value : item) || []
      }))
    }

    const addArrayItem = (field) => {
      setLocalCourse(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), '']
      }))
    }

    const removeArrayItem = (field, index) => {
      setLocalCourse(prev => ({
        ...prev,
        [field]: prev[field]?.filter((_, i) => i !== index) || []
      }))
    }

    const handleIndicatorChange = (index, field, value) => {
      setLocalCourse(prev => ({
        ...prev,
        indicators: prev.indicators?.map((indicator, i) =>
          i === index ? { ...indicator, [field]: value } : indicator
        ) || []
      }))
    }

    const addIndicator = () => {
      setLocalCourse(prev => ({
        ...prev,
        indicators: [...(prev.indicators || []), { name: '', description: '' }]
      }))
    }

    const removeIndicator = (index) => {
      setLocalCourse(prev => ({
        ...prev,
        indicators: prev.indicators?.filter((_, i) => i !== index) || []
      }))
    }

    const handleSave = async () => {
      try {
        await api.put(`${API_URL}/api/admin/courses/${course._id}`, localCourse)
        showAlert('Course details updated successfully', 'success')
        fetchCourses()
        onHide()
      } catch (error) {
        console.error('Error updating course details:', error)
        showAlert('Error updating course details', 'danger')
      }
    }

    if (!course) return null

    return (
      <Modal show={show} onHide={onHide} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Course Details - {course.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Steps */}
            <Form.Group className="mb-3">
              <Form.Label><strong>Steps ({localCourse.steps?.length || 0})</strong></Form.Label>
              {localCourse.steps?.map((step, index) => (
                <div key={index} className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    value={step}
                    onChange={(e) => handleArrayChange('steps', index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                  />
                  <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => removeArrayItem('steps', index)}>Remove</Button>
                </div>
              ))}
              <Button variant="outline-primary" size="sm" onClick={() => addArrayItem('steps')}>+ Add Step</Button>
            </Form.Group>

            {/* Course Modules */}
            <Form.Group className="mb-3">
              <Form.Label><strong>Course Modules</strong></Form.Label>
              {localCourse.courseContains?.map((item, index) => (
                <div key={index} className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('courseContains', index, e.target.value)}
                    placeholder={`Course content ${index + 1}`}
                  />
                  <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => removeArrayItem('courseContains', index)}>Remove</Button>
                </div>
              ))}
              <Button variant="outline-primary" size="sm" onClick={() => addArrayItem('courseContains')}>+ Add Course Content</Button>
            </Form.Group>

            {/* Indicators */}
            <Form.Group className="mb-3">
              <Form.Label><strong>Indicators</strong></Form.Label>
              {localCourse.indicators?.map((indicator, index) => (
                <div key={index} className="border p-3 mb-3">
                  <div className="d-flex mb-2">
                    <Form.Control
                      type="text"
                      value={indicator.name}
                      onChange={(e) => handleIndicatorChange(index, 'name', e.target.value)}
                      placeholder="Indicator name"
                    />
                    <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => removeIndicator(index)}>Remove</Button>
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={indicator.description}
                    onChange={(e) => handleIndicatorChange(index, 'description', e.target.value)}
                    placeholder="Indicator description"
                  />
                </div>
              ))}
              <Button variant="outline-primary" size="sm" onClick={addIndicator}>+ Add Indicator</Button>
            </Form.Group>

            {/* Notes */}
            <Form.Group className="mb-3">
              <Form.Label><strong>Notes</strong></Form.Label>
              {localCourse.notes?.map((note, index) => (
                <div key={index} className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    value={note}
                    onChange={(e) => handleArrayChange('notes', index, e.target.value)}
                    placeholder={`Note ${index + 1}`}
                  />
                  <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => removeArrayItem('notes', index)}>Remove</Button>
                </div>
              ))}
              <Button variant="outline-primary" size="sm" onClick={() => addArrayItem('notes')}>+ Add Note</Button>
            </Form.Group>

            {/* Detailed Description */}
            <Form.Group className="mb-3">
              <Form.Label><strong>Detailed Description</strong></Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={localCourse.detailedDescription || ''}
                onChange={(e) => handleInputChange('detailedDescription', e.target.value)}
                placeholder="Enter detailed course description..."
              />
            </Form.Group>

            {/* Delivery Time */}
            <Form.Group className="mb-3">
              <Form.Label><strong>Delivery Time</strong></Form.Label>
              <Form.Control
                type="text"
                value={localCourse.deliveryTime || ''}
                onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                placeholder="e.g., 48 Working Hours"
              />
            </Form.Group>

            {/* Language */}
            <Form.Group className="mb-3">
              <Form.Label><strong>Language</strong></Form.Label>
              <Form.Control
                type="text"
                value={localCourse.language || ''}
                onChange={(e) => handleInputChange('language', e.target.value)}
                placeholder="e.g., Tamil"
              />
            </Form.Group>

            {/* Disclaimer */}
            <Form.Group className="mb-3">
              <Form.Label><strong>Disclaimer</strong></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={localCourse.disclaimer || ''}
                onChange={(e) => handleInputChange('disclaimer', e.target.value)}
                placeholder="Enter course disclaimer..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Details</Button>
        </Modal.Footer>
      </Modal>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Course Management</h2>
        <Button onClick={() => handleShowModal()} className="btn-admin-primary">+ Add New Course</Button>
      </div>

      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
          {alert.message}
        </Alert>
      )}

      <Card className="admin-card">
        <Card.Header><h5 className="mb-0">All Courses</h5></Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : courses.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Price</th>
                    <th>Level</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course._id}>
                      <td>
                        <div>
                          <strong>{course.title}</strong><br/>
                          <small className="text-muted">{course.category}</small>
                          {course.featured && <Badge bg="primary" className="ms-2">Featured</Badge>}
                        </div>
                      </td>
                      <td>{course.instructor}</td>
                      <td>
                        <strong>₹{course.discountedPrice || course.price}</strong>
                        {course.discountedPrice && <small className="text-muted text-decoration-line-through ms-1">₹{course.price}</small>}
                      </td>
                      <td><Badge bg={getLevelVariant(course.level)}>{course.level}</Badge></td>
                      <td>{course.studentsEnrolled || 0}</td>
                      <td><Badge bg={course.status === 'active' ? 'success' : 'secondary'}>{course.status || 'active'}</Badge></td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-primary" onClick={() => handleShowModal(course)}>Edit</Button>
                          <Button size="sm" variant="outline-info" onClick={() => handleShowContentModal(course)}>Content</Button>
                          <Button size="sm" variant="outline-success" onClick={() => handleShowDetailsModal(course)}>Details</Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDelete(course._id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No courses found</p>
              <Button onClick={() => handleShowModal()} className="btn-admin-primary">Create Your First Course</Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
      <CourseModal
        show={showModal}
        onHide={handleCloseModal}
        editingCourse={editingCourse}
        onCourseSaved={() => { handleCloseModal(); fetchCourses() }}
        showAlert={showAlert}
      />

      <CourseContentModal
        show={showContentModal}
        onHide={handleCloseContentModal}
        selectedCourse={selectedCourse}
        showAlert={showAlert}
      />

      <CourseDetailsModal
        show={showDetailsModal}
        onHide={handleCloseDetailsModal}
        course={selectedCourse}
      />
    </div>
  )
}

export default CourseManagement
