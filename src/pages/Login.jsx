import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";
import GoogleWebAuth from "../components/Auth/GoogleWebAuth";
import GoogleAndroidAuth from "../components/Auth/GoogleAndroidAuth";

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

  // Detect mobile device
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    setIsMobile(/android|iphone|ipad|ipod/i.test(userAgent));
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

  const handleGoogleSuccess = async ({ code, idToken }) => {
    try {
      setGoogleLoading(true);
      setAlert({ show: false, message: "", type: "" });

      const authResult = await loginWithGoogle({ code, idToken });

      if (authResult.success) {
        setAlert({
          show: true,
          message: "Google login successful! Redirecting...",
          type: "success",
        });
      } else if (authResult.needsRegistration) {
        sessionStorage.setItem('googleUser', JSON.stringify(authResult.googleUser));
        navigate("/register", {
          state: { googleUser: authResult.googleUser }
        });
      } else {
        setAlert({
          show: true,
          message: authResult.message || "Authentication failed",
          type: "danger",
        });
      }
    } catch (error) {
      setAlert({
        show: true,
        message: "Google authentication failed",
        type: "danger",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleFailure = (message) => {
    setAlert({
      show: true,
      message: message,
      type: "danger",
    });
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>
        <div className={styles.headerSection}>
          <h1 className={styles.brandTitle}>DJIT TRADING</h1>
          <h2 className={styles.welcomeTitle}>Welcome Back</h2>
          <p className={styles.welcomeSubtitle}>Sign in to access your dashboard</p>
        </div>

        {alert.show && (
          <div className={`${styles.alert} ${alert.type === "success" ? styles.alertSuccess :
            alert.type === "danger" ? styles.alertError : styles.alertInfo
            }`}>
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className={styles.input}
            />
          </div>

          <Link to="/forgot-password" className={styles.forgotPassword}>
            Forgot Password?
          </Link>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className={styles.divider}>OR</div>

        <div className={styles.googleContainer}>
          {isMobile ? (
            <GoogleAndroidAuth
              onLoginSuccess={handleGoogleSuccess}
              onLoginFailure={handleGoogleFailure}
              loading={googleLoading}
            />
          ) : (
            <GoogleWebAuth
              onLoginSuccess={handleGoogleSuccess}
              onLoginFailure={handleGoogleFailure}
              loading={googleLoading}
            />
          )}
        </div>

        <div className={styles.footer}>
          New to DJIT Trading?
          <Link to="/register" className={styles.registerLink}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;