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

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
const FRONTEND_URL = import.meta.env.VITE_FRONT_END_URL;

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

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Load Google script on component mount
  useEffect(() => {
    const loadGoogleScript = () => {
      if (!window.google) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log("Google Identity Services loaded in Login");
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

  // Google OAuth for Login - COMPLETE FIXED VERSION
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

      const client = google.accounts.oauth2.initCodeClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid",
        ux_mode: "popup",
        redirect_uri: "postmessage",
        callback: async (response) => {
          try {
            console.log("Google auth response received in Login");

            if (!response.code) {
              throw new Error("No authorization code received from Google");
            }

            console.log("Sending authorization code to backend...");

            // Send authorization code to backend
            const authResult = await loginWithGoogle(response.code);

            console.log("Backend auth result:", authResult);

            if (authResult.success) {
              setAlert({
                show: true,
                message: "Google login successful! Redirecting...",
                type: "success",
              });
            } else if (authResult.needsRegistration) {
              console.log("🔄 Storing googleUser data...");
              // Store in sessionStorage as backup
              sessionStorage.setItem('googleUser', JSON.stringify(authResult.googleUser));
              
              setAlert({
                show: true,
                message: "Redirecting to registration...",
                type: "info",
              });
              
              // Navigate to register with Google user data
              navigate("/register", {
                state: {
                  googleUser: authResult.googleUser,
                }
              });
            } else {
              setAlert({
                show: true,
                message: authResult.message || "Authentication failed",
                type: "danger",
              });
            }
          } catch (error) {
            console.error("Google auth error:", error);
            setAlert({
              show: true,
              message: error.message || "Google authentication failed",
              type: "danger",
            });
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      client.requestCode();
    } catch (error) {
      console.error("Google auth initialization error:", error);
      setAlert({
        show: true,
        message: "Failed to initialize Google authentication",
        type: "danger",
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-overlay"></div>
        <div className="floating-element login-float-1"></div>
        <div className="floating-element login-float-2"></div>
        <div className="floating-element login-float-3"></div>
      </div>

      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={5} md={7} sm={9}>
            <div className="login-trusted-badge">
              <span className="trusted-text">
                <span className="check-icon">✓</span>
                Trusted by 10,000+ traders
              </span>
            </div>

            <Card className="login-card">
              <Card.Body className="login-card-body">
                <div className="login-header">
                  <div className="login-brand">
                    <h1 className="login-brand-title">
                      DJIT <span className="gradient-text">TRADING</span>
                    </h1>
                    <p className="login-brand-subtitle">Professional Trading Platform</p>
                  </div>

                  <div className="login-welcome">
                    <h2 className="login-title">Welcome Back</h2>
                    <p className="login-subtitle">Sign in to access your trading dashboard</p>
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
                      <Form.Label className="form-label">Email Address</Form.Label>
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

                  <div className="login-divider mb-4">
                    <span className="divider-text">OR</span>
                  </div>

                  <Button
                    variant="outline-primary"
                    className="google-signin-button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "white",
                      color: "#333",
                      fontWeight: "500",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      transition: "all 0.2s ease-in-out",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f8f9fa";
                      e.target.style.borderColor = "#ccc";
                      e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "white";
                      e.target.style.borderColor = "#ddd";
                      e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>

                    {googleLoading && (
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid transparent",
                          borderTop: "2px solid #333",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      ></div>
                    )}

                    <span
                      style={{
                        color: googleLoading ? "#666" : "#333",
                        fontSize: "15px",
                        fontWeight: "500",
                      }}
                    >
                      {googleLoading
                        ? "Connecting to Google..."
                        : "Continue with Google"}
                    </span>
                  </Button>
                </div>

                <div className="login-stats">
                  <div className="login-stat">
                    <div className="stat-icon">
                      <i className="fa-solid fa-users"></i>
                    </div>

                    <div className="stat-content">
                      <strong>10,000+</strong>
                      <span>Active Traders</span>
                    </div>
                  </div>
                  <div className="login-stat">
                    <div className="stat-icon">
                      <i className="fa-solid fa-chart-column"></i>
                    </div>

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