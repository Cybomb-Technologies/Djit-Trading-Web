// payment-success.jsx - LOCAL TESTING VERSION
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying payment...");
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const orderId = params.get("order_id");
        const courseId = params.get("course_id");

        console.log("🔍 Payment verification params:", { 
          orderId, 
          courseId,
          fullURL: window.location.href,
          search: location.search
        });

        // ✅ Debug info for testing
        setDebugInfo({
          orderId,
          courseId,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });

        if (!orderId) {
          setError("Missing order ID in URL");
          return;
        }

        if (!courseId) {
          setError("Missing course ID in URL");
          return;
        }

        setStatus("Verifying payment with server...");

        const res = await fetch(`${API_URL}/api/payment/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ 
            orderId,
            courseId
          }),
        });

        const data = await res.json();

        console.log("✅ Payment verification response:", data);

        if (data.success) {
          setStatus("Payment successful! Redirecting to course...");
          setTimeout(() => navigate(`/learning/${courseId}`), 2000);
        } else {
          setStatus("Payment verification failed.");
          setError(data.message || "Unknown error occurred");
        }
      } catch (err) {
        console.error("❌ Verify Payment Error:", err);
        setStatus("Payment verification failed.");
        setError(err.message);
      }
    };

    verifyPayment();
  }, [location.search, navigate]);

  return (
    <div style={{ textAlign: "center", padding: "50px", fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#1976d2', marginBottom: '20px' }}>{status}</h1>
      
      {/* Debug Info for Testing */}
      {debugInfo && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '8px', 
          margin: '20px 0',
          textAlign: 'left',
          fontSize: '14px'
        }}>
          <h3>🧪 Debug Information (Testing):</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ color: "red", fontSize: '18px' }}>❌ {error}</p>
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => navigate("/courses")}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                margin: '5px'
              }}
            >
              Back to Courses
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                margin: '5px'
              }}
            >
              Retry Verification
            </button>
          </div>
        </div>
      )}

      {/* Loading Animation */}
      {!error && status.includes("Verifying") && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;