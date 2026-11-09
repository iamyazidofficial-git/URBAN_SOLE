import React, { useState, useMemo, useEffect } from "react";
import "./OrderManagement.css";
import AdminSidebar from "../../../partials/AdminSidebar/AdminSidebar";
import axiosInstance from "../../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function OrderManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState("");
  const [totalOrders, setTotalOrders] = useState("");
  const itemsPerPage = 8;
  const navigate=useNavigate()

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [orders, searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get(`/admin/order/getOrder/?page=${currentPage}&limit=8&search=${searchTerm}`);
      if (response?.data?.success == true) {
      const result = response.data.data
        console.log(result)
        setOrders(result.orders); 

        setCurrentPage(result.currentPage)
        setTotalPages(result.totalPages)
        setTotalOrders(result.totalOrders)
      }
    } catch (error) {
      console.log(error?.response?.data?.message || "Something went wrong");
    }
  };

  const changePage=(type)=>{
    if(type=="previous" && currentPage>1){
        setCurrentPage(t=>t-1)
    }
    else if(type=="next" && currentPage<totalPages){
        setCurrentPage(t=>t+1)
    }
  }

  useEffect(() => {
    fetchOrders();
    console.log(searchTerm)
  }, [searchTerm,currentPage]);

  return (
    <>
      <AdminSidebar />
      <div className="pm-container">
        {/* Header Controls */}
        <div className="pm-header">
          <div>
            <h1 className="pm-title">Order Management</h1>
            <p className="pm-subtitle">
              Manage customer orders and track fulfillment statuses
            </p>
          </div>
          <div className="pm-search-box">
            <svg
              className="pm-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="pm-search-input"
              placeholder="Search by Order ID or Customer Name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Main Table Card */}
        <div className="pm-table-card">
          <table className="pm-table">
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>CUSTOMER NAME</th>
                <th>ORDER DATE</th>
                <th>AMOUNT</th>
                <th>PAYMENT METHOD</th>
                <th>DELIVERY STATUS</th>
                <th className="pm-text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td className="pm-cell-id-bold">{order.orderId}</td>
                    <td className="pm-prod-name">{order.user?.name}</td>
                    <td className="pm-cell-date">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )
                        : ""}
                    </td>
                    <td className="pm-cell-price">
                      ₹{order.pricing.totalAmount.toLocaleString()}
                    </td>
                    <td className="pm-cell-payment">
                      {order.payment?.method === "CASHONDELIVERY"
                        ? "COD"
                        : order.payment?.method === "RAZORPAY"
                          ? "RAZOR PAY"
                          : order.payment?.method || "N/A"}
                    </td>{" "}
                    <td>
<span className={`od-status-badge ${order?.orderStatus?.toLowerCase()}`}>
  {order?.orderStatus?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
</span>
</td>
                    <td className="pm-cell-actions">
                      <button
                        className="pm-action-link"
                        onClick={() => navigate(`/admin/orderManagement/orderDetails`,{state:{orderId:order._id}})}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="pm-empty-row">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Footer & Pagination */}
          <div className="pm-footer">
            <span className="pm-footer-count">show {currentPage} of {totalPages} ({totalOrders} total entries)</span>

            <div className="pm-pagination">
              <button
                className="pm-page-nav"
                disabled={currentPage === 1}
                onClick={() => changePage("previous")}
              >
                ← Previous
              </button>
             
                  <button
                    key={currentPage}
                    className={`pm-page-num ${currentPage === currentPage ? "active" : ""}`}
                    onClick={() => setCurrentPage(currentPage)}
                  >
                    {currentPage}
                  </button>
               
              <button
                className="pm-page-nav"
                disabled={currentPage === totalPages}
                onClick={() => changePage("next")}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
