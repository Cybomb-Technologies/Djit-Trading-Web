import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Register.module.css";
import GoogleWebAuth from "../components/Auth/GoogleWebAuth";
import GoogleAndroidAuth from "../components/Auth/GoogleAndroidAuth";

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
  const [currentGoogleUser, setCurrentGoogleUser] = useState(null);

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

  // Detect mobile device
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    setIsMobile(/android|iphone|ipad|ipod/i.test(userAgent));
  }, []);

  // Handle Google user data if present
  useEffect(() => {
    if (googleUser) {
      setCurrentGoogleUser(googleUser);
      const usernameFromEmail = googleUser.email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      setFormData(prev => ({
        ...prev,
        email: googleUser.email,
        username: usernameFromEmail,
      }));

      setAlert({
        show: true,
        message: `Complete registration for ${googleUser.email}`,
        type: "info",
      });
    }
  }, [googleUser]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (formData.username.length < 3) errors.username = "Username too short (min 3 chars)";
    if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email address";
    if (formData.password.length < 6) errors.password = "Password too short (min 6 chars)";
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
        message: "Registration successful! Redirecting...",
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
        setAlert({ show: true, message: "Registration successful! Redirecting...", type: "success" });
        setTimeout(() => navigate("/traders"), 2000);
      } else if (authResult.needsRegistration) {
        setCurrentGoogleUser(authResult.googleUser);
      } else {
        setAlert({ show: true, message: authResult.message || "Authentication failed", type: "danger" });
      }
    } catch (error) {
      setAlert({ show: true, message: "Google authentication failed", type: "danger" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleFailure = (message) => {
    setAlert({ show: true, message: message, type: "danger" });
  };

  const handleGoogleRegistrationComplete = async () => {
    try {
      setGoogleLoading(true);
      const usernameFromEmail = currentGoogleUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      const registerResult = await register(usernameFromEmail, currentGoogleUser.email, randomPassword);

      if (registerResult.success) {
        setAlert({ show: true, message: "Google registration successful!", type: "success" });
        setTimeout(() => navigate("/traders"), 2000);
      } else {
        setAlert({ show: true, message: registerResult.message || "Failed", type: "danger" });
      }
    } catch (error) {
      setAlert({ show: true, message: "Registration error", type: "danger" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.registerCard}>
        <div className={styles.headerSection}>
          <h1 className={styles.brandTitle}>DJIT TRADING</h1>
          <h2 className={styles.welcomeTitle}>
            {currentGoogleUser ? "Complete Setup" : "Create Account"}
          </h2>
          <p className={styles.welcomeSubtitle}>
            {currentGoogleUser ? "Finalize your account details" : "Join the professional trading community"}
          </p>
        </div>

        {alert.show && (
          <div className={`${styles.alert} ${alert.type === "success" ? styles.alertSuccess :
            alert.type === "danger" ? styles.alertError : styles.alertInfo
            }`}>
            {alert.message}
          </div>
        )}

        {/* Google Registration Flow */}
        {currentGoogleUser && (
          <div className="mb-4">
            <button
              className={styles.submitBtn}
              onClick={handleGoogleRegistrationComplete}
              disabled={googleLoading}
              style={{ background: '#14B8A6' }}
            >
              {googleLoading ? "Completing..." : "Confirm & Create Account"}
            </button>
            <div className={styles.divider}>OR create with password below</div>
          </div>
        )}


        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose username"
              required
              className={styles.input}
              disabled={!!currentGoogleUser}
            />
            {validationErrors.username && <span className={styles.errorText}>{validationErrors.username}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              required
              className={styles.input}
              disabled={!!currentGoogleUser}
            />
            {validationErrors.email && <span className={styles.errorText}>{validationErrors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
              required
              className={styles.input}
            />
            <span className={styles.passwordHint}>Min 6 chars</span>
            {validationErrors.password && <span className={styles.errorText}>{validationErrors.password}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
              className={styles.input}
            />
            {validationErrors.confirmPassword && <span className={styles.errorText}>{validationErrors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {!currentGoogleUser && (
          <>
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
          </>
        )}

        <div className={styles.footer}>
          Already have an account?
          <Link to="/login" className={styles.loginLink}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;