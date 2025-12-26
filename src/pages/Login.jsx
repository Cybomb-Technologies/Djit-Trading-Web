import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

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
          message: "Google sign-in is loading...",
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
            if (!response.code) throw new Error("No code received");

            const authResult = await loginWithGoogle(response.code);

            if (authResult.success) {
              setAlert({
                show: true,
                message: "Google login successful!",
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
        },
      });

      client.requestCode();
    } catch (error) {
      setAlert({
        show: true,
        message: "Failed to initialize Google login",
        type: "danger",
      });
      setGoogleLoading(false);
    }
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

        <button
          className={styles.googleBtn}
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        >
          {/* Clean Google Icon SVG */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </button>

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