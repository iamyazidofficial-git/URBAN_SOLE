import React, { useState,useEffect } from 'react';
import './TrackOrder.css';
import Navbar from "../../../partials/navbar/navbar";
import UserFooter from '../../../partials/UserFooter/UserFooter';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loader from '../../../partials/Loader/Loader';
import { loadRazorpayScript } from '../../../utils/loadRazorpay';

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
  const [loading,setLoading]=useState(false)
  const [reviewModalOpen,setReviewModalOpen]=useState(false)
  const [reviewItem,setReviewItem]=useState("")
  const [reviewTitle,setReviewTitle]=useState("")
  const [reviewComment,setReviewComment]=useState("")
  const [reviewRating,setReviewRating]=useState("")
  const [reviewHoverRating,setReviewHoverRating]=useState(0)
  const [reviewError, setReviewError] = useState("")

  const location=useLocation()
  const orderId=location.state?.orderId

   console.log("ORDER ID FROM LOCATION:", orderId);
   console.log("YESSS")

  if (!orderId) {
    console.log("Order ID is missing");
    return;
  }

  const navigate=useNavigate()


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




  const canDownloadInvoice = () => {
    if (!order || !order.payment) return false;
    const method = String(order.payment.method || "").toUpperCase();
    if (method === "RAZORPAY" || method === "WALLET") {
      return true;
    }
    const allowedCodStatuses = [
      "DELIVERED",
      "RETURN_REQUESTED",
      "RETURN_REJECTED",
      "RETURN_APPROVED",
      "RETURNED"
    ];
    return allowedCodStatuses.includes(order.orderStatus);
  };

  const handleDownloadInvoice = () => {
    if (!order || !order.items || order.items.length === 0) {
      toast.error("Order details are loading, please wait...");
      return;
    }

    const orderDate = order?.createdAt
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

    const paymentMethodMap = {
      CASHONDELIVERY: "Cash on Delivery (COD)",
      RAZORPAY: "Razorpay (Online Payment)",
      WALLET: "Urban Sole Wallet"
    };
    const paymentMethodName = paymentMethodMap[String(order?.payment?.method || "").toUpperCase()] || order?.payment?.method || "N/A";

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
          <span>INV-${order.orderId || order._id}</span>
        </div>
        <div class="details-row">
          <span>Invoice Date:</span>
          <span>${invoiceDate}</span>
        </div>
        <div class="details-row">
          <span>Order ID:</span>
          <span>${order.orderId || order._id}</span>
        </div>
        <div class="details-row">
          <span>Order Date:</span>
          <span>${orderDate}</span>
        </div>
        <div class="details-row">
          <span>Payment Method:</span>
          <span>${paymentMethodName}</span>
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
        <p class="bold">${order.shippingAddress?.fullName || order.customerSnapshot?.name || "Customer"}</p>
        <p>${order.shippingAddress?.streetAddress || ""}${order.shippingAddress?.appartment ? ", " + order.shippingAddress.appartment : ""}</p>
        <p>${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.postalCode || ""}</p>
        <p>Phone: ${order.shippingAddress?.phoneNumber || "N/A"}</p>
        <p>Email: ${order.customerSnapshot?.email || "N/A"}</p>
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
              <div class="item-name">${item.productName || item.name || "Product"}</div>
              <div class="item-sub">Colour: ${item.colour || item.color || "Standard"} | Status: ${item.status || order.orderStatus}</div>
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
      toast.error(error?.response?.data?.message||"Something went wrong")
      console.log(error?.response?.data?.message || "Failed to Return order");
    } 
  };





  const handleRetryPayment = async () => {
  const targetId = order?._id || orderId;
  if (!targetId) {
    toast.error("Order details not found!");
    return;
  }

  try {
    setLoading(true);
    const res = await axiosInstance.post("/user/checkout/retry-payment", {
      _id: order?._id,
      orderId: order?.orderId || orderId,
    });

    if (res.data?.success) {
      const { razorpayOrder, customerSnapshot, _id: dbOrderId, orderId: customOrderId, razorpayKeyId } = res.data.data;

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
              orderId: dbOrderId || order?._id, // MongoDB _id അയക്കുക
            });

            if (verifyRes.data.success) {
              const baseDate = order?.createdAt ? new Date(order.createdAt) : new Date();
              const deliveryDate = new Date(baseDate);
              deliveryDate.setDate(deliveryDate.getDate() + 5);

              const startDay = String(baseDate.getDate()).padStart(2, "0");
              const endDay = String(deliveryDate.getDate()).padStart(2, "0");
              const month = deliveryDate.toLocaleString("en-US", { month: "short" }).toUpperCase();
              const year = deliveryDate.getFullYear();

              const formattedEstimatedDelivery = `${startDay}–${endDay} ${month} ${year}`;

              toast.success("Payment successful!");
              navigate("/user/checkout/orderSuccess", {
                replace: true,
                state: {
                  orderId: customOrderId || order?.orderId,
                  _id:order?.orderId,
                  estimatedDelivery: formattedEstimatedDelivery,
                },
              });
            }
          } catch (error) {
            toast.error("Payment verification failed");
            navigate("/user/paymentFailed", {
              replace: true,
              state: {
                orderId: customOrderId || order?.orderId,
                _id: dbOrderId || order?._id,
              },
            });
          }
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled");
            navigate("/user/paymentFailed", {
              replace: true,
              state: {
                orderId: customOrderId || order?.orderId,
                _id: dbOrderId || order?._id,
                items: order?.items,
              },
            });
          },
        },
        prefill: {
          name: customerSnapshot?.name || "",
          email: customerSnapshot?.email || "",
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    }
  } catch (error) {
    console.error("FULL VERIFICATION ERROR:", error);
    console.error("RESPONSE DATA:", error?.response?.data);
    toast.error(error?.response?.data?.message || "Could not retry payment");
  } finally {
    setLoading(false);
  }
};



    const reviewSubmit = async (e) => {
      e.preventDefault();
      setReviewError("");

      if (!reviewRating || reviewRating === "" || Number(reviewRating) < 1) {
        setReviewError("Please select a rating");
        toast.error("Please select a rating");
        return;
      }

      const cleanTitle = reviewTitle.trim();
      const letterCountInTitle = (cleanTitle.match(/[a-zA-Z]/g) || []).length;

      if (!cleanTitle || cleanTitle.length === 0) {
        setReviewError("Review title is Required");
        toast.error("Review title is Required");
        return;
      }
      if (letterCountInTitle < 4) {
        setReviewError("Review title must contain at least 4 letters");
        toast.error("Review title must contain at least 4 letters");
        return;
      }
      if (!/^[a-zA-Z ]+$/.test(cleanTitle)) {
        setReviewError("Review title must contain only letters");
        toast.error("Review title must contain only letters");
        return;
      }

      // 3. Review Comment Validations
      const cleanComment = reviewComment.trim();
      const nonSpaceCharsInComment = cleanComment.replace(/\s/g, "").length;

      if (!cleanComment || cleanComment.length === 0) {
        setReviewError("Review comment cannot be empty or full spaces");
        toast.error("Review comment cannot be empty or full spaces");
        return;
      }
      if (nonSpaceCharsInComment < 10) {
        setReviewError("Review comment must contain at least 10 characters");
        toast.error("Review comment must contain at least 10 characters");
        return;
      }

      try {
        setLoading(true);

        const response = await axiosInstance.post("/user/review/addReview", {
          product: reviewItem.product?._id || reviewItem.product,
          rating: Number(reviewRating),
          title: cleanTitle,
          comment: cleanComment
        });

        if (response.data?.success) {
          toast.success("Review submitted successfully!");
          setReviewItem("");
          setReviewComment("");
          setReviewTitle("");
          setReviewHoverRating(0);
          setReviewRating(0);
          setReviewError("");
          setReviewModalOpen(false);
        }
      } catch (error) {
        console.log(error);
        const rawMsg = error?.response?.data?.message || "Failed to submit review";
        const displayMsg = rawMsg.toLowerCase().includes("already")
          ? "You have already uploaded a review for this product."
          : rawMsg;
        setReviewError(displayMsg);
        toast.error(displayMsg);
      } finally {
        setLoading(false);
      }
    };



  useEffect(()=>{
    fetchTrackOrder()
  },[])

  return (
    <div className="us-page-wrapper">
      <Navbar />
      {loading&&(<Loader/>)}
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
                      <h3 className="to-prod-name">{item.productName}</h3>
                      <p className="to-prod-specs">SIZE: {item.size} / QUANTITY: {item.quantity}</p>
                      <p className="to-prod-specs"></p>
                      
                      <div className="to-prod-action-buttons">
                        {item.status === "RETURN_APPROVED" ? (
                          <div className="od-return-bar-badge" style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                            <svg 
                              className="od-notification-bell return_approved" 
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
                            <span className="od-bar-status-text return_approved" style={{ color: "#137333", fontWeight: "700" }}>
                              RETURN APPROVED
                            </span>
                            <button 
                              className="to-btn-black" 
                              style={{ padding: "6px 12px", fontSize: "11px" }}
                              onClick={() => { setReviewModalOpen(true); setReviewItem(item); setReviewError(""); }}
                            >
                              Write Review
                            </button>
                          </div>
                        ) : (
                          <>
                            {["DELIVERED", "RETURN_REQUESTED", "RETURN_REJECTED", "RETURNED"].includes(item.status) && (
                              <button 
                                className="to-btn-black" 
                                onClick={() => { setReviewModalOpen(true); setReviewItem(item); setReviewError(""); }}
                              >
                                Write Review
                              </button>
                            )}

                            {item.status === "CANCELLED" ? (
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
                                  onClick={() => { setIsReasonModalOpen(true); setReasonItem(item); }}
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
                            ) : item.status === "PENDING" ? (
                              <span className="to-status-text-badge return-requested">
                                PENDING
                              </span>
                            ) : !["CANCELLED", "RETURNED", "RETURN_APPROVED", "RETURN_REQUESTED", "PENDING"].includes(item.status) &&
                                !["CANCELLED", "RETURNED", "RETURN_APPROVED", "DELIVERED"].includes(order.orderStatus) && (
                              <button
                                className="to-btn-outline"
                                onClick={() => {
                                  setIsCancelModalOpen(true);
                                  setCancellationId(item.product);
                                }}
                              >
                                CANCEL PRODUCT
                              </button>
                            )}
                          </>
                        )}
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
              ) :  order.orderStatus === "RETURN_APPROVED" ? (
                <button className="to-btn-bottom" disabled style={{
  backgroundColor: "#f3f4f6",
  color: "#16a34a",
  cursor: "not-allowed"
}}>RETURN APPROVED</button>
              ) :  order.orderStatus === "DELIVERED" ? (
                <button className="to-btn-bottom" onClick={() => { setIsReturnModalOpen(true); setReturnId(orderId); }}>RETURN ENTIRE ORDER</button>

              ) :
               order.orderStatus === "PENDING" ? (
                <button className="to-btn-bottom" onClick={handleRetryPayment}>RETRY PAYMENT</button>

              ) : 
              (
                <button className="to-btn-bottom" onClick={() => { setIsCancelModalOpen(true); setCancellationId(orderId); }}>CANCEL ENTIRE ORDER</button>
              )}
              {canDownloadInvoice() && (
                <button className="to-btn-bottom" onClick={handleDownloadInvoice}>DOWNLOAD INVOICE</button>
              )}
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







