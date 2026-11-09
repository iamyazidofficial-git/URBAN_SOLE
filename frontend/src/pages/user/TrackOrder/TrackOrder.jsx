import React, { useState,useEffect } from 'react';
import './TrackOrder.css';
import Navbar from "../../../partials/navbar/navbar";
import UserFooter from '../../../partials/UserFooter/UserFooter';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const TrackOrder = () => {
  const [order,setOrder]=useState([])

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("I want to change the delivery address")
  const [cancellationId,setCancellationId]=useState("")

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [returnReason, setReturnReason] = useState("Product is damaged or defective")
  const [returnId,setReturnId]=useState("")
  const[isReasonModalOpen,setIsReasonModalOpen]=useState(false)
  const[reasonItem,setReasonItem]=useState("")

  const location=useLocation()
  const orderId=location.state?.orderId


  const fetchTrackOrder=async()=>{
    try{
        const response=await axiosInstance.get(`/user/order/trackOrder/${orderId}`)
        if(response?.data?.success==true){
            setOrder(response?.data?.data)
        }
        console.log(response)
    }catch(error){
        console.log(error?.response?.data?.message)
    }
  }




  const handleCancelOrder = async () => {
    try {
        if(cancellationId==orderId){
         const response = await axiosInstance.patch(`/user/order/cancelOrder/${cancellationId}/${cancellationReason}`,
             {reason: cancellationReason});

               if (response?.data?.success === true) {
        setIsCancelModalOpen(false);   
        setCancellationId("")
        fetchTrackOrder()
        toast.success("Order Cancelled Successfully")
      }
        }else{
            const response = await axiosInstance.patch(`/user/order/cancelProduct/${orderId}/${cancellationId}/${cancellationReason}`,
             {reason: cancellationReason})
        if (response?.data?.success === true) {
        fetchTrackOrder()
        setIsCancelModalOpen(false);   
        setCancellationId("")
        toast.success("Product Cancelled Successfully")
            }
        }
   
    } catch (error) {
      console.log(error?.response?.data?.message || "Failed to cancel order");
    } 
  };




  const handleReturnOrder = async () => {
    try {
        if(returnId==orderId){
         const response = await axiosInstance.patch(`/user/order/returnOrder/${returnId}`,
             {reason: returnReason});

               if (response?.data?.success === true) {
        setIsReturnModalOpen(false);   
        setReturnId("")
        fetchTrackOrder()
        toast.success("Order Returned Successfully")
      }
        }else{
            const response = await axiosInstance.patch(`/user/order/returnProduct/${orderId}/${returnId}`,
             {reason: returnReason})
        if (response?.data?.success === true) {
        fetchTrackOrder()
        setIsReturnModalOpen(false);   
        setReturnId("")
        toast.success("Product Returned Successfully")
            }
        }
   
    } catch (error) {
      console.log(error?.response?.data?.message || "Failed to Return order");
    } 
  };



  useEffect(()=>{
    fetchTrackOrder()
  },[])

  return (
    <div className="us-page-wrapper">
      <Navbar />
      <div className="us-main-content">
        
        {/* Page Header */}
        <div className="to-header">
          <h1 className="to-main-title">TRACK ORDER</h1>
          <p className="to-order-id-sub">Order ID: {order.orderId}</p>

         {order.orderStatus === "RETURN_REJECTED" && (
        <div className="od-return-bar-badge" style={{ marginLeft: "800px" }}>
          <svg 
            className={`od-notification-bell ${order.orderStatus?.toLowerCase()}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            width="14" 
            height="14"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          
          <span className={`od-bar-status-text ${order.orderStatus?.toLowerCase()}`}>
            {order.orderStatus?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          
          <button 
            className="od-bar-view-reason-btn"
            onClick={() =>{setIsReasonModalOpen(true);setReasonItem(order)}}
          >
            View Reason
          </button>
        </div>
      )}
        </div>

        {/* Dashboard Grid Container */}
        <div className="to-dashboard-grid">
          
          {/* LEFT COLUMN */}
          <div className="to-left-column">
            
            {/* Products in this order box */}
            <div className="to-card">
              <span className="to-card-section-title">PRODUCTS IN THIS ORDER</span>
              
              <div className="to-products-list">
                {order?.items?.map((item) => (
                  <div key={item.id} className="to-product-box">
                    <div className="to-prod-img-box">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="to-prod-details">
                      <h3 className="to-prod-name">{item.name}</h3>
                      <p className="to-prod-specs">SIZE: {item.size}</p>
                      <p className="to-prod-specs">QTY: {item.quantity}</p>
                      
                      <div className="to-prod-action-buttons">

  <button className="to-btn-black">
    {["DELIVERED", "RETURN_REQUESTED", "RETURN_REJECTED", "RETURN_APPROVED"].includes(order?.orderStatus)
      ? "Write Review"
      : "View Product"}
  </button>
                       {["CANCELLED", "RETURNED"].includes(order.orderStatus) ? null :

  item.status === "CANCELLED" ? (
    <span className="to-status-text-badge cancelled">
      Item Cancelled
    </span>

  ) : item.status === "RETURN_REQUESTED" ? (
    <span className="to-status-text-badge return-requested">
      Return Requested
    </span>

  ) : item.status === "RETURN_REJECTED" ? (
    <div className="od-return-bar-badge" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <svg 
        className="od-notification-bell return_rejected" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        width="14" 
        height="14"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span className="od-bar-status-text return_rejected">
        Return Rejected
      </span>
      <button 
        className="od-bar-view-reason-btn"
        onClick={() => {setIsReasonModalOpen(true);setReasonItem(item)}}
      >
        View Reason
      </button>
    </div>

  ) : item.status === "RETURNED" ? (
    <span className="to-status-text-badge returned">
      Item Returned
    </span>

  ) : item.status === "DELIVERED" ? (
    <button
      className="to-btn-outline"
      onClick={() => {
        setIsReturnModalOpen(true);
        setReturnId(item.product);
      }}
    >
      RETURN PRODUCT
    </button>

  ) : (
    <button
      className="to-btn-outline"
      onClick={() => {
        setIsCancelModalOpen(true);
        setCancellationId(item.product);
      }}
    >
      CANCEL PRODUCT
    </button>
  )
}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="to-delivery-note">
                ⓘ All items in this order will be delivered together.
              </div>
            </div>

            {/* Order Summary & Price Details Box */}
            <div className="to-card">
              <span className="to-card-section-title">ORDER SUMMARY</span>
              
              <div className="to-summary-rows">
                <div className="to-sum-row">
                  <span className="to-sum-label">Order ID</span>
                  <span className="to-sum-val to-bold">{order.orderId}</span>
                </div>
                <div className="to-sum-row">
                  <span className="to-sum-label">Order Date</span>
<span className="to-sum-val to-bold">
  {new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  })}
</span>                </div>
                <div className="to-sum-row">
                  <span className="to-sum-label">Payment Method</span>
<span className="to-sum-val to-bold">
  {{
    CASHONDELIVERY: "CASH ON DELIVERY",
    RAZORPAY: "RAZOR PAY",
    WALLET: "WALLET"
  }[order?.payment?.method] || order?.payment?.method}
</span>                </div>
              </div>

              <div className="to-summary-divider"></div>
              <span className="to-card-section-title">PRICE DETAILS</span>

              <div className="to-summary-rows">
                <div className="to-sum-row">
                  <span className="to-sum-label">Original Price</span>
                  <span className="to-sum-val">₹{order?.pricing?.subTotal}</span>
                </div>
                
                <div className="to-sum-row">
                  <span className="to-sum-label">Discount</span>
                  <span className="to-sum-val">-{order?.pricing?.discount}</span>
                </div>
                 <div className="to-sum-row">
                  <span className="to-sum-label">Tax Percentage</span>
                  <span className="to-sum-val">{order?.pricing?.taxPercentage}%</span>
                </div>
                <div className="to-sum-row">
                  <span className="to-sum-label">tax</span>
                  <span className="to-sum-val">+{order?.pricing?.tax}</span>
                </div>
                <div className="to-sum-row">
                  <span className="to-sum-label">Shipping Charge</span>
                  <span className="to-sum-val">+{order?.pricing?.shippingCharge}</span>
                </div>
              </div>

              <div className="to-summary-total-row">
                <span className="to-total-label">Total Amount</span>
                <span className="to-total-val">₹{order?.pricing?.totalAmount}</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="to-right-column">
            
           {/* Delivery Timeline Box */}
<div className="to-card">
  <span className="to-card-section-title">
    {["RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_REJECTED", "RETURNED"].includes(order?.orderStatus) 
      ? "RETURN TIMELINE" 
      : "DELIVERY TIMELINE"}
  </span>
  
  <div className="to-timeline-container">
    <div className="to-timeline-line"></div>
    {(() => {
      const isReturnFlow = ["RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_REJECTED", "RETURNED"].includes(order?.orderStatus);

      // Define steps dynamically based on whether it's a return or normal delivery flow
      const steps = isReturnFlow ? [
        {
          status: "RETURN_REQUESTED",
          title: "Return Requested",
          date: order?.returnInfo?.requestedAt 
            ? new Date(order.returnInfo.requestedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : "Pending",
          completed: !!order?.returnInfo?.requestedAt
        },
        {
          status: order?.orderStatus === "RETURN_REJECTED" ? "RETURN_REJECTED" : "RETURN_APPROVED",
          title: order?.orderStatus === "RETURN_REJECTED" ? "Return Rejected" : "Return Approved",
          date: order?.orderStatus === "RETURN_REJECTED" 
            ? (order?.returnInfo?.rejectedAt ? new Date(order.returnInfo.rejectedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Pending")
            : (order?.returnInfo?.approvedAt ? new Date(order.returnInfo.approvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Pending"),
          subtext: order?.orderStatus === "RETURN_REJECTED" && order?.returnInfo?.rejectionReason 
            ? `Reason: "${order.returnInfo.rejectionReason}"` 
            : null,
          completed: order?.orderStatus === "RETURN_REJECTED" ? !!order?.returnInfo?.rejectedAt : !!order?.returnInfo?.approvedAt
        },
        ...(order?.orderStatus !== "RETURN_REJECTED" ? [{
          status: "RETURNED",
          title: "Returned / Refunded",
          date: order?.returnInfo?.receivedAt 
            ? new Date(order.returnInfo.receivedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : (order?.returnInfo?.approvedAt 
                ? `Estimated: ${new Date(new Date(order.returnInfo.approvedAt).getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (2 days after approval)`
                : "Estimated 2 days after approval"),
          completed: !!order?.returnInfo?.receivedAt
        }] : [])
      ] : [
        { status: "PLACED", title: "Order Placed" },
        { status: "SHIPPED", title: "Shipped" },
        { status: "OUT_OF_DELIVERY", title: "Out Of Delivery" },
        { status: "DELIVERED", title: "Delivered" }
      ];

      return steps.map((step, idx) => {
        let isCompleted = step.completed;
        let stepDate = step.date;

        if (!isReturnFlow) {
          const timelineEntry = order?.items?.[0]?.statusTimeline?.find(
            t => t.status === step.status
          );
          const statusHierarchy = ["PENDING", "PLACED", "SHIPPED", "OUT_OF_DELIVERY", "DELIVERED"];
          const currentStatusIdx = statusHierarchy.indexOf(order?.orderStatus || "PENDING");
          const thisStepIdx = statusHierarchy.indexOf(step.status);

          isCompleted = thisStepIdx <= currentStatusIdx || timelineEntry;
          stepDate = timelineEntry?.at 
            ? new Date(timelineEntry.at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : (isCompleted ? "Completed" : "Pending");
        }

        return (
          <div key={idx} className="to-timeline-item">
            <div className={`to-timeline-dot ${isCompleted ? 'completed' : ''} ${step.status === 'RETURN_REJECTED' ? 'rejected-dot' : ''}`}>
              {isCompleted && step.status !== 'RETURN_REJECTED' && (
                <svg className="to-check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <div className="to-timeline-content">
              <h4 className={`to-timeline-title ${!isCompleted ? 'to-pending-title' : ''}`}>{step.title}</h4>
              <p className={`to-timeline-date ${!isCompleted ? 'to-pending-date' : ''}`}>{stepDate}</p>
              {step.subtext && (
                <p className="to-timeline-subtext" style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px', fontWeight: '600' }}>
                  {step.subtext}
                </p>
              )}
            </div>
          </div>
        );
      });
    })()}
  </div>
</div>

            {/* Shipping Info & Address Box */}
            <div className="to-card">
              <span className="to-card-section-title">SHIPPING INFO</span>
              
              {/* <div className="to-shipping-info-block">
                <p>Delivery Partner: <strong>{orderData.deliveryPartner}</strong></p>
                <p>Tracking ID: <strong>{orderData.trackingId}</strong> <span className="to-copy-text">COPY</span></p>
              </div> */}

              <div className="to-summary-divider"></div>
              <span className="to-card-section-title">DELIVERY ADDRESS</span>

              <div className="to-address-block">
                <p className="to-addr-name">{order?.shippingAddress?.fullName}</p>
                <p className="to-addr-bold">{order?.shippingAddress?.streetAddress}</p>
                <p className="to-addr-bold">{order?.shippingAddress?.city}, {order?.shippingAddress?.state} - {order?.shippingAddress?.postalCode}</p>
                <p className="to-addr-phone">Phone: <strong>{order?.shippingAddress?.phoneNumber}</strong></p>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="to-bottom-actions">
             {order.orderStatus === "RETURNED" ? (
        <button className="to-btn-bottom" disabled style={{
  backgroundColor: "#f3f4f6",
  color: "#ff2609",
  cursor: "not-allowed"
}}>ORDER RETURNED</button>
              ) : order.orderStatus === "CANCELLED" ? (
                <button className="to-btn-bottom" disabled style={{
  backgroundColor: "#f3f4f6",
  color: "#ff2609",
  cursor: "not-allowed"
}}>ORDER CANCELLED</button>
              ) :  order.orderStatus === "RETURN_REQUESTED" ? (
                <button className="to-btn-bottom" disabled style={{
  backgroundColor: "#f3f4f6",
  color: "#ff2609",
  cursor: "not-allowed"
}}>RETURN REQUESTED</button>
              ) :  order.orderStatus === "RETURN_REJECTED" ? (
                <button className="to-btn-bottom" disabled style={{
  backgroundColor: "#f3f4f6",
  color: "#ff2609",
  cursor: "not-allowed"
}}>RETURN REJECTED</button>
              ) :  order.orderStatus === "DELIVERED" ? (
                <button className="to-btn-bottom" onClick={() => { setIsReturnModalOpen(true); setReturnId(orderId); }}>RETURN ENTIRE ORDER</button>

              ) : 
              (
                <button className="to-btn-bottom" onClick={() => { setIsCancelModalOpen(true); setCancellationId(orderId); }}>CANCEL ENTIRE ORDER</button>
              )}
              <button className="to-btn-bottom">DOWNLOAD INVOICE</button>
            </div>

          </div>

        </div>

      </div>




      {/* ================= CANCEL ORDER MODAL ================= */}
      {isCancelModalOpen==true && (
        <div className="to-modal-overlay">
          <div className="to-cancel-modal-card">
            <h3 className="to-cancel-modal-title">Reason For Cancellation</h3>
            
            <div className="to-radio-group">
              {[
                "I want to change the contact details",
                "I'm worried about the ratings/reviews",
                "I was hoping for a shorter delivery time",
                "My reasons are not listed here",
                "I want to change the payment option",
                "I want to change the delivery address",
                "Price of the product has now decreased"
              ].map((reason, idx) => (
                <label key={idx} className="to-radio-label">
                  <input 
                    type="radio" 
                    name="cancellationReason" 
                    value={reason}
                    checked={cancellationReason === reason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="to-radio-input"
                  />
                  <span className="to-radio-text">{reason}</span>
                </label>
              ))}
            </div>

            <div className="od-modal-actions">
              <button 
                className="od-modal-btn-cancel" 
                onClick={() =>{setIsCancelModalOpen(false);cancellationId("")}}
              >
                Cancel
              </button>
              <button 
                className="od-modal-btn-confirm" 
                onClick={handleCancelOrder}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}










      {/* ================= RETURN ORDER MODAL ================= */}
      {isReturnModalOpen==true && (
        <div className="to-modal-overlay">
          <div className="to-cancel-modal-card">
            <h3 className="to-cancel-modal-title">Reason For Return</h3>
            
            <div className="to-radio-group">
              {[
               "Product is damaged or defective",
  "Received a wrong product",
  "Product is different from the description",
  "Wrong size or fit",
  "Product quality is not as expected",
  "Received an incomplete order",
  "Product is not as shown in the images",
  "I no longer need this product",
  "I received a duplicate product",
  "Other reasons"
              ].map((reason, idx) => (
                <label key={idx} className="to-radio-label">
                  <input 
                    type="radio" 
                    name="cancellationReason" 
                    value={reason}
                    checked={returnReason === reason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="to-radio-input"
                  />
                  <span className="to-radio-text">{reason}</span>
                </label>
              ))}
            </div>

            <div className="od-modal-actions">
              <button 
                className="od-modal-btn-cancel" 
                onClick={() =>{setIsReturnModalOpen(false);returnId("")}}
              >
                Cancel
              </button>
              <button 
                className="od-modal-btn-confirm" 
                onClick={handleReturnOrder}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}








{/* ================= VIEW REJECTION REASON MODAL ================= */}
{isReasonModalOpen && (
  <div className="to-modal-overlay">
    <div className="to-cancel-modal-card" style={{ position: "relative" }}>
      
      {/* Top Close "×" Button */}
      <button 
        onClick={() => setIsReasonModalOpen(false)}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "none",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
          color: "#5d5f5f",
          fontWeight: "700"
        }}
      >
        &times;
      </button>

      <h3 className="to-cancel-modal-title" style={{ paddingRight: "24px" }}>
        Return Rejected Details
      </h3>

      <div className="to-summary-rows" style={{ gap: "12px", marginTop: "10px" }}>
        {/* Rejected At Date */}
        {reasonItem?.returnInfo?.rejectedAt && (
          <div className="to-sum-row">
            <span className="to-sum-label">Rejected At:</span>
            <span className="to-sum-val">
              {new Date(reasonItem.returnInfo.rejectedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Rejection Reason Display */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
          <span className="to-sum-label">Rejection Reason:</span>
          <p style={{ margin: 0, fontSize: "13px", color: "#b91c1c", fontWeight: "600", background: "#fef2f2", padding: "10px", border: "1px solid #fecaca" }}>
            "{reasonItem?.returnInfo?.rejectionReason || "No reason provided"}"
          </p>
        </div>
      </div>

      {/* Bottom Close Button */}
      <div style={{ display: "flex", marginTop: "20px" }}>
        <button
          className="to-btn-outline"
          style={{ width: "100%" }}
          onClick={() =>{setIsReasonModalOpen(false);setReasonItem("")}}
        >
          CLOSE
        </button>
      </div>
    </div>
  </div>
)}



      <UserFooter />
    </div>
  );
};

export default TrackOrder;