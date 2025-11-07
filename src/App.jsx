import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import Traders from "./pages/Traders";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FDCalculator from "./tools/FDCalculator";
import SIPCalculator from "./tools/SIPCalculator";
import SWPCalculator from "./tools/SWPCalculator";
import ContactForm from "./pages/ContactForm";
import Learning from "./pages/Learning";
import RefundPolicy from "./pages/RefundPolicy";
import ForgotPassword from './pages/ForgotPassword';
import Progress from './pages/Progress';
import ChatWidget from "./ChatWidget/ChatWidget";
import PaymentCallback from './pages/PaymentCallback';

// Admin Components
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CourseManagement from "./pages/admin/CourseManagement";
import UserManagement from "./pages/admin/UserManagement";
import EnrollmentManagement from "./pages/admin/EnrollmentManagement";
import NewsletterManagement from "./pages/admin/NewsletterManagement";
import CouponGenerator from "./pages/admin/CouponGenerator";

import "./App.css";
import PaymentSuccess from "./pages/PaymentSuccess";

// ✅ ScrollToTop function defined inside App.tsx
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminLogin = location.pathname === "/admin/login";

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <div className={`App ${isAdminRoute ? "admin-app" : ""}`}>
          {!isAdminRoute && <Header />}
          <main className={isAdminRoute ? "admin-main-content" : ""}>
            {/* ✅ Use ScrollToTop here */}
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/traders" element={<Traders />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/tools/fd-calculator" element={<FDCalculator />} />
              <Route path="/tools/sip-calculator" element={<SIPCalculator />} />
              <Route path="/tools/swp-calculator" element={<SWPCalculator />} />
              <Route path="/contact" element={<ContactForm />} />
              <Route path="/learning/:courseId" element={<Learning />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/payment-success" element={<PaymentSuccess/> } />
              <Route path="/payment-callback" element={<PaymentCallback />} />
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="enrollments" element={<EnrollmentManagement />} />
                <Route path="newsletter" element={<NewsletterManagement />} />
                <Route path="coupon" element={<CouponGenerator />} />
              </Route>
              
            </Routes>
          </main>
          {!isAdminRoute && <Footer />}
          {!isAdminRoute && <ChatWidget/>}
        </div>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