{reviewModalOpen==true &&(
  <div className="urm-modal-overlay">
      <div className="urm-modal-card">
        
        {/* Close Button */}
        <button className="urm-close-btn" onClick={()=>{setReviewModalOpen(false);setReviewComment("");setReviewTitle("");setReviewHoverRating(0);setReviewRating("");setReviewError("")}}>&times;</button>

        <div className="urm-header">
          <h2 className="urm-title">WRITE A REVIEW</h2>
          <p className="urm-subtitle">Share your experience with other customers.</p>
        </div>

        {/* Inline Error Message in Review Modal */}
        {reviewError && (
          <div
            className="urm-error-banner"
            style={{
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fca5a5",
              padding: "10px 14px",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: "600",
              margin: "10px 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <span>{reviewError}</span>
          </div>
        )}

        {/* Product Preview Box */}
        {reviewItem && (
          <div className="urm-product-box">
            <div className="urm-img-box">
              <img src={reviewItem.image} alt={reviewItem.productName || "Product"} />
            </div>
            <div className="urm-prod-info">
              <h3 className="urm-prod-name">{reviewItem.productName}</h3>
            </div>
          </div>
        )}

        <form onSubmit={reviewSubmit}>
          {/* Overall Rating Stars */}
          <div className="urm-rating-section">
            <label className="urm-label">OVERALL RATING</label>
            <div className="urm-stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`urm-star ${star <= (reviewHoverRating || reviewRating) ? 'filled' : ''}`}
                  onClick={() => {
                    setReviewRating(star);
                    if (reviewError) setReviewError("");
                  }}
                  onMouseEnter={() => setReviewHoverRating(star)}
                  onMouseLeave={() => setReviewHoverRating(0)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Review Title */}
          <div className="urm-field-group">
            <label className="urm-label">REVIEW TITLE</label>
            <input
              type="text"
              className="urm-input"
              placeholder="Sum up your experience"
              value={reviewTitle}
              onChange={(e) => {
                setReviewTitle(e.target.value);
                if (reviewError) setReviewError("");
              }}
              maxLength={60}
              required
            />
          </div>

          {/* Detailed Review */}
          <div className="urm-field-group">
            <label className="urm-label">DETAILED REVIEW</label>
            <textarea
              className="urm-textarea"
              placeholder="What did you like or dislike? How did it fit?"
              value={reviewComment}
              onChange={(e) => {
                setReviewComment(e.target.value);
                if (reviewError) setReviewError("");
              }}
              rows={4}
              required
            ></textarea>
          </div>

          {/* Submit Button */}
          <button type="submit" className="urm-submit-btn" disabled={loading}>
            {loading ? "SUBMITTING..." : "SUBMIT REVIEW"}
          </button>
        </form>

      </div>
    </div>
)}



      <UserFooter />
    </div>
  );
};

export default TrackOrder;