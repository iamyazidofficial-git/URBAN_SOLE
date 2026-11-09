import React from 'react';
import './OrderSuccess.css';
import { useLocation } from 'react-router-dom';

const OrderSuccess = () => {
    const location=useLocation()
    const {orderId,estimatedDelivery}=location?.state
  return (
    <div className="order-success-container">
      <div className="order-success-card">
        {/* Success Illustration / Icon */}
        <div className="illustration-wrapper">
          <div className="pulse-ring"></div>
          <svg 
            className="success-icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        {/* Thank You Header */}
        <h1 className="success-title">YOUR ORDER HAS BEEN
PLACED</h1>
        <p className="success-subtitle">
Thank you for shopping with Urban Sole. Order ID:{orderId}</p>

        {/* Order Brief Info */}
        <div className="order-info-box">
          <div className="info-item">
            <span className="info-label">Order Reference</span>
            <span className="info-value font-mono">{orderId}</span>
          </div>
          <div className="info-divider"></div>
          <div className="info-item">
            <span className="info-label">Estimated Delivery</span>
            <span className="info-value">{estimatedDelivery}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            type="button" 
            className="btn btn-primary"
          >
            View Order Details
          </button>
          
          <button 
            type="button" 
            className="btn btn-secondary"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;