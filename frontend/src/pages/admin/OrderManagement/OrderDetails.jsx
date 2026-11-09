import React, { useState, useEffect } from 'react';
import './OrderDetails.css';
import Navbar from "../../../partials/navbar/navbar";
import UserFooter from '../../../partials/UserFooter/UserFooter';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import AdminSidebar from '../../../partials/AdminSidebar/AdminSidebar';

const OrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal,setStatusModal]=useState(false)
  const [selectedStatus,setSelectedStatus]=useState(order?.orderStatus)
  const [cancellationReason,setCancellationReason]=useState("")
  const [reasonError,setReasonError]=useState("")
  const [toggleItem,setToggleItem]=useState("")
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false)
  const [isReasonItemModalOpen,setIsReasonItemModalOpen]=useState(false)
  const [rejectReason,setRejectReason]=useState("")

  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/order/orderDetails/${orderId}`);
      if (response?.data?.success === true) {
        setOrder(response?.data?.data)
      }
    } catch (error) {
      console.log(error?.response?.data?.message || "Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };


  const toggleStatus=async(status)=>{
    try{

        if(status=="CANCELLED"){
        if (!cancellationReason||cancellationReason?.trim()=="") {
        setReasonError("Reason is required for cancellation")
        return;
      }
      if (cancellationReason?.trim()?.length < 15) {
        setReasonError("Minimum 15 characters are required.");
        return;
      }
      const letterCount = (cancellationReason?.trim()?.match(/[a-zA-Z]/g) || []).length;
      if (letterCount < 10) {
        setReasonError("Minimum 10 letters are required.");
        return;
      }
          
      

        const response=await axiosInstance.patch(`/admin/order/toggleStatus/${orderId}`,{status:status,reason:cancellationReason})
        if(response?.data?.success==true){
            setStatusModal(false)
            fetchOrderDetails()
            setReasonError("")
            setToggleItem("")
        }

        }

    
         if(status=="RETURN_REJECTED"){
            if (!rejectReason||rejectReason?.trim()=="") {
        setReasonError("Reason is required for reject")
        return;
      }
      if (rejectReason?.trim()?.length < 15) {
        setReasonError("Minimum 15 characters are required.");
        return;
      }
      const letterCount = (rejectReason?.trim()?.match(/[a-zA-Z]/g) || []).length;
      if (letterCount < 10) {
        setReasonError("Minimum 10 letters are required.");
        return;
      }



        const response=await axiosInstance.patch(`/admin/order/toggleStatus/${orderId}`,{status:status,reason:rejectReason})
        if(response?.data?.success==true){
            setStatusModal(false)
            fetchOrderDetails()
            setReasonError("")
            setToggleItem("")
        }

        }





       

        else{

        const response=await axiosInstance.patch(`/admin/order/toggleStatus/${order._id}`,{status:status,reason:cancellationReason||""})

        if(response?.data?.success==true){
            setStatusModal(false)
            fetchOrderDetails()
            setReasonError("")
            setToggleItem("")
        }

        }
       
    }
    catch(error){
        console.log(error?.response?.data?.message||"Something went wrong")
    }
  }





  const toggleItemStatus=async(status)=>{
    try{

        if(status=="CANCELLED"){
        if (!cancellationReason||cancellationReason?.trim()=="") {
        setReasonError("Reason is required for cancellation")
        return;
      }
      if (cancellationReason?.trim()?.length < 15) {
        setReasonError("Minimum 15 characters are required.");
        return;
      }
      const letterCount = (cancellationReason?.trim()?.match(/[a-zA-Z]/g) || []).length;
      if (letterCount < 10) {
        setReasonError("Minimum 10 letters are required.");
        return;
      }
          
      

        const response=await axiosInstance.patch(`/admin/order/toggleItem/${orderId}/${toggleItem.product}`,{status:status,reason:cancellationReason})
        if(response?.data?.success==true){
            setStatusModal(false)
            fetchOrderDetails()
            setReasonError("")
            setToggleItem("")
        }

        }

    
         if(status=="RETURN_REJECTED"){
            if (!rejectReason||rejectReason?.trim()=="") {
        setReasonError("Reason is required for reject")
        return;
      }
      if (rejectReason?.trim()?.length < 15) {
        setReasonError("Minimum 15 characters are required.");
        return;
      }
      const letterCount = (rejectReason?.trim()?.match(/[a-zA-Z]/g) || []).length;
      if (letterCount < 10) {
        setReasonError("Minimum 10 letters are required.");
        return;
      }



        const response=await axiosInstance.patch(`/admin/order/toggleItem/${orderId}/${toggleItem.product}`,{status:status,reason:rejectReason})
        if(response?.data?.success==true){
            setStatusModal(false)
            fetchOrderDetails()
            setReasonError("")
            setToggleItem("")
        }

        }


       

        else{

        const response=await axiosInstance.patch(`/admin/order/toggleItem/${orderId}/${toggleItem.product}`,{status:status})

        if(response?.data?.success==true){
            setStatusModal(false)
            fetchOrderDetails()
            setReasonError("")
            setToggleItem("")
        }

        }
       
    }
    catch(error){
        console.log(error?.response?.data?.message||"Something went wrong")
    }
  }




  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="us-page-wrapper">
        <AdminSidebar/>
        <div className="us-main-content" style={{ textAlign: "center", padding: "60px" }}>
          <p className="to-order-id-sub">Loading order details...</p>
        </div>
        <UserFooter />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="us-page-wrapper">
        <AdminSidebar/>
        <div className="us-main-content" style={{ textAlign: "center", padding: "60px" }}>
          <h1 className="to-main-title">Order Not Found</h1>
          <button className="to-btn-black" onClick={() => navigate(-1)} style={{ marginTop: "16px" }}>
            Back to Orders
          </button>
        </div>
        <UserFooter />
      </div>
    );
  }

  return (
    <div className="us-page-wrapper">
      <Navbar />
      <div className="us-main-content">
        
        {/* Top Navigation & Header */}
        <div className="od-top-bar">
          <button className="od-back-link" onClick={() => navigate(-1)}>
            ← Back to Orders
          </button>


<div className="od-header-actions">
            {["RETURN_REQUESTED", "RETURN_REJECTED", "RETURN_APPROVED", "RETURNED","CANCELLED"].includes(order?.orderStatus) && (
              <div className="od-return-bar-badge">
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

                {/* Hooked up View Reason Button */}
                <button 
                  className="od-bar-view-reason-btn"
                  onClick={() =>{setIsReasonModalOpen(true)}}
                >
                  VIEW REASON
                </button>
              </div>
            )}

            <button className="od-top-btn">
              <span className="material-symbols-outlined">receipt_long</span> Invoice
            </button>
            
            <button className="od-top-btn od-primary-btn" onClick={() => setStatusModal(true)}>
              Change Status
            </button>
          </div>


          
        </div>

        <div className="to-header" style={{ marginBottom: '20px' }}>
          <h1 className="to-main-title">Order Details</h1>
        </div>

        {/* Top Summary Banner Card */}
        <div className="to-card od-banner-card">
          <div className="od-banner-item">
            <span className="od-banner-label">ORDER ID</span>
            <span className="od-banner-val">{order.orderId}</span>
          </div>
          <div className="od-banner-divider"></div>
          <div className="od-banner-item">
            <span className="od-banner-label">ORDER DATE</span>
            <span className="od-banner-val">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
              }) : "N/A"}
            </span>
          </div>
          <div className="od-banner-divider"></div>
          <div className="od-banner-item">
            <span className="od-banner-label">PAYMENT METHOD</span>
            <span className="od-banner-val">
              {{
                CASHONDELIVERY: "COD",
                RAZORPAY: "RAZOR PAY",
                WALLET: "WALLET"
              }[order?.payment?.method] || order?.payment?.method || "N/A"}
            </span>
          </div>
          <div className="od-banner-divider"></div>
          <div className="od-banner-item">
            <span className="od-banner-label">TOTAL AMOUNT</span>
            <span className="od-banner-val od-highlight-price">₹{order?.pricing?.totalAmount?.toLocaleString()}</span>
          </div>
          <div className="od-banner-divider"></div>
          <div className="od-banner-item">
            <span className="od-banner-label">STATUS</span>
            <span className={`od-status-pill ${order.orderStatus?.toLowerCase()}`}>
              <span className="od-status-dot"></span> {order.orderStatus}
            </span>
          </div>
        </div>

        {/* Dashboard Grid Container */}
        <div className="to-dashboard-grid">
          
          {/* LEFT COLUMN: Order Items & Pricing Breakdown Table Card */}
          <div className="to-left-column">
            <div className="to-card">
              <div className="od-section-header-row">
                <span className="to-card-section-title" style={{ border: 'none', margin: 0, padding: 0 }}>Order Items</span>
                <span className="od-items-count-badge">{order?.items?.length || 0} Items</span>
              </div>
              <div className="to-summary-divider" style={{ marginTop: '12px', marginBottom: '16px' }}></div>

              {/* Table format matching reference design */}
              <div className="od-table-wrapper">
                <table className="od-items-table">
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>SIZE</th>
                      <th>QTY</th>
                      <th>PRICE</th>
                      <th>TOTAL</th>
                      <th>ACTION</th>                    
                    </tr>
                  </thead>
                  <tbody>
                    {order?.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="od-table-img-box">
                            <img src={item.image} alt={item.name} />
                          </div>
                        </td>
                       
                        <td className="od-table-text">{item.size || 'N/A'}</td>
                        <td className="od-table-text">{item.quantity}</td>
                        <td className="od-table-text">₹{item.price?.toLocaleString()}</td>
                        <td className="od-table-text od-bold-text">₹{item.itemTotal?.toLocaleString()}</td>
<td className="od-table-text od-bold-text">
 <div className="od-inline-status-action">
  {["RETURN_REQUESTED","RETURN_APPROVED","CANCELLED","RETURN_REJECTED"].includes(item.status) ? (
    <div className="od-return-bar-badge" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <svg 
        className={`od-notification-bell ${item.status?.toLowerCase()}`} 
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
      
      <span className={`od-bar-status-text ${item.status?.toLowerCase()}`}>
        {item.status?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
      </span>
      
      <button 
        className="od-bar-view-reason-btn"
        onClick={() =>{setIsReasonItemModalOpen(true); setToggleItem(item)}}
      >
        View Reason
      </button>
      {/* Edit Pen Icon */}
      <span 
        className="od-inline-pen-icon" 
        onClick={() => {
          setToggleItem(item);
          setStatusModal(true);
        }}
        title="Update Status"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </span>
    </div>
  ) : (
    <>
      <span className={`od-status-pill-badge ${item.status?.toLowerCase()}`}>
        {item.status?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
      </span>
      
      {/* Edit Pen Icon */}
      <span 
        className="od-inline-pen-icon" 
        onClick={() => {
          setToggleItem(item);
          setStatusModal(true);
        }}
        title="Update Status"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </span>
    </>
  )}
</div>
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="to-summary-divider" style={{ margin: '20px 0' }}></div>

              {/* Subtotals and pricing calculation */}
              <div className="od-pricing-section-container">
                <div className="to-summary-rows">
                  <div className="to-sum-row">
                    <span className="to-sum-label">Subtotal</span>
                    <span className="to-sum-val">₹{order?.pricing?.subTotal?.toLocaleString()}</span>
                  </div>
                  <div className="to-sum-row">
                    <span className="to-sum-label">Shipping</span>
                    <span className="to-sum-val">+{order?.pricing?.shippingCharge || 0}</span>
                  </div>
                  <div className="to-sum-row">
                    <span className="to-sum-label">Tax Percentage</span>
                    <span className="to-sum-val">{order?.pricing?.taxPercentage || 0}%</span>
                  </div>
                  <div className="to-sum-row">
                    <span className="to-sum-label">Tax</span>
                    <span className="to-sum-val">₹{order?.pricing?.tax || 0}</span>
                  </div>
                  {order?.pricing?.discount > 0 && (
                    <div className="to-sum-row">
                      <span className="to-sum-label">Discount</span>
                      <span className="to-sum-val">-₹{order?.pricing?.discount}</span>
                    </div>
                  )}
                </div>

                <div className="to-summary-total-row">
                  <span className="to-total-label">Total</span>
                  <span className="to-total-val">₹{order?.pricing?.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Customer Information & Order Timeline */}
          <div className="to-right-column">
            
            {/* Customer Information Box */}
            <div className="to-card">
              <span className="to-card-section-title">Customer Information</span>
              
              <div className="od-customer-profile-block">
                <div className="od-cust-avatar">
                  {order?.user?.profileImage ? (
                    <img src={order.user.profileImage} alt={order?.user?.name} />
                  ) : (
                    <span>{order?.user?.name?.charAt(0).toUpperCase() || 'C'}</span>
                  )}
                </div>
                <div className="od-cust-meta">
                  <h4 className="od-cust-name">{order?.user?.name || order?.customerSnapshot?.name}</h4>
                  <p className="od-cust-since">Customer</p>
                </div>
              </div>

              <div className="to-summary-divider"></div>

              <div className="od-info-group">
                <span className="od-info-label">EMAIL</span>
                <p className="od-info-value">{order?.user?.email || order?.customerSnapshot?.email}</p>
              </div>

              <div className="od-info-group" style={{ marginTop: '12px' }}>
                <span className="od-info-label">PHONE</span>
                <p className="od-info-value">{order?.shippingAddress?.phoneNumber || 'N/A'}</p>
              </div>

              <div className="to-summary-divider"></div>
              <span className="to-card-section-title">SHIPPING ADDRESS</span>

              <div className="to-address-block">
                <p className="to-addr-bold">{order?.shippingAddress?.fullName}</p>
                <p className="to-addr-bold">{order?.shippingAddress?.streetAddress}</p>
                <p className="to-addr-bold">
                  {order?.shippingAddress?.city}, {order?.shippingAddress?.state} - {order?.shippingAddress?.postalCode}
                </p>
              </div>
            </div>

            {/* Order Timeline Box */}
<div className="to-card">
  <span className="to-card-section-title">Order Timeline</span>
  
  <div className="to-timeline-container" style={{ marginTop: '16px' }}>
    <div className="to-timeline-line"></div>
    {
      [
        { status: "PENDING", title: "Order Placed" },
        { status: "SHIPPED", title: "Shipped" },
        { status: "OUT_OF_DELIVERY", title: "Out Of Delivery" }, 
        { status: "DELIVERED", title: "Delivered" }
      ].map((step, idx) => {
        
        const timelineEntry = order?.items?.[0]?.statusTimeline?.find(
          t => t.status === step.status
        );

        const statusHierarchy = ["PENDING", "PLACED", "SHIPPED", "OUT_OF_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"];
        
        const currentStatusIdx = statusHierarchy.indexOf(order?.orderStatus || "PENDING");
        const thisStepIdx = statusHierarchy.indexOf(step.status);

        const isCompleted = thisStepIdx <= currentStatusIdx || timelineEntry;
        
        const stepDate = timelineEntry?.at 
          ? new Date(timelineEntry.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : (isCompleted ? "Completed" : "Pending");

        return (
          <div key={idx} className="to-timeline-item">
            <div className={`to-timeline-dot ${isCompleted ? 'completed' : ''}`}>
              {isCompleted && (
                <svg className="to-check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <div className="to-timeline-content">
              <h4 className={`to-timeline-title ${!isCompleted ? 'to-pending-title' : ''}`}>{step.title}</h4>
              <p className={`to-timeline-date ${!isCompleted ? 'to-pending-date' : ''}`}>{stepDate}</p>
            </div>
          </div>
        );
      })
    }
  </div>
</div>

          </div>

        </div>

      </div>



      {statusModal && (
        <div className="od-modal-overlay">
          <div className="od-modal-card">
            <h3 className="od-modal-title">Update Status</h3>
            <p className="od-modal-subtitle">Select the new status </p>

            <div className="od-modal-dropdown-container">
              <label className="od-modal-label">Order Status</label>
              <select 
                className="od-modal-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="PENDING">PENDING</option>
                <option value="PLACED">PLACED</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="OUT_OF_DELIVERY">OUT_OF_DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="RETURNED">RETURNED</option>
              </select>
            </div>

            {(selectedStatus === "CANCELLED" ) && (
              <div className="od-modal-dropdown-container" style={{ marginTop: '12px' }}>
                <label className="od-modal-label">Reason (Required)</label>
                <textarea 
                  className="od-modal-textarea"
                  placeholder="Enter reason minimum 15 charecters"
                  value={cancellationReason}
                  maxLength={40} 
                  onChange={(e) => {
                    setCancellationReason(e.target.value)
                  }}
                ></textarea>
                {reasonError&&<p style={{color:"red"}}>{reasonError}</p>}
                <div className="od-reason-footer">
                </div>
              </div>
            )}

            <div className="od-modal-actions">
              <button 
                className="od-modal-btn-cancel" 
                onClick={() => setStatusModal(false)}
              >
                Cancel
              </button>
              <button 
                className="od-modal-btn-confirm" 
                onClick={()=>toggleStatus(selectedStatus)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}






{/* ================= VIEW REASON / RETURN DETAILS MODAL ================= */}
{isReasonModalOpen && (
  <div className="to-modal-overlay">
    <div className="to-cancel-modal-card" style={{ position: "relative" }}>
      
      {/* Top Close "×" Button */}
      <button 
        onClick={() => {
          setIsReasonModalOpen(false);
          setRejectReason("");
        }}
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
        {order?.orderStatus === "RETURN_REQUESTED" && "Review Return Request"}
        {order?.orderStatus === "RETURN_APPROVED" && "Return Approved Details"}
        {order?.orderStatus === "RETURN_REJECTED" && "Return Rejected Details"}
        {order?.orderStatus === "RETURNED" && "Return Completed Details"}
      </h3>

      <div className="to-summary-rows" style={{ gap: "12px", marginTop: "10px" }}>
        {/* Requested At */}

        {order?.returnInfo?.requestedAt && order?.orderStatus!="CANCELLED"&& (
          <div className="to-sum-row">
            <span className="to-sum-label">Requested At:</span>
            <span className="to-sum-val">
              {new Date(order.returnInfo.requestedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {order?.cancellation?.at && order?.orderStatus=="CANCELLED"&& (
          <div className="to-sum-row">
            <span className="to-sum-label">Cancelled At:</span>
            <span className="to-sum-val">
              {new Date(order.cancellation.at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}

       {order.orderStatus!="CANCELLED"&&(
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span className="to-sum-label">User's Return Reason:</span>
          <p style={{ margin: 0, fontSize: "13px", color: "#1b1c1c", fontWeight: "600" }}>
            "{order?.returnInfo?.reason || "No reason provided"}"
          </p>
        </div>
       )} 

       {order.orderStatus=="CANCELLED"&&(
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span className="to-sum-label">User's Cancel Reason:</span>
          <p style={{ margin: 0, fontSize: "13px", color: "#1b1c1c", fontWeight: "600" }}>
            "{order?.cancellation?.reason || "No reason provided"}"
          </p>
        </div>
       )} 

        {/* Rejection Input Field (Appears directly when status is RETURN_REQUESTED) */}
        {order?.orderStatus === "RETURN_REQUESTED" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
            <span className="to-sum-label">Reason for Rejection (Required if rejecting):</span>
            <textarea
              className="to-sum-val"
              rows="3"
              placeholder="Type why this return is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #cfc4c5",
                borderRadius: "0px",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                resize: "vertical"
              }}
            />
          </div>
        )}

        {/* Approved Details */}
        {order?.orderStatus === "RETURN_APPROVED" && order?.returnInfo?.approvedAt && (
          <div className="to-sum-row" style={{ marginTop: "8px", borderTop: "1px solid #e5e2e2", paddingTop: "8px" }}>
            <span className="to-sum-label">Approved At:</span>
            <span className="to-sum-val">
              {new Date(order.returnInfo.approvedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Rejected Details & Reason */}
        {order?.orderStatus === "RETURN_REJECTED" && (
          <div style={{ marginTop: "8px", borderTop: "1px solid #e5e2e2", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {order?.returnInfo?.rejectedAt && (
              <div className="to-sum-row">
                <span className="to-sum-label">Rejected At:</span>
                <span className="to-sum-val">
                  {new Date(order.returnInfo.rejectedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <span className="to-sum-label">Admin Rejection Reason:</span>
            <p style={{ margin: 0, fontSize: "13px", color: "#b91c1c", fontWeight: "600" }}>
              "{order?.returnInfo?.rejectionReason || "N/A"}"
            </p>
          </div>
        )}

      </div>

      {/* Modal Actions */}
      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        {order?.orderStatus === "RETURN_REQUESTED" ? (
          <>
            <button
              className="to-btn-black"
              style={{ flex: 1, backgroundColor: "#16a34a", borderColor: "#16a34a" }}
              onClick={() => {
                toggleStatus("RETURN_APPROVED");
                setIsReasonModalOpen(false);
              }}
            >
              APPROVE
            </button>
            <button
              className="to-btn-black"
              style={{ flex: 1, backgroundColor: "#dc2626", borderColor: "#dc2626" }}
              onClick={() => {
                toggleStatus("RETURN_REJECTED");
                setIsReasonModalOpen(false);
              }}
            >
              REJECT / SUBMIT
            </button>
          </>
        ) : (
          <button
            className="to-btn-outline"
            style={{ flex: 1 }}
            onClick={() =>{setIsReasonModalOpen(false);setRejectReason("")}}
          >
            CLOSE
          </button>
        )}
      </div>

      {order?.orderStatus === "RETURN_REQUESTED" && (
        <button
          className="to-btn-outline"
          style={{ width: "100%", marginTop: "8px" }}
          onClick={() => {
            setIsReasonModalOpen(false);setRejectReason("")
          }}
        >
          CLOSE
        </button>
      )}
    </div>
  </div>
)}










{/* ================= VIEW REASON / RETURN DETAILS MODAL ================= */}
{isReasonItemModalOpen && (
  <div className="to-modal-overlay">
    <div className="to-cancel-modal-card" style={{ position: "relative" }}>
      
      {/* Top Close "×" Button */}
      <button 
        onClick={() => {
          setIsReasonItemModalOpen(false);
          setRejectReason("");
        }}
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
        {toggleItem?.status === "RETURN_REQUESTED" && "Review Return Request"}
        {toggleItem?.status === "RETURN_APPROVED" && "Return Approved Details"}
        {toggleItem?.status === "RETURN_REJECTED" && "Return Rejected Details"}
        {toggleItem?.status === "RETURNED" && "Return Completed Details"}
      </h3>

      <div className="to-summary-rows" style={{ gap: "12px", marginTop: "10px" }}>
        {/* Requested At */}
        {toggleItem?.returnInfo?.requestedAt && (
          <div className="to-sum-row">
            <span className="to-sum-label">Requested At:</span>
            <span className="to-sum-val">
              {new Date(toggleItem.returnInfo.requestedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}

       {toggleItem!="CANCELLED"&&(
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span className="to-sum-label">User's Return Reason:</span>
          <p style={{ margin: 0, fontSize: "13px", color: "#1b1c1c", fontWeight: "600" }}>
            "{toggleItem?.returnInfo?.reason || "No reason provided"}"
          </p>
        </div>
       )} 

       {toggleItem=="CANCELLED"&&(
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span className="to-sum-label">User's Cancelletion Reason:</span>
          <p style={{ margin: 0, fontSize: "13px", color: "#1b1c1c", fontWeight: "600" }}>
            "{toggleItem?.cancellation?.reason || "No reason provided"}"
          </p>
        </div>
       )} 

        {/* Rejection Input Field (Appears directly when status is RETURN_REQUESTED) */}
        {toggleItem?.status === "RETURN_REQUESTED" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
            <span className="to-sum-label">Reason for Rejection (Required if rejecting):</span>
            <textarea
              className="to-sum-val"
              rows="3"
              placeholder="Type why this return is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #cfc4c5",
                borderRadius: "0px",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                resize: "vertical"
              }}
            />
          </div>
        )}


        

        {/* Approved Details */}
        {toggleItem?.status === "RETURN_APPROVED" && toggleItem?.returnInfo?.approvedAt && (
          <div className="to-sum-row" style={{ marginTop: "8px", borderTop: "1px solid #e5e2e2", paddingTop: "8px" }}>
            <span className="to-sum-label">Approved At:</span>
            <span className="to-sum-val">
              {new Date(toggleItem.returnInfo.approvedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Rejected Details & Reason */}
        {toggleItem?.status === "RETURN_REJECTED" && (
          <div style={{ marginTop: "8px", borderTop: "1px solid #e5e2e2", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {toggleItem?.returnInfo?.rejectedAt && (
              <div className="to-sum-row">
                <span className="to-sum-label">Rejected At:</span>
                <span className="to-sum-val">
                  {new Date(toggleItem.returnInfo.rejectedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <span className="to-sum-label">Admin Rejection Reason:</span>
            <p style={{ margin: 0, fontSize: "13px", color: "#b91c1c", fontWeight: "600" }}>
              "{toggleItem?.returnInfo?.rejectionReason || "N/A"}"
            </p>
          </div>
        )}
      </div>

      {/* Modal Actions */}
      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        {toggleItem?.status === "RETURN_REQUESTED" ? (
          <>
            <button
              className="to-btn-black"
              style={{ flex: 1, backgroundColor: "#16a34a", borderColor: "#16a34a" }}
              onClick={() => {
                toggleItemStatus("RETURN_APPROVED");
                setIsReasonItemModalOpen(false);
              }}
            >
              APPROVE
            </button>
            <button
              className="to-btn-black"
              style={{ flex: 1, backgroundColor: "#dc2626", borderColor: "#dc2626" }}
              onClick={() => {
                toggleItemStatus("RETURN_REJECTED");
                setIsReasonItemModalOpen(false);
              }}
            >
              REJECT / SUBMIT
            </button>
          </>
        ) : (
          <button
            className="to-btn-outline"
            style={{ flex: 1 }}
            onClick={() =>{setIsReasonItemModalOpen(false);setRejectReason("")}}
          >
            CLOSE
          </button>
        )}
      </div>

      {toggleItem?.status === "RETURN_REQUESTED" && (
        <button
          className="to-btn-outline"
          style={{ width: "100%", marginTop: "8px" }}
          onClick={() => {
            setIsReasonItemModalOpen(false);setRejectReason("")
          }}
        >
          CLOSE
        </button>
      )}
    </div>
  </div>
)}







      <UserFooter />
    </div>
  );
};

export default OrderDetails;