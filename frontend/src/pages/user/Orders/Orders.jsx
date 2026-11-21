import React, { useEffect, useState } from 'react';
import './Orders.css';
import axiosInstance from '../../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import Navbar from "../../../partials/navbar/navbar";
import UserFooter from '../../../partials/UserFooter/UserFooter';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            const response = await axiosInstance.get("/user/order/getOrder");
            if (response?.data?.success === true) {
                setOrders(response?.data?.data || []);
            }
        } catch (error) {
            console.log(error?.response?.data?.error || "Something went wrong");
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div className="ms-page-wrapper">
            <Navbar />
            <div className="ms-main-content">
                
                {/* Header Section matching the image */}
                <header className="ms-header" style={{ textAlign: 'center', paddingBottom: '32px' }}>
                    <h1 className="ms-title">MY ORDERS</h1>
                    <p className="ms-subtitle" style={{ margin: '0 auto' }}>Track and manage your recent purchases.</p>
                </header>

                <div className="us-orders-container">
                    <div className="us-orders-list">
                        {orders?.map((order) => {
                            const firstItem = order.items?.[0] || {};
                            const product = firstItem.product || {};
                            const productName = product.name || "Minimalist Low - Ash Gray";
                            const productImage = firstItem.image || product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";
                            const orderId = order.orderId || "US-10042";
                            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "November 15, 2024";
                            const totalAmount = order.pricing?.totalAmount
                            const orderStatus = order.orderStatus || "SHIPPED";

                            return (
                                <div key={order._id || orderId} className="us-order-card">
                                    
                                    {/* Left: Product Image */}
                                    <div className="us-order-img-box">
                                        <img src={productImage} alt={productName} />
                                    </div>

                                    {/* Center: Order Details & Meta */}
                                    <div className="us-order-content">
                                        <span className="us-order-id-label">ORDER #{orderId}</span>
                                        <h3 className="us-product-name">
                                            {order.items[0]?.productName || order.items[0]?.product?.name || "Product Name"}
                                            {order.items?.length > 1 && (
                                                <span className="us-more-items-tag"> +{order.items.length - 1} more</span>
                                            )}
                                        </h3>
<p className="us-purchase-date">
        {orderStatus === "Delivered" && `Purchased on ${orderDate}`}

        {orderStatus === "Cancelled" && order.cancellation?.at && 
            `Cancelled at ${new Date(order.cancellation.at).toLocaleDateString()}`}

        {orderStatus === "RETURNED" && order.returnInfo?.returnedAt && 
            `Returned at ${new Date(order.returnInfo.returnedAt).toLocaleDateString()}`}

        {orderStatus === "RETURN_REQUESTED" && order.returnInfo?.requestedAt && 
            `Return requested at ${new Date(order.returnInfo.requestedAt).toLocaleDateString()}`}

        {orderStatus === "RETURN_APPROVED" && order.approvedAt && 
            `Return approved at ${new Date(order.approvedAt).toLocaleDateString()}`}

        {orderStatus === "RETURN_REJECTED" && 
            `Return rejected by admin: ${order.returnInfo?.rejectionReason || "Reason not provided"}`}

        {(orderStatus === "PLACED" || orderStatus === "SHIPPED" || orderStatus === "OUT_OF_DELIVERY") && (() => {
            const createdDate = new Date(order.createdAt);
            createdDate.setDate(createdDate.getDate() + 5);
            return `Estimated delivery expected on ${createdDate.toLocaleDateString()}`;
        })()}
    </p>                                        <span className="us-product-price">₹{totalAmount}</span>
                                    </div>

                                    {/* Right: Status Badge & View Details Button */}
                                    <div className="us-order-right-section">
                                        <div className={`us-order-status-badge ${orderStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {orderStatus}
                                        </div>
                                        <button 
                                            className="us-btn-view-details" 
                                            onClick={() => navigate(`/user/trackOrder`,{state:{orderId:order._id}})}
                                        >
                                            VIEW DETAILS
                                        </button>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
            <UserFooter />
        </div>
    );
};

export default Orders;