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
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { register, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get Google user data from navigation state
  const googleUser = location.state?.googleUser;

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/traders");
    }
  }, [isAuthenticated, navigate]);

  // Load Google script on component mount
  useEffect(() => {
    const loadGoogleScript = () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('Google Identity Services loaded in Register');
        };
        document.head.appendChild(script);
      }
    };

    loadGoogleScript();
  }, []);

  // Pre-fill form if coming from Google login
  useEffect(() => {
    if (googleUser) {
      const usernameFromEmail = googleUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      
      setFormData(prev => ({
        ...prev,
        email: googleUser.email,
        username: usernameFromEmail
      }));
      
      setAlert({
        show: true,
        message: `Please complete your registration with ${googleUser.email}`,
        type: "info"
      });
    }
  }, [googleUser]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear validation error when user starts typing
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters long";
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    const result = await register(
      formData.username,
      formData.email,
      formData.password
    );

    if (result.success) {
      setAlert({
        show: true,
        message: "Registration successful! Redirecting to your profile...",
        type: "success",
      });
      // Navigation is handled by the useEffect above
    } else {
      setAlert({
        show: true,
        message: result.message,
        type: "danger",
      });
    }
    setLoading(false);
  };

  // Google OAuth for Registration - UPDATED to handle new users
  const handleGoogleRegister = async () => {
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
            console.log('Google auth response received in Register');
            
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

            // Verify the ID token and get user info
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                'Authorization': `Bearer ${tokens.access_token}`
              }
            });

            const userInfo = await userInfoResponse.json();
            console.log('Google user info:', userInfo);

            // Try to login first (in case user already exists)
            const loginResult = await loginWithGoogle(tokens.id_token);

            if (loginResult.success) {
              setAlert({
                show: true,
                message: "Login successful! Redirecting...",
                type: "success",
              });
              // Navigation will be handled by useEffect
            } else {
              // User doesn't exist - automatically create account with Google
              console.log('User does not exist, creating new account with Google data');
              
              // Generate username from email
              const usernameFromEmail = userInfo.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
              
              // Generate a random password for Google users (they'll use Google to login)
              const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
              
              // Register the user with Google data
              const registerResult = await register(
                usernameFromEmail,
                userInfo.email,
                randomPassword
              );

              if (registerResult.success) {
                setAlert({
                  show: true,
                  message: "Google registration successful! Welcome to DJIT Trading.",
                  type: "success",
                });
                // Navigation will be handled by useEffect
              } else {
                // If registration fails, show the form pre-filled with Google data
                setFormData({
                  username: usernameFromEmail,
                  email: userInfo.email,
                  password: "",
                  confirmPassword: ""
                });

                setAlert({
                  show: true,
                  message: `Google account detected! Please complete your registration with ${userInfo.email}. ${registerResult.message || ''}`,
                  type: "info"
                });
              }
            }
          } catch (error) {
            console.error('Google registration error:', error);
            setAlert({
              show: true,
              message: error.message || 'Google registration failed',
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
      console.error('Google registration initialization error:', error);
      setAlert({
        show: true,
        message: 'Failed to initialize Google registration',
        type: 'danger'
      });
      setGoogleLoading(false);
    }
  };

  // Handle Google registration completion for users coming from login page
  const handleGoogleRegistration = async () => {
    try {
      setGoogleLoading(true);
      setAlert({ show: false, message: "", type: "" });
      
      if (!googleUser?.googleToken) {
        setAlert({
          show: true,
          message: "Google registration data not found. Please try logging in with Google again.",
          type: "danger"
        });
        setGoogleLoading(false);
        return;
      }

      console.log('Completing Google registration with token:', googleUser.googleToken);
      
      // Try to login with the Google token
      const result = await loginWithGoogle(googleUser.googleToken);
      
      if (result.success) {
        setAlert({
          show: true,
          message: "Registration completed! Welcome to DJIT Trading.",
          type: "success",
        });
        // Navigation will be handled by the useEffect that watches isAuthenticated
      } else {
        // If login fails, try to register the user automatically
        console.log('Auto-registering new Google user');
        
        // Generate username from email
        const usernameFromEmail = googleUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Generate a random password for Google users
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        
        // Register the user
        const registerResult = await register(
          usernameFromEmail,
          googleUser.email,
          randomPassword
        );

        if (registerResult.success) {
          setAlert({
            show: true,
            message: "Google registration successful! Welcome to DJIT Trading.",
            type: "success",
          });
        } else {
          setAlert({
            show: true,
            message: registerResult.message || "Registration failed. Please try the manual registration form.",
            type: "danger",
          });
        }
      }
    } catch (error) {
      console.error('Google registration error:', error);
      setAlert({
        show: true,
        message: 'Registration failed. Please try again.',
        type: 'danger'
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Render Google registration section (for users coming from login)
  const renderGoogleRegistrationSection = () => {
    if (!googleUser) return null;

    return (
      <div className="google-registration-section">
        <Alert variant="info" className="mb-4">
          <strong>Google Account Detected</strong>
          <br />
          Please complete your registration to create your DJIT Trading account with {googleUser.email}
        </Alert>

        <Button
          variant="success"
          className="w-100 mb-3 google-complete-button"
          onClick={handleGoogleRegistration}
          disabled={googleLoading}
          style={{
            padding: '12px 16px',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          <span className="btn-icon">✅</span>
          {googleLoading ? "Completing Registration..." : "Complete Registration with Google"}
        </Button>

        <div className="register-divider">
          <span className="divider-text">OR</span>
        </div>

        <Alert variant="secondary" className="mb-4">
          <small>
            You can also create a separate account with a different password if preferred.
          </small>
        </Alert>
      </div>
    );
  };

  return (
    <div className="register-page">
      {/* Background with trading theme */}
      <div className="register-background">
        <div className="register-overlay"></div>
        <div className="floating-element register-float-1"></div>
        <div className="floating-element register-float-2"></div>
        <div className="floating-element register-float-3"></div>
      </div>

      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={5} md={7} sm={9}>
            {/* Trusted Badge */}
            <div className="register-trusted-badge">
              <span className="trusted-text">
                <span className="check-icon">✓</span>
                Trusted by 10,000+ traders
              </span>
            </div>

            <Card className="register-card">
              <Card.Body className="register-card-body">
                {/* Header Section */}
                <div className="register-header">
                  <div className="register-brand">
                    <h1 className="register-brand-title">
                      DJIT <span className="gradient-text">TRADING</span>
                    </h1>
                    <p className="register-brand-subtitle">
                      Professional Trading Platform
                    </p>
                  </div>

                  <div className="register-welcome">
                    <h2 className="register-title">
                      {googleUser ? "Complete Your Registration" : "Join Our Community"}
                    </h2>
                    <p className="register-subtitle">
                      {googleUser 
                        ? "Finish setting up your DJIT Trading account" 
                        : "Create your account and start your trading journey"
                      }
                    </p>
                  </div>
                </div>

                {alert.show && (
                  <Alert variant={alert.type} className="register-alert">
                    {alert.message}
                  </Alert>
                )}

                {/* Google Registration Section */}
                {renderGoogleRegistrationSection()}

                {/* Google Sign Up Button - Show when not in Google registration flow */}
                {!googleUser && (
                  <>
                    <Button
                      variant="outline-primary"
                      className="google-signin-button mb-4"
                      onClick={handleGoogleRegister}
                      disabled={googleLoading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
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
                    >
                      {/* Google Icon */}
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

                    <div className="register-divider mb-4">
                      <span className="divider-text">OR</span>
                    </div>
                  </>
                )}

                <div className="register-form-container">
                  <Form onSubmit={handleSubmit} className="register-form">
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Choose a username"
                        required
                        isInvalid={!!validationErrors.username}
                        className="register-form-control"
                        disabled={googleUser} // Disable if using Google registration
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.username}
                      </Form.Control.Feedback>
                      {googleUser && (
                        <Form.Text className="text-muted">
                          Username generated from your Google account
                        </Form.Text>
                      )}
                    </Form.Group>

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
                        isInvalid={!!validationErrors.email}
                        className="register-form-control"
                        disabled={googleUser} // Disable if using Google registration
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.email}
                      </Form.Control.Feedback>
                      {googleUser && (
                        <Form.Text className="text-muted">
                          Your Google account email
                        </Form.Text>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        required
                        isInvalid={!!validationErrors.password}
                        className="register-form-control"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.password}
                      </Form.Control.Feedback>
                      <Form.Text className="password-hint">
                        Password must be at least 6 characters long
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">
                        Confirm Password
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                        isInvalid={!!validationErrors.confirmPassword}
                        className="register-form-control"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      className="register-submit-button"
                      disabled={loading}
                    >
                      <span className="btn-icon">🚀</span>
                      {loading
                        ? "Creating Account..."
                        : googleUser ? "Create Separate Account" : "Create Trading Account"}
                    </Button>
                  </Form>
                </div>

                {/* Quick Stats */}
                <div className="register-stats">
                  <div className="register-stat">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <strong>10,000+</strong>
                      <span>Active Traders</span>
                    </div>
                  </div>
                  <div className="register-stat">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <strong>95%</strong>
                      <span>Success Rate</span>
                    </div>
                  </div>
                </div>

                <div className="register-footer">
                  <p className="footer-text">
                    Already have an account?{" "}
                    <Link to="/login" className="footer-link">
                      Sign in here
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

export default Register;