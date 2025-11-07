import { useSearchParams } from "react-router-dom";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>✅ Payment Successful!</h1>
      <p>Order ID: {orderId}</p>
    </div>
  );
}

export default PaymentSuccess;
