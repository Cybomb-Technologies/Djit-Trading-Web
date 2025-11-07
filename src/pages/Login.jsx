import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";


const API_URL = import.meta.env.VITE_API_BASE_URL;


const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/traders";
//testing
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Load Google script on component mount
  useEffect(() => {
    const loadGoogleScript = () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('Google Identity Services loaded');
        };
        document.head.appendChild(script);
      }
    };

    loadGoogleScript();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    const result = await login(formData.email, formData.password);

    if (result.success) {
      setAlert({
        show: true,
        message: "Login successful! Redirecting...",
        type: "success",
      });
    } else {
      setAlert({
        show: true,
        message: result.message,
        type: "danger",
      });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
  try {
    setGoogleLoading(true);
    setAlert({ show: false, message: "", type: "" });

    if (!window.google) {
      setAlert({
        show: true,
        message: "Google sign-in is still loading. Please try again in a moment.",
        type: "warning",
      });
      setGoogleLoading(false);
      return;
    }

    // Initialize Google Identity Services
    const client = google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      ux_mode: 'popup',
      callback: async (response) => {
        try {
          console.log('Google auth response received');
          
          if (!response.code) {
            throw new Error('No authorization code received from Google');
          }

          // Exchange the authorization code for tokens
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              code: response.code,
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              client_secret: import.meta.env.VITE_SECRET_ID,
              redirect_uri: import.meta.env.VITE_FRONT_END_URL,
              grant_type: 'authorization_code',
            }),
          });

          const tokens = await tokenResponse.json();
          
          if (!tokens.id_token) {
            throw new Error('No ID token received from Google');
          }

          console.log('Google tokens received:', tokens);

          // Send the ID token to your backend
          const result = await loginWithGoogle(tokens.id_token);

          if (result.success) {
            setAlert({
              show: true,
              message: "Google login successful! Redirecting...",
              type: "success",
            });
          } else if (result.needsRegistration) {
            // User not found, redirect to registration with Google data
            setAlert({
              show: true,
              message: "Account not found. Please complete your registration.",
              type: "warning",
            });
            
            // Store Google user data for registration
            const googleUserData = {
              email: result.email,
              name: result.name,
              picture: result.picture,
              googleToken: tokens.id_token
            };
            
            // Navigate to register page with Google data
            setTimeout(() => {
              navigate('/register', { 
                state: { 
                  googleUser: googleUserData,
                  from: from 
                } 
              });
            }, 2000);
          } else {
            setAlert({
              show: true,
              message: result.message,
              type: "danger",
            });
          }
        } catch (error) {
          console.error('Google login error:', error);
          setAlert({
            show: true,
            message: error.message || 'Google login failed',
            type: 'danger'
          });
        } finally {
          setGoogleLoading(false);
        }
      },
    });

    // Request the authorization code
    client.requestCode();

  } catch (error) {
    console.error('Google login initialization error:', error);
    setAlert({
      show: true,
      message: 'Failed to initialize Google login',
      type: 'danger'
    });
    setGoogleLoading(false);
  }
};

  return (
    <div className="login-page">
      {/* Background with trading theme */}
      <div className="login-background">
        <div className="login-overlay"></div>
        <div className="floating-element login-float-1"></div>
        <div className="floating-element login-float-2"></div>
        <div className="floating-element login-float-3"></div>
      </div>

      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={5} md={7} sm={9}>
            {/* Trusted Badge */}
            <div className="login-trusted-badge">
              <span className="trusted-text">
                <span className="check-icon">✓</span>
                Trusted by 10,000+ traders
              </span>
            </div>

            <Card className="login-card">
              <Card.Body className="login-card-body">
                {/* Header Section */}
                <div className="login-header">
                  <div className="login-brand">
                    <h1 className="login-brand-title">
                      DJIT <span className="gradient-text">TRADING</span>
                    </h1>
                    <p className="login-brand-subtitle">
                      Professional Trading Platform
                    </p>
                  </div>

                  <div className="login-welcome">
                    <h2 className="login-title">Welcome Back</h2>
                    <p className="login-subtitle">
                      Sign in to access your trading dashboard
                    </p>
                  </div>
                </div>

                {alert.show && (
                  <Alert variant={alert.type} className="login-alert">
                    {alert.message}
                  </Alert>
                )}

                <div className="login-form-container">
                  <Form onSubmit={handleSubmit} className="login-form">
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">
                        Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        className="login-form-control"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        className="login-form-control"
                      />
                    </Form.Group>
                    <Link to="/forgot-password" className="forgot-password-link">
      Forgot Password?
    </Link>

                    <Button
                      type="submit"
                      variant="primary"
                      className="login-submit-button"
                      disabled={loading}
                    >
                      <span className="btn-icon">🚀</span>
                      {loading ? "Signing In..." : "Sign In to Dashboard"}
                    </Button>
                  </Form>

                  

                  

                  
                  {/* Google Sign In Button */}

                  <Button
  variant="outline-primary"
  className="google-signin-button"
  onClick={handleGoogleLogin}
  disabled={googleLoading}
  style={{
    width: '100%',
    padding: '12px 16px ',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#333',
    fontWeight: '500',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden'
  }}
  onMouseEnter={(e) => {
    e.target.style.backgroundColor = '#f8f9fa';
    e.target.style.borderColor = '#ccc';
    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
  }}
  onMouseLeave={(e) => {
    e.target.style.backgroundColor = 'white';
    e.target.style.borderColor = '#ddd';
    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
  }}
  onMouseDown={(e) => {
    e.target.style.transform = 'scale(0.98)';
    e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
  }}
  onMouseUp={(e) => {
    e.target.style.transform = 'scale(1)';
    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
  }}
>
  {/* Google Icon Container */}
  <div style={{
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  </div>
  
  {/* Loading Spinner */}
  {googleLoading && (
    <div style={{
      width: '16px',
      height: '16px',
      border: '2px solid transparent',
      borderTop: '2px solid #333',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
  )}
  
  <span style={{
    color: googleLoading ? '#666' : '#333',
    fontSize: '15px',
    fontWeight: '500'
  }}>
    {googleLoading ? "Connecting to Google..." : "Continue with Google"}
  </span>
</Button>
                </div>

                {/* Quick Stats */}
                <div className="login-stats">
                  <div className="login-stat">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <strong>10,000+</strong>
                      <span>Active Traders</span>
                    </div>
                  </div>
                  <div className="login-stat">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <strong>95%</strong>
                      <span>Success Rate</span>
                    </div>
                  </div>
                </div>

                <div className="login-footer">
                  <p className="footer-text">
                    New to DJIT Trading?{" "}
                    <Link to="/register" className="footer-link">
                      Create your account
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;