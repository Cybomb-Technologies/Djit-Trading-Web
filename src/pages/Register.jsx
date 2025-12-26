import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Register.module.css";

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

  // Load Google script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (!window.google) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    };
    loadGoogleScript();
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

  const handleGoogleRegister = async () => {
    try {
      setGoogleLoading(true);
      setAlert({ show: false, message: "", type: "" });

      if (!window.google) {
        setAlert({ show: true, message: "Google sign-in loading...", type: "warning" });
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
            if (!response.code) throw new Error("No code received");
            const authResult = await loginWithGoogle(response.code);

            if (authResult.success) {
              setAlert({ show: true, message: "Registration successful!", type: "success" });
              navigate("/traders");
            } else if (authResult.needsRegistration) {
              navigate("/register", { state: { googleUser: authResult.googleUser } });
            } else {
              setAlert({ show: true, message: authResult.message || "Auth failed", type: "danger" });
            }
          } catch (error) {
            setAlert({ show: true, message: "Google auth failed", type: "danger" });
          } finally {
            setGoogleLoading(false);
          }
        },
      });
      client.requestCode();
    } catch (error) {
      setAlert({ show: true, message: "Init failed", type: "danger" });
      setGoogleLoading(false);
    }
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

            <button
              className={styles.googleBtn}
              onClick={handleGoogleRegister}
              disabled={googleLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>
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