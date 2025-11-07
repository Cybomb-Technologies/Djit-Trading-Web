import React, { useState, useRef, useEffect } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navbarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
    setExpanded(false);
    setActiveDropdown(null);
  };

  const handleNavClick = () => {
    setExpanded(false);
    setActiveDropdown(null);
  };

  const handleDropdownItemClick = () => {
    setActiveDropdown(null);
    setExpanded(false);
  };

  const toggleDropdown = (dropdownName) => {
    if (activeDropdown === dropdownName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdownName);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setActiveDropdown(null);
  }, [navigate]);

  return (
    <div ref={navbarRef}>
      <Navbar
        expand="lg"
        className="custom-navbar"
        fixed="top"
        expanded={expanded}
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="custom-brand" onClick={handleNavClick}>
            <img
              src={logo}
              alt="TradeMaster Logo"
              className="brand-logo"
            />
          </Navbar.Brand>

          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            className="custom-navbar-toggler"
            onClick={() => setExpanded(expanded ? false : "expanded")}
          />

          <Navbar.Collapse
            id="basic-navbar-nav"
            className="custom-navbar-collapse"
          >
            <div className="custom-nav-container">
              <Link to="/" className="custom-nav-item" onClick={handleNavClick}>
                Home
              </Link>
              <Link
                to="/courses"
                className="custom-nav-item"
                onClick={handleNavClick}
              >
                Courses
              </Link>

              {/* Tools Dropdown */}
              <div className="custom-dropdown-container">
                <button
                  className={`custom-nav-item custom-dropdown-btn ${
                    activeDropdown === "tools" ? "active" : ""
                  }`}
                  onClick={() => toggleDropdown("tools")}
                >
                  Tools <span className="dropdown-arrow">▼</span>
                </button>
                <div
                  className={`custom-dropdown-menu ${
                    activeDropdown === "tools" ? "show" : ""
                  }`}
                >
                  <Link
                    to="/tools/fd-calculator"
                    className="custom-dropdown-item"
                    onClick={handleDropdownItemClick}
                  >
                    FD Calculator
                  </Link>
                  <Link
                    to="/tools/sip-calculator"
                    className="custom-dropdown-item"
                    onClick={handleDropdownItemClick}
                  >
                    SIP Calculator
                  </Link>
                  <Link
                    to="/tools/swp-calculator"
                    className="custom-dropdown-item"
                    onClick={handleDropdownItemClick}
                  >
                    SWP Calculator
                  </Link>
                </div>
              </div>

              <Link
                to="/traders"
                className="custom-nav-item"
                onClick={handleNavClick}
              >
                Traders
              </Link>
              <Link
                to="/faq"
                className="custom-nav-item"
                onClick={handleNavClick}
              >
                FAQ
              </Link>
              <Link
                to="/about"
                className="custom-nav-item"
                onClick={handleNavClick}
              >
                About
              </Link>

              {isAuthenticated ? (
                <div className="custom-dropdown-container">
                  <button
                    className={`custom-nav-item custom-dropdown-btn ${
                      activeDropdown === "user" ? "active" : ""
                    }`}
                    onClick={() => toggleDropdown("user")}
                  >
                    Welcome, {user?.username}{" "}
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  <div
                    className={`custom-dropdown-menu ${
                      activeDropdown === "user" ? "show" : ""
                    }`}
                  >
                    <Link
                      to="/traders"
                      className="custom-dropdown-item"
                      onClick={handleDropdownItemClick}
                    >
                      My Profile
                    </Link>
                    <div className="custom-dropdown-divider"></div>
                    <button
                      className="custom-dropdown-item logout-btn"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="auth-buttons-container">
                  <Link
                    to="/login"
                    className="custom-nav-item"
                    onClick={handleNavClick}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="custom-nav-item"
                    onClick={handleNavClick}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <style>{`
        /* Complete CSS Reset for Navbar */
        .custom-navbar {
          background-color: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1) !important;
          padding: 1rem 0 !important;
          position: fixed !important;
          top: 0 !important;
          width: 100% !important;
          z-index: 9999 !important;
          transition: all 0.3s ease !important;
        }

        .custom-brand {
          font-weight: 700 !important;
          font-size: 1.8rem !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
          text-decoration: none !important;
        }

        .custom-brand:hover {
          text-decoration: none !important;
        }

        /* Custom Navigation */
        .custom-nav-container {
          display: flex !important;
          align-items: center !important;
          gap: 0 !important;
        }

        .custom-nav-item {
          color: #2c3e50 !important;
          font-weight: 500 !important;
          margin: 0 8px !important;
          padding: 8px 16px !important;
          border-radius: 25px !important;
          transition: all 0.3s ease !important;
          text-decoration: none !important;
          display: block !important;
          border: none !important;
          background: none !important;
          cursor: pointer !important;
          font-size: 16px !important;
          font-family: inherit !important;
        }

        .custom-nav-item:hover {
          color: #3498db !important;
          background-color: rgba(52, 152, 219, 0.1) !important;
          text-decoration: none !important;
        }

        /* Dropdown Container */
        .custom-dropdown-container {
          position: relative !important;
          display: inline-block !important;
        }

        .custom-dropdown-btn {
          position: relative !important;
        }

        .custom-dropdown-btn.active {
          color: #3498db !important;
          background-color: rgba(52, 152, 219, 0.1) !important;
        }

        /* Smaller dropdown arrow */
        .dropdown-arrow {
          font-size: 10px !important;
          margin-left: 4px !important;
          display: inline-block !important;
          transform: translateY(-1px) !important;
        }

        /* Dropdown Menu - Desktop Styling */
        .custom-dropdown-menu {
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          background: white !important;
          border: none !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
          border-radius: 10px !important;
          padding: 10px !important;
          min-width: 200px !important;
          z-index: 10000 !important;
          margin-top: 5px !important;
          display: none !important;
          animation: dropdownFadeIn 0.2s ease !important;
        }

        .custom-dropdown-menu.show {
          display: block !important;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .custom-dropdown-item {
          display: block !important;
          padding: 10px 20px !important;
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
          color: #2c3e50 !important;
          text-decoration: none !important;
          background: none !important;
          border: none !important;
          width: 100% !important;
          text-align: left !important;
          cursor: pointer !important;
          font-size: 14px !important;
          font-family: inherit !important;
        }

        .custom-dropdown-item:hover {
          background-color: rgba(52, 152, 219, 0.1) !important;
          color: #3498db !important;
          text-decoration: none !important;
        }

        .logout-btn:hover {
          background-color: rgba(231, 76, 60, 0.1) !important;
          color: #e74c3c !important;
        }

        .custom-dropdown-divider {
          height: 1px !important;
          background-color: #ecf0f1 !important;
          margin: 5px 0 !important;
        }

        .auth-buttons-container {
          display: flex !important;
          gap: 0 !important;
        }

        /* Navbar Toggler Styling */
        .custom-navbar-toggler {
          border: none !important;
          padding: 4px 8px !important;
          border-radius: 5px !important;
          transition: all 0.3s ease !important;
        }

        .custom-navbar-toggler:hover {
          background-color: rgba(52, 152, 219, 0.1) !important;
        }

        .custom-navbar-toggler:focus {
          box-shadow: none !important;
          outline: none !important;
        }

        /* Mobile Styles - Clean nav items with beautiful dropdown boxes */
        @media (max-width: 991px) {
          .custom-nav-container {
            flex-direction: column !important;
            align-items: stretch !important;
            text-align: center !important;
            padding: 20px 0 !important;
          }

          .custom-nav-item {
            margin: 6px 0 !important;
            text-align: center !important;
            padding: 10px 16px !important;
            border-radius: 25px !important;
            font-size: 16px !important;
            background: none !important;
            backdrop-filter: none !important;
            border: none !important;
          }

          .custom-nav-item:hover {
            color: #3498db !important;
            background-color: rgba(52, 152, 219, 0.1) !important;
            transform: none !important;
            box-shadow: none !important;
          }

          .custom-dropdown-container {
            width: 100% !important;
          }

          .custom-dropdown-btn {
            width: 100% !important;
            margin: 6px 0 !important;
            padding: 10px 16px !important;
            background: none !important;
            backdrop-filter: none !important;
            border: none !important;
          }

          .custom-dropdown-btn.active {
            color: #3498db !important;
            background-color: rgba(52, 152, 219, 0.1) !important;
            transform: none !important;
            box-shadow: none !important;
          }

          /* Beautiful dropdown boxes for mobile - Same as desktop styling */
          .custom-dropdown-menu {
            position: static !important;
            width: 90% !important;
            margin: 8px auto !important;
            background: white !important;
            border: none !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
            border-radius: 10px !important;
            padding: 12px !important;
            display: none !important;
            animation: mobileDropdownFadeIn 0.3s ease !important;
          }

          @keyframes mobileDropdownFadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .custom-dropdown-menu.show {
            display: block !important;
          }

          .custom-dropdown-item {
            padding: 12px 20px !important;
            font-size: 15px !important;
            text-align: center !important;
            margin: 4px 0 !important;
            background: transparent !important;
            border-radius: 8px !important;
            transition: all 0.3s ease !important;
          }

          .custom-dropdown-item:hover {
            background-color: rgba(52, 152, 219, 0.1) !important;
            color: #3498db !important;
            transform: translateX(5px) !important;
          }

          .auth-buttons-container {
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
          }

          .auth-buttons-container .custom-nav-item {
            width: 100% !important;
            max-width: none !important;
          }

          .custom-navbar-collapse {
            background: rgba(255, 255, 255, 0.98) !important;
            backdrop-filter: blur(20px) !important;
            margin-top: 10px !important;
            border-radius: 15px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
            border: 1px solid rgba(52, 152, 219, 0.1) !important;
          }
        }

        /* Desktop Styles */
        @media (min-width: 992px) {
          .custom-dropdown-menu {
            display: none !important;
          }
          
          .custom-dropdown-menu.show {
            display: block !important;
          }

          .custom-nav-item:hover {
            transform: translateY(-1px) !important;
          }

          .custom-dropdown-item:hover {
            transform: translateX(3px) !important;
          }
        }

        /* Override Bootstrap completely */
        .navbar-collapse {
          flex-grow: 0 !important;
        }

        .navbar-nav {
          display: none !important;
        }

        .nav-link {
          display: none !important;
        }

        /* Smooth transitions for all interactive elements */
        .custom-nav-item,
        .custom-dropdown-btn,
        .custom-dropdown-item,
        .custom-dropdown-menu {
          transition: all 0.3s ease !important;
        }
        .brand-logo {
          height: 45px;
          width: auto;
          object-fit: contain;
        }

        .custom-brand {
          display: flex;
          align-items: center;
          text-decoration: none !important;
        }

        .custom-brand:hover {
          text-decoration: none !important;
        }

        @media (max-width: 991px) {
          .brand-logo {
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
};

export default Header;
