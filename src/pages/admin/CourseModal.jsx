import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, Row, Col } from 'react-bootstrap'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL;

const CourseModal = ({ show, onHide, editingCourse, onCourseSaved, showAlert }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    price: '',
    discountedPrice: '',
    category: '',
    level: 'Beginner',
    duration: '',
    lessons: '',
    thumbnail: '',
    featured: false
  })

  // Get authentication token
  const getAuthToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token')

  // Axios instance without baseURL
  const api = axios.create()

  // Add request interceptor to include auth token
  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    },
    (error) => Promise.reject(error)
  )

  useEffect(() => {
    if (editingCourse) {
      setFormData({
        title: editingCourse.title || '',
        description: editingCourse.description || '',
        instructor: editingCourse.instructor || '',
        price: editingCourse.price || '',
        discountedPrice: editingCourse.discountedPrice || '',
        category: editingCourse.category || '',
        level: editingCourse.level || 'Beginner',
        duration: editingCourse.duration || '',
        lessons: editingCourse.lessons || '',
        thumbnail: editingCourse.thumbnail || '',
        featured: editingCourse.featured || false
      })
    } else {
      setFormData({
        title: '',
        description: '',
        instructor: '',
        price: '',
        discountedPrice: '',
        category: '',
        level: 'Beginner',
        duration: '',
        lessons: '',
        thumbnail: '',
        featured: false
      })
    }
  }, [editingCourse])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null,
        lessons: formData.lessons ? parseInt(formData.lessons) : 0,
        status: 'active'
      }

      if (editingCourse) {
        await api.put(`${API_URL}/api/admin/courses/${editingCourse._id}`, submitData)
        showAlert('Course updated successfully', 'success')
      } else {
        await api.post(`${API_URL}/api/admin/courses`, submitData)
        showAlert('Course created successfully', 'success')
      }

      onCourseSaved()
    } catch (error) {
      console.error('Error saving course:', error)
      if (error.response?.status === 403) {
        showAlert('You do not have permission to manage courses', 'danger')
      } else if (error.response?.status === 401) {
        showAlert('Please login again', 'danger')
      } else {
        showAlert(error.response?.data?.message || 'Error saving course', 'danger')
      }
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{editingCourse ? 'Edit Course' : 'Add New Course'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Course Title *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Instructor *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Category *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Level *</Form.Label>
                <Form.Select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Duration</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., 8 weeks"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Price (₹) *</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Discounted Price (₹)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.discountedPrice}
                  onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Number of Lessons</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.lessons}
                  onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
                  min="0"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Thumbnail URL</Form.Label>
            <Form.Control
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </Form.Group>

          <Form.Check
            type="checkbox"
            label="Featured Course"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" className="btn-admin-primary">
            {editingCourse ? 'Update Course' : 'Create Course'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default CourseModal
