import React, { useState } from 'react';
import './PaymentFailed.css';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { loadRazorpayScript } from '../../../utils/loadRazorpay';

const PaymentFailed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const orderData = location?.state || {};
  const orderId = orderData.orderId || orderData.razorpayOrder?.receipt;
  const _id=orderData?._id



  const handleRetryPayment = async () => {
  if (!orderId && !_id) {
    toast.error("Order details not found!");
    return;
  }

  setLoading(true);
  try {
    const res = await axiosInstance.post("/user/checkout/retry-payment", { orderId, _id });

    if (res.data?.success) {
      const { razorpayOrder, customerSnapshot, _id: dbOrderId, orderId: verifiedOrderId, razorpayKeyId } = res.data.data;
      const finalDbId = _id || dbOrderId;
      const finalOrderId = orderId || verifiedOrderId;

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        toast.error("Payment gateway failed to load. Please refresh.");
        return;
      }

      const razorpayKey =
        razorpayKeyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        "rzp_test_TyBdnHhmwVXFOs";

      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "URBAN SOLE",
        description: "Retry Purchase Payment",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            const verifyRes = await axiosInstance.post("/user/checkout/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: finalDbId
            });

            if (verifyRes.data.success) {
              toast.success("Payment successful!");
              navigate("/user/checkout/orderSuccess", {
                replace: true,
                state: {
                  orderId: finalOrderId,
                  _id:finalDbId,
                  estimatedDelivery: orderData?.estimatedDelivery || null
                }
              });
            }
          } catch (err) {
            console.log("VERIFY ERROR:", err);
            toast.error(err?.response?.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: customerSnapshot?.name || "",
          email: customerSnapshot?.email || "",
        },
        theme: {
          color: "#000000"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    }
  } catch (error) {
    console.log("RETRY ERROR:", error);
    toast.error(error?.response?.data?.message || "Could not retry payment");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="order-success-container">
      <div className="order-success-card">
        <div className="illustration-wrapper illustration-wrapper-failed">
          <div className="pulse-ring pulse-ring-failed"></div>
          <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h1 className="success-title">PAYMENT FAILED</h1>
        <p className="success-subtitle">
          We couldn't process your payment. You can retry payment directly. Order ID: {orderId}
        </p>

        <div className="order-info-box">
          <div className="info-item">
            <span className="info-label">Order Reference</span>
            <span className="info-value font-mono">{orderId || "N/A"}</span>
          </div>
          <div className="info-divider"></div>
          <div className="info-item">
            <span className="info-label">Payment Status</span>
            <span className="info-value text-failed">FAILED / PENDING</span>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            type="button" 
            className="btn btn-primary btn-primary-failed"
            onClick={handleRetryPayment}
            disabled={loading}
          >
            {loading ? "PROCESSING..." : "RETRY PAYMENT"}
          </button>

          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/user/home',{replace:true})}
          >
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;