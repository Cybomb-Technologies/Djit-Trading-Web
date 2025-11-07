import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Spinner, Alert, Button, Card } from 'react-bootstrap';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = searchParams.get('order_id');
        const courseId = searchParams.get('course_id');
        
        if (!orderId) {
          setStatus('error');
          setMessage('Invalid payment callback - Order ID missing');
          return;
        }

        console.log('🔍 Verifying payment for order:', orderId);

        // Verify payment with backend
        const response = await axios.post(
          `${API_URL}/api/payments/verify`,
          { orderId },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        console.log('✅ Payment verification response:', response.data);

        if (response.data.success) {
          setStatus('success');
          setPaymentDetails(response.data.payment);
          
          if (response.data.enrollment) {
            setMessage('Payment successful! Redirecting to your course...');
            
            // Redirect to learning page after delay
            setTimeout(() => {
              navigate(`/learning/${response.data.enrollment.course._id}`);
            }, 3000);
          } else {
            setMessage('Payment verified!');
          }
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Payment verification failed. Please contact support.');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card className="p-4 shadow" style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body className="text-center">
          {status === 'verifying' && (
            <>
              <Spinner animation="border" variant="primary" size="lg" className="mb-3" />
              <h4 className="text-primary">Verifying Your Payment</h4>
              <p className="text-muted">Please wait while we confirm your payment details...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="text-success mb-3">
                <i className="fas fa-check-circle fa-4x"></i>
              </div>
              <h4 className="text-success mb-3">Payment Successful!</h4>
              <p className="mb-3">{message}</p>
              
              {paymentDetails && (
                <div className="bg-light p-3 rounded mb-3 text-start">
                  <p><strong>Order ID:</strong> {paymentDetails.orderId}</p>
                  <p><strong>Amount Paid:</strong> ₹{paymentDetails.finalAmount}</p>
                  <p><strong>Payment Method:</strong> {paymentDetails.paymentMethod}</p>
                </div>
              )}
              
              <div className="mt-3">
                <Spinner animation="border" size="sm" className="me-2" />
                <small className="text-muted">Redirecting to course...</small>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-danger mb-3">
                <i className="fas fa-times-circle fa-4x"></i>
              </div>
              <h4 className="text-danger mb-3">Payment Failed</h4>
              <Alert variant="danger" className="my-3">
                {message}
              </Alert>
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/courses')}
                >
                  Back to Courses
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/my-courses')}
                >
                  My Courses
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentCallback;