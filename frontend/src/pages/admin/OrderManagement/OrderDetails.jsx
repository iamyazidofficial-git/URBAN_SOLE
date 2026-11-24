import React, { useState, useEffect } from 'react';
import './OrderDetails.css';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import AdminSidebar from '../../../partials/AdminSidebar/AdminSidebar';
import { toast } from 'react-toastify';

const OrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [itemStatusModal, setItemStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [toggleItem, setToggleItem] = useState(null);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [isReasonItemModalOpen, setIsReasonItemModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const activeId = orderId || order?._id;
      if (!activeId) return;
      const response = await axiosInstance.get(`/admin/order/orderDetails/${activeId}`);
      if (response?.data?.success === true) {
        setOrder(response?.data?.data);
      }
    } catch (error) {
      console.log(error?.response?.data?.message || "Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) {
      toast.error("Order details not loaded yet");
      return;
    }

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      : "N/A";

    const invoiceDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const paymentMethod = {
      CASHONDELIVERY: "Cash on Delivery (COD)",
      RAZORPAY: "Razorpay (Online Payment)",
      WALLET: "Urban Sole Wallet"
    }[order?.payment?.method] || order?.payment?.method || "N/A";

    const invoiceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${order.orderId || "Order"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111;
      background: #f4f4f4;
      padding: 30px;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 820px;
      margin: 0 auto;
      border: 1px solid #ddd;
      padding: 36px 40px;
      background: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #000;
      margin-bottom: 4px;
    }
    .brand-subtitle {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
    }
    .invoice-title-block { text-align: right; }
    .invoice-title {
      font-size: 20px;
      font-weight: 800;
      text-transform: uppercase;
      color: #000;
      letter-spacing: 1px;
    }
    .invoice-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #000;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 6px;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .meta-block h4 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #777;
      margin-bottom: 8px;
    }
    .meta-block p {
      font-size: 12px;
      color: #222;
      margin-bottom: 2px;
    }
    .meta-block .bold {
      font-weight: 700;
      color: #000;
      font-size: 13px;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 12px;
    }
    .details-row span:first-child { color: #666; }
    .details-row span:last-child { font-weight: 600; color: #111; }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .table th {
      background: #f7f7f7;
      color: #333;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      padding: 10px 12px;
      text-align: left;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 12px;
      vertical-align: middle;
    }
    .table .text-right { text-align: right; }
    .table .text-center { text-align: center; }
    .item-name { font-weight: 700; color: #000; }
    .item-sub { font-size: 11px; color: #666; margin-top: 2px; }
    .summary-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 28px;
    }
    .summary-box { width: 300px; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
      color: #444;
    }
    .summary-row.total {
      border-top: 2px solid #000;
      margin-top: 8px;
      padding-top: 8px;
      font-size: 15px;
      font-weight: 800;
      color: #000;
    }
    .footer-note {
      border-top: 1px dashed #ccc;
      padding-top: 16px;
      text-align: center;
      font-size: 11px;
      color: #777;
    }
    .actions-bar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .action-btn {
      padding: 8px 18px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      border: 1px solid #000;
      background: #000;
      color: #fff;
    }
    .action-btn.secondary { background: #fff; color: #000; }
    @media print {
      body { background: #fff; padding: 0; }
      .actions-bar { display: none !important; }
      .invoice-card { border: none; padding: 0; box-shadow: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="actions-bar">
    <button class="action-btn secondary" onclick="window.close()">Close</button>
    <button class="action-btn" onclick="window.print()">Print / Save PDF</button>
  </div>

  <div class="invoice-card">
    <div class="invoice-header">
      <div>
        <div class="brand-title">URBAN SOLE</div>
        <div class="brand-subtitle">Premium Footwear & Streetwear</div>
      </div>
      <div class="invoice-title-block">
        <div class="invoice-title">Tax Invoice</div>
        <div class="invoice-badge">${order.orderStatus || "ORDER"}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-block">
        <h4>Sold By</h4>
        <p class="bold">Urban Sole Retail Pvt. Ltd.</p>
        <p>12/4 MG Road, Brigade Junction</p>
        <p>Bengaluru, Karnataka - 560001</p>
        <p>GSTIN: 29AABCU9603R1ZM</p>
        <p>Email: support@urbansole.com</p>
      </div>

      <div class="meta-block">
        <h4>Invoice Details</h4>
        <div class="details-row">
          <span>Invoice No:</span>
          <span>INV-${order.orderId}</span>
        </div>
        <div class="details-row">
          <span>Invoice Date:</span>
          <span>${invoiceDate}</span>
        </div>
        <div class="details-row">
          <span>Order ID:</span>
          <span>${order.orderId}</span>
        </div>
        <div class="details-row">
          <span>Order Date:</span>
          <span>${orderDate}</span>
        </div>
        <div class="details-row">
          <span>Payment Method:</span>
          <span>${paymentMethod}</span>
        </div>
        <div class="details-row">
          <span>Payment Status:</span>
          <span>${order.payment?.status || "N/A"}</span>
        </div>
      </div>
    </div>

    <div class="meta-grid" style="margin-top: -12px;">
      <div class="meta-block">
        <h4>Billed / Shipped To</h4>
        <p class="bold">${order.shippingAddress?.fullName || order.user?.name || order.customerSnapshot?.name || "Customer"}</p>
        <p>${order.shippingAddress?.streetAddress || ""}${order.shippingAddress?.appartment ? ", " + order.shippingAddress.appartment : ""}</p>
        <p>${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.postalCode || ""}</p>
        <p>Phone: ${order.shippingAddress?.phoneNumber || "N/A"}</p>
        <p>Email: ${order.user?.email || order.customerSnapshot?.email || "N/A"}</p>
      </div>

      <div class="meta-block">
        <h4>Order Status Info</h4>
        <div class="details-row">
          <span>Order Status:</span>
          <span>${order.orderStatus}</span>
        </div>
        ${order.cancellation?.reason ? `
        <div class="details-row">
          <span>Cancellation Reason:</span>
          <span style="color: #dc2626;">${order.cancellation.reason}</span>
        </div>` : ""}
        ${order.returnInfo?.reason ? `
        <div class="details-row">
          <span>Return Reason:</span>
          <span>${order.returnInfo.reason}</span>
        </div>` : ""}
        ${order.returnInfo?.rejectionReason ? `
        <div class="details-row">
          <span>Admin Rejection Reason:</span>
          <span style="color: #dc2626;">${order.returnInfo.rejectionReason}</span>
        </div>` : ""}
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th style="width: 40px;" class="text-center">#</th>
          <th>Item Description</th>
          <th class="text-center" style="width: 70px;">Size</th>
          <th class="text-center" style="width: 60px;">Qty</th>
          <th class="text-right" style="width: 100px;">Price</th>
          <th class="text-right" style="width: 100px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(order.items || []).map((item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>
              <div class="item-name">${item.productName}</div>
              <div class="item-sub">Colour: ${item.colour || "Standard"} | Status: ${item.status || order.orderStatus}</div>
            </td>
            <td class="text-center">${item.size || "N/A"}</td>
            <td class="text-center">${item.quantity || 1}</td>
            <td class="text-right">₹${Number(item.price || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${Number(item.itemTotal || (item.price * item.quantity) || 0).toLocaleString("en-IN")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="summary-container">
      <div class="summary-box">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>₹${Number(order.pricing?.subTotal || 0).toLocaleString("en-IN")}</span>
        </div>
        <div class="summary-row">
          <span>Shipping Charge</span>
          <span>${order.pricing?.shippingCharge > 0 ? "+₹" + Number(order.pricing.shippingCharge).toLocaleString("en-IN") : "FREE"}</span>
        </div>
        <div class="summary-row">
          <span>GST / Tax (${order.pricing?.taxPercentage || 18}%)</span>
          <span>₹${Number(order.pricing?.tax || 0).toLocaleString("en-IN")}</span>
        </div>
        ${order.pricing?.discount > 0 ? `
        <div class="summary-row" style="color: #16a34a;">
          <span>Coupon Discount${order.appliedCoupon?.code ? ` (${order.appliedCoupon.code})` : ""}</span>
          <span>-₹${Number(order.pricing.discount).toLocaleString("en-IN")}</span>
        </div>` : ""}
        <div class="summary-row total">
          <span>Total Amount</span>
          <span>₹${Number(order.pricing?.totalAmount || 0).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>

    <div class="footer-note">
      <p>This is a computer-generated tax invoice. No physical signature is required.</p>
      <p>For any queries or customer support, please reach out to support@urbansole.com.</p>
      <p style="margin-top: 4px; font-weight: 600; color: #111;">Thank you for shopping with Urban Sole!</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
    } else {
      toast.error("Pop-up blocked. Please allow pop-ups to download invoice.");
    }
  };

  const toggleStatus = async (status) => {
    try {
      const activeOrderId = order?._id || orderId;
      if (!activeOrderId) {
        toast.error("Order ID not found");
        return;
      }

      if (status === "CANCELLED") {
        if (!cancellationReason || cancellationReason.trim() === "") {
          setReasonError("Reason is required for cancellation");
          return;
        }
        if (cancellationReason.trim().length < 8) {
          setReasonError("Minimum 8 characters are required.");
          return;
        }

        const response = await axiosInstance.patch(`/admin/order/toggleStatus/${activeOrderId}`, {
          status: status,
          reason: cancellationReason.trim()
        });
        if (response?.data?.success === true) {
          setStatusModal(false);
          setIsReasonModalOpen(false);
          setCancellationReason("");
          setReasonError("");
          setToggleItem(null);
          fetchOrderDetails();
          toast.success("Order cancelled successfully");
        }
        return;
      }

      if (status === "RETURN_REJECTED") {
        if (!rejectReason || rejectReason.trim() === "") {
          setReasonError("Reason is required for rejection");
          return;
        }
        if (rejectReason.trim().length < 8) {
          setReasonError("Rejection reason must be at least 8 characters.");
          return;
        }

        const response = await axiosInstance.patch(`/admin/order/toggleStatus/${activeOrderId}`, {
          status: status,
          reason: rejectReason.trim()
        });
        if (response?.data?.success === true) {
          setStatusModal(false);
          setIsReasonModalOpen(false);
          setRejectReason("");
          setReasonError("");
          setToggleItem(null);
          fetchOrderDetails();
          toast.success("Return rejected successfully");
        }
        return;
      }

      const response = await axiosInstance.patch(`/admin/order/toggleStatus/${activeOrderId}`, {
        status: status,
        reason: cancellationReason || ""
      });

      if (response?.data?.success === true) {
        setStatusModal(false);
        setIsReasonModalOpen(false);
        setReasonError("");
        setToggleItem(null);
        fetchOrderDetails();
        toast.success(`Order status changed to ${status}`);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Something went wrong";
      setReasonError(msg);
      toast.error(msg);
    }
  };

  const toggleItemStatus = async (status) => {
    try {
      const activeOrderId = order?._id || orderId;
      const prodId = toggleItem?.product?._id || toggleItem?.product || toggleItem?._id;

      if (!activeOrderId || !prodId) {
        toast.error("Item reference not found");
        return;
      }

      if (status === "CANCELLED") {
        if (!cancellationReason || cancellationReason.trim() === "") {
          setReasonError("Reason is required for cancellation");
          return;
        }
        if (cancellationReason.trim().length < 8) {
          setReasonError("Minimum 8 characters are required.");
          return;
        }

        const response = await axiosInstance.patch(`/admin/order/toggleItem/${activeOrderId}/${prodId}`, {
          status: status,
          reason: cancellationReason.trim()
        });
        if (response?.data?.success === true) {
          setItemStatusModal(false);
          setIsReasonItemModalOpen(false);
          setCancellationReason("");
          setReasonError("");
          setToggleItem(null);
          fetchOrderDetails();
          toast.success("Item cancelled successfully");
        }
        return;
      }

      if (status === "RETURN_REJECTED") {
        if (!rejectReason || rejectReason.trim() === "") {
          setReasonError("Reason is required for rejection");
          return;
        }
        if (rejectReason.trim().length < 8) {
          setReasonError("Rejection reason must be at least 8 characters.");
          return;
        }

        const response = await axiosInstance.patch(`/admin/order/toggleItem/${activeOrderId}/${prodId}`, {
          status: status,
          reason: rejectReason.trim()
        });
        if (response?.data?.success === true) {
          setItemStatusModal(false);
          setIsReasonItemModalOpen(false);
          setRejectReason("");
          setReasonError("");
          setToggleItem(null);
          fetchOrderDetails();
          toast.success("Item return rejected successfully");
        }
        return;
      }

      const response = await axiosInstance.patch(`/admin/order/toggleItem/${activeOrderId}/${prodId}`, {
        status: status
      });

      if (response?.data?.success === true) {
        setItemStatusModal(false);
        setIsReasonItemModalOpen(false);
        setReasonError("");
        setToggleItem(null);
        fetchOrderDetails();
        toast.success(`Item status changed to ${status}`);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Something went wrong";
      setReasonError(msg);
      toast.error(msg);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <div className="od-page-container" style={{ textAlign: "center", padding: "60px" }}>
          <p className="to-order-id-sub">Loading order details...</p>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <AdminSidebar />
        <div className="od-page-container" style={{ textAlign: "center", padding: "60px" }}>
          <h1 className="to-main-title">Order Not Found</h1>
          <button className="to-btn-black" onClick={() => navigate(-1)} style={{ marginTop: "16px" }}>
            Back to Orders
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebar />
      <div className="od-page-container">
        
        {/* Top Navigation & Header */}
        <div className="od-top-bar">
          <button className="od-back-link" onClick={() => navigate(-1)}>
            ← Back to Orders
          </button>

          <div className="od-header-actions">
            {["RETURN_REQUESTED", "RETURN_REJECTED", "RETURN_APPROVED", "RETURNED", "CANCELLED"].includes(order?.orderStatus) && (
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

                <button 
                  className="od-bar-view-reason-btn"
                  onClick={() => {
                    setIsReasonModalOpen(true);
                    setRejectReason("");
                    setReasonError("");
                  }}
                >
                  VIEW REASON
                </button>
              </div>
            )}

            {/* Download Invoice Button - Available at ALL times */}
            <button className="od-top-btn" onClick={handleDownloadInvoice} title="Download printable Tax Invoice">
              <span className="material-symbols-outlined">receipt_long</span> Download Invoice
            </button>
            
            {["PLACED", "SHIPPED", "OUT_OF_DELIVERY", "RETURN_APPROVED"].includes(order.orderStatus) && (
              <button 
                className="od-top-btn od-primary-btn" 
                onClick={() => {
                  setStatusModal(true);
                  setSelectedStatus(order.orderStatus === "PLACED" ? "SHIPPED" : order.orderStatus);
                  setCancellationReason("");
                  setReasonError("");
                }}
              >
                Change Status
              </button>
            )}
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

              {/* Items Table */}
              <div className="od-table-wrapper">
                <table className="od-items-table">
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>NAME</th>
                      <th>SIZE</th>
                      <th>QTY</th>
                      <th>TOTAL</th>
                      <th>ACTION</th>                    
                    </tr>
                  </thead>
                  <tbody>
                    {order?.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="od-table-img-box">
                            <img src={item.image} alt={item.productName || item.name} />
                          </div>
                        </td>
                        <td className="od-table-text">{item.productName}</td>
                        <td className="od-table-text">{item.size || 'N/A'}</td>
                        <td className="od-table-text">{item.quantity}</td>
                        <td className="od-table-text od-bold-text">₹{item.itemTotal?.toLocaleString()}</td>
                        <td className="od-table-text od-bold-text">
                          <div className="od-inline-status-action">
                            {["RETURN_REQUESTED", "RETURN_APPROVED", "CANCELLED", "RETURN_REJECTED"].includes(item.status) ? (
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
                                  onClick={() => {
                                    setIsReasonItemModalOpen(true);
                                    setToggleItem(item);
                                    setRejectReason("");
                                    setReasonError("");
                                  }}
                                >
                                  View Reason
                                </button>
                                
                                {["PLACED", "SHIPPED", "OUT_OF_DELIVERY", "RETURN_APPROVED"].includes(item.status) && (
                                  <span 
                                    className="od-inline-pen-icon" 
                                    onClick={() => {
                                      setToggleItem(item);
                                      setItemStatusModal(true);
                                      setSelectedStatus(item.status === "PLACED" ? "SHIPPED" : item.status);
                                      setCancellationReason("");
                                      setReasonError("");
                                    }}
                                    title="Update Status"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <>
                                <span className={`od-status-pill-badge ${item.status?.toLowerCase()}`}>
                                  {item.status?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                
                                {["PLACED", "SHIPPED", "OUT_OF_DELIVERY", "RETURN_APPROVED"].includes(item.status) && (
                                  <span 
                                    className="od-inline-pen-icon" 
                                    onClick={() => {
                                      setToggleItem(item);
                                      setItemStatusModal(true);
                                      setSelectedStatus(item.status === "PLACED" ? "SHIPPED" : item.status);
                                      setCancellationReason("");
                                      setReasonError("");
                                    }}
                                    title="Update Status"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                  </span>
                                )}
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
                {[
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
                  const isCompleted = thisStepIdx <= currentStatusIdx || !!timelineEntry;
                  
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
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ================= ORDER STATUS MODAL ================= */}
      {statusModal && (
        <div className="od-modal-overlay">
          <div className="od-modal-card">
            <h3 className="od-modal-title">Update Status</h3>
            <p className="od-modal-subtitle">Select the new status</p>

            <div className="od-modal-dropdown-container">
              <label className="od-modal-label">Order Status</label>
              <select 
                className="od-modal-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value={order.orderStatus} disabled>
                  {order.orderStatus}
                </option> 

                {/* From PLACED: only SHIPPED and CANCELLED allowed (NO OUT_OF_DELIVERY) */}
                {order.orderStatus === "PLACED" && (
                  <option value="SHIPPED">SHIPPED</option>
                )}

                {order.orderStatus === "SHIPPED" && (
                  <option value="OUT_OF_DELIVERY">OUT_OF_DELIVERY</option>
                )}

                {order.orderStatus === "OUT_OF_DELIVERY" && (
                  <option value="DELIVERED">DELIVERED</option>
                )}

                {order.orderStatus === "RETURN_APPROVED" && (
                  <option value="RETURNED">RETURNED</option>
                )}

                {["PLACED", "SHIPPED", "OUT_OF_DELIVERY"].includes(order.orderStatus) && (
                  <option value="CANCELLED">CANCELLED</option>
                )}
              </select>
            </div>

            {selectedStatus === "CANCELLED" && (
              <div className="od-modal-dropdown-container" style={{ marginTop: '12px' }}>
                <label className="od-modal-label">Reason (Required, min 8 characters)</label>
                <textarea 
                  className="od-modal-textarea"
                  placeholder="Enter cancellation reason (minimum 8 characters)..."
                  value={cancellationReason}
                  maxLength={100} 
                  onChange={(e) => {
                    setCancellationReason(e.target.value);
                    if (reasonError) setReasonError("");
                  }}
                ></textarea>
                {reasonError && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{reasonError}</p>}
              </div>
            )}

            <div className="od-modal-actions">
              <button 
                className="od-modal-btn-cancel" 
                onClick={() => {
                  setStatusModal(false);
                  setCancellationReason("");
                  setReasonError("");
                }}
              >
                Cancel
              </button>
              <button 
                className="od-modal-btn-confirm" 
                onClick={() => toggleStatus(selectedStatus)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ITEM STATUS MODAL ================= */}
      {itemStatusModal && (
        <div className="od-modal-overlay">
          <div className="od-modal-card">
            <h3 className="od-modal-title">Update Item Status</h3>
            <p className="od-modal-subtitle">Select the new status for {toggleItem?.productName}</p>

            <div className="od-modal-dropdown-container">
              <label className="od-modal-label">Item Status</label>
              <select 
                className="od-modal-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value={toggleItem?.status} disabled>
                  {toggleItem?.status}
                </option>             
                
                {/* From PLACED: only SHIPPED and CANCELLED allowed (NO OUT_OF_DELIVERY) */}
                {toggleItem?.status === "PLACED" && (
                  <option value="SHIPPED">SHIPPED</option>
                )}

                {toggleItem?.status === "SHIPPED" && (
                  <option value="OUT_OF_DELIVERY">OUT_OF_DELIVERY</option>
                )}

                {toggleItem?.status === "OUT_OF_DELIVERY" && (
                  <option value="DELIVERED">DELIVERED</option>
                )}

                {toggleItem?.status === "RETURN_APPROVED" && (
                  <option value="RETURNED">RETURNED</option>
                )}

                {["PLACED", "SHIPPED", "OUT_OF_DELIVERY"].includes(toggleItem?.status) && (
                  <option value="CANCELLED">CANCELLED</option>
                )}
              </select>
            </div>

            {selectedStatus === "CANCELLED" && (
              <div className="od-modal-dropdown-container" style={{ marginTop: '12px' }}>
                <label className="od-modal-label">Reason (Required, min 8 characters)</label>
                <textarea 
                  className="od-modal-textarea"
                  placeholder="Enter cancellation reason (minimum 8 characters)..."
                  value={cancellationReason}
                  maxLength={100} 
                  onChange={(e) => {
                    setCancellationReason(e.target.value);
                    if (reasonError) setReasonError("");
                  }}
                ></textarea>
                {reasonError && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{reasonError}</p>}
              </div>
            )}

            <div className="od-modal-actions">
              <button 
                className="od-modal-btn-cancel" 
                onClick={() => {
                  setItemStatusModal(false);
                  setCancellationReason("");
                  setReasonError("");
                }}
              >
                Cancel
              </button>
              <button 
                className="od-modal-btn-confirm" 
                onClick={() => toggleItemStatus(selectedStatus)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW REASON / ORDER RETURN DETAILS MODAL ================= */}
      {isReasonModalOpen && (
        <div className="to-modal-overlay">
          <div className="to-cancel-modal-card" style={{ position: "relative" }}>
            
            {/* Top Close "×" Button */}
            <button 
              onClick={() => {
                setIsReasonModalOpen(false);
                setRejectReason("");
                setReasonError("");
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
              {order?.orderStatus === "CANCELLED" && "Cancellation Details"}
            </h3>

            <div className="to-summary-rows" style={{ gap: "12px", marginTop: "10px" }}>
              {order?.returnInfo?.requestedAt && order?.orderStatus !== "CANCELLED" && (
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

              {order?.cancellation?.at && order?.orderStatus === "CANCELLED" && (
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

              {order?.orderStatus !== "CANCELLED" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="to-sum-label">User's Return Reason:</span>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1b1c1c", fontWeight: "600" }}>
                    "{order?.returnInfo?.reason || "No reason provided"}"
                  </p>
                </div>
              )} 

              {order?.orderStatus === "CANCELLED" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="to-sum-label">Cancellation Reason:</span>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1b1c1c", fontWeight: "600" }}>
                    "{order?.cancellation?.reason || "No reason provided"}"
                  </p>
                </div>
              )} 

              {/* Rejection Input Field - Required min 8 characters */}
              {order?.orderStatus === "RETURN_REQUESTED" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                  <span className="to-sum-label">Reason for Rejection (Required if rejecting, min 8 characters):</span>
                  <textarea
                    className="to-sum-val"
                    rows="3"
                    placeholder="Type reason for rejection (at least 8 characters)..."
                    value={rejectReason}
                    onChange={(e) => {
                      setRejectReason(e.target.value);
                      if (reasonError) setReasonError("");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: reasonError ? "1px solid #dc2626" : "1px solid #cfc4c5",
                      borderRadius: "0px",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      resize: "vertical"
                    }}
                  />
                  {reasonError && (
                    <p style={{ color: "#dc2626", fontSize: "12px", margin: "2px 0 0 0", fontWeight: "600" }}>
                      {reasonError}
                    </p>
                  )}
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
                    onClick={() => toggleStatus("RETURN_APPROVED")}
                  >
                    APPROVE
                  </button>
                  <button
                    className="to-btn-black"
                    style={{ flex: 1, backgroundColor: "#dc2626", borderColor: "#dc2626" }}
                    onClick={() => toggleStatus("RETURN_REJECTED")}
                  >
                    REJECT / SUBMIT
                  </button>
                </>
              ) : (
                <button
                  className="to-btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setIsReasonModalOpen(false);
                    setRejectReason("");
                    setReasonError("");
                  }}
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
                  setIsReasonModalOpen(false);
                  setRejectReason("");
                  setReasonError("");
                }}
              >
                CLOSE
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW REASON / ITEM RETURN DETAILS MODAL ================= */}
      {isReasonItemModalOpen && (
        <div className="to-modal-overlay">
          <div className="to-cancel-modal-card" style={{ position: "relative" }}>
            
            {/* Top Close "×" Button */}
            <button 
              onClick={() => {
                setIsReasonItemModalOpen(false);
                setRejectReason("");
                setReasonError("");
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
              {toggleItem?.status === "CANCELLED" && "Item Cancellation Details"}
            </h3>

            <div className="to-summary-rows" style={{ gap: "12px", marginTop: "10px" }}>
              {toggleItem?.returnInfo?.requestedAt && toggleItem?.status !== "CANCELLED" && (
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

              {toggleItem?.status !== "CANCELLED" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="to-sum-label">User's Return Reason:</span>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1b1c1c", fontWeight: "600" }}>
                    "{toggleItem?.returnInfo?.reason || "No reason provided"}"
                  </p>
                </div>
              )} 

              {toggleItem?.status === "CANCELLED" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="to-sum-label">Cancellation Reason:</span>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1b1c1c", fontWeight: "600" }}>
                    "{toggleItem?.cancellation?.reason || "No reason provided"}"
                  </p>
                </div>
              )} 

              {/* Rejection Input Field - Required min 8 characters */}
              {toggleItem?.status === "RETURN_REQUESTED" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                  <span className="to-sum-label">Reason for Rejection (Required if rejecting, min 8 characters):</span>
                  <textarea
                    className="to-sum-val"
                    rows="3"
                    placeholder="Type reason for rejection (at least 8 characters)..."
                    value={rejectReason}
                    onChange={(e) => {
                      setRejectReason(e.target.value);
                      if (reasonError) setReasonError("");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: reasonError ? "1px solid #dc2626" : "1px solid #cfc4c5",
                      borderRadius: "0px",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      resize: "vertical"
                    }}
                  />
                  {reasonError && (
                    <p style={{ color: "#dc2626", fontSize: "12px", margin: "2px 0 0 0", fontWeight: "600" }}>
                      {reasonError}
                    </p>
                  )}
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
                    onClick={() => toggleItemStatus("RETURN_APPROVED")}
                  >
                    APPROVE
                  </button>
                  <button
                    className="to-btn-black"
                    style={{ flex: 1, backgroundColor: "#dc2626", borderColor: "#dc2626" }}
                    onClick={() => toggleItemStatus("RETURN_REJECTED")}
                  >
                    REJECT / SUBMIT
                  </button>
                </>
              ) : (
                <button
                  className="to-btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setIsReasonItemModalOpen(false);
                    setRejectReason("");
                    setReasonError("");
                  }}
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
                  setIsReasonItemModalOpen(false);
                  setRejectReason("");
                  setReasonError("");
                }}
              >
                CLOSE
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetails;
