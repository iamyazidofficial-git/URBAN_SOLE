import React, { useState } from "react";
import "./AdminSidebar.css";
import { useNavigate, useLocation } from "react-router-dom"
import { logoutUser } from "../../redux/slices/authSlice"
import {
  LayoutGrid,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Ticket,
  Shapes,
  UserPlus,
  Bookmark,
  LogOut,
} from "lucide-react";
import { useDispatch } from "react-redux";

const AdminSidebar = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const dispatch=useDispatch()
  const location = useLocation()

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutGrid size={20} /> },
    { name: "Orders", path: "/admin/orderManagement", icon: <ShoppingCart size={20} /> },
    { name: "Products", path: "/admin/productManagement", icon: <Package size={20} /> },
    { name: "Customers", path: "/admin/customerManagement", icon: <Users size={20} /> },
    { name: "Sales Report", path: "/admin/sales-report", icon: <BarChart3 size={20} /> },
    { name: "Coupon", path: "/admin/couponManagement", icon: <Ticket size={20} /> },
    { name: "Category", path: "/admin/categoryManagement", icon: <Shapes size={20} /> },
    { name: "Referrals", path: "/admin/referrals", icon: <UserPlus size={20} /> },
    { name: "Brand", path: "/admin/brandManagement", icon: <Bookmark size={20} /> },
  ];

  const handleLogoutConfirm = () => {
    
    setShowLogoutModal(false)
    dispatch(logoutUser({role:"admin"}))
    navigate("/admin/login", { replace: true });
  };

  return (
    <>
      <aside className="sidebar-container">
        {/* Profile Section */}
        <div className="sidebar-profile">
          <div className="profile-avatar">AH</div>
          <div className="profile-info">
            <h3 className="profile-name">Alex Hartman</h3>
            <p className="profile-email">admin@urbansole.com</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => {
  const isActive = location.pathname === item.path; // <-- Check active route

  return (
    <li key={item.name}>
      <button
        type="button"
        className={`nav-item ${isActive ? "active" : ""}`}
        onClick={() => navigate(item.path)} // <-- Navigate to route on click
      >
        <span className="nav-icon">{item.icon}</span>
        <span className="nav-label">{item.name}</span>
      </button>
    </li>
  );
})}
          </ul>
        </nav>

        {/* Logout Section */}
        <div className="sidebar-footer">
          <hr className="footer-divider" />

          <button
            type="button"
            className="logout-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Confirm Logout</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to log out of your admin account?</p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn confirm-btn"
                onClick={handleLogoutConfirm}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;