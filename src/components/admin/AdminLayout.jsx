import React, { useState } from 'react'
import { Container, Navbar, Nav, Button, Badge } from 'react-bootstrap'
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import './AdminLayout.css'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  if (!admin) {
    return null
  }

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard', badge: null },
    { path: '/admin/courses', icon: '📚', label: 'Courses', badge: '12' },
    { path: '/admin/users', icon: '👥', label: 'Users', badge: '3' },
    { path: '/admin/enrollments', icon: '🎓', label: 'Enrollments', badge: '45' },
    { path: '/admin/newsletter', icon: '📧', label: 'Newsletter', badge: null },
    { path: '/admin/coupon', icon: '📧', label: 'Coupon Generator', badge: null },
  ]

  return (
    <div className="admin-layout">
      {/* Top Navigation - Fixed */}
      <Navbar 
        bg="dark" 
        variant="dark" 
        expand="lg" 
        className="admin-navbar border-bottom"
        fixed="top"
      >
        <Container fluid>
          <div className="d-flex align-items-center">
            <Navbar.Brand className="fw-bold text-white d-flex align-items-center" style={{ color: 'white' }} >
              <i className="fas fa-crown me-2" style={{ fontSize: '1.2rem' }}></i>
              Admin Console
            </Navbar.Brand>
          </div>
          
          <Nav className="ms-auto align-items-center">
            <div className="d-flex align-items-center me-4">
              <div 
                className="bg-gradient-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                style={{ width: '36px', height: '36px' }}
              >
                <span className="text-white fw-bold" style={{ fontSize: '14px' }}>
                  {admin.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="d-flex flex-column">
                <span className="text-white fw-semibold" style={{ fontSize: '14px' }}>
                  {admin.username}
                </span>
                <Badge 
                  bg="light" 
                  text="dark" 
                  className="border-0"
                  style={{ fontSize: '10px', padding: '2px 6px' }}
                >
                  {admin.role}
                </Badge>
              </div>
            </div>
            
            <Nav.Link 
              as={Link} 
              to="/" 
              className="text-light me-3 d-flex align-items-center"
              style={{ fontSize: '14px' }}
            >
              <i className="fas fa-external-link-alt me-1" style={{ fontSize: '12px' }}></i>
              View Site
            </Nav.Link>
            
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={handleLogout}
              className="logout-btn d-flex align-items-center"
            >
              <i className="fas fa-sign-out-alt me-1" style={{ fontSize: '12px' }}></i>
              Logout
            </Button>
          </Nav>
        </Container>
      </Navbar>

      {/* Content Area */}
      <div className="admin-content-wrapper">
        {/* Sidebar */}
        <div 
          className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'} border-end`}
        >
          <div className="sidebar-content">
            <div className="sidebar-header px-3 py-4">
              <h6 className="text-uppercase text-white-50 fw-semibold mb-2" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
                Main Navigation
              </h6>
              <div className="sidebar-divider"></div>
            </div>
            <nav className="sidebar-nav px-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path || 
                               (item.path !== '/admin' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <div className="nav-content">
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                      {item.badge && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                    </div>
                    {isActive && <div className="active-indicator"></div>}
                  </Link>
                )
              })}
            </nav>
            
            {/* Sidebar Footer */}
            <div className="sidebar-footer mt-auto px-3 py-3 border-top">
              <div className="d-flex align-items-center text-white-50">
                <div className="bg-success rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                <small style={{ fontSize: '11px' }}>System Online</small>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main 
          className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} bg-light`}
        >
          <div className="admin-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout