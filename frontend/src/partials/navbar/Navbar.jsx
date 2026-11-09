import React, { useState,useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import "./Navbar.css";
import { logoutUser } from "../../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { getCart } from "../../redux/slices/cartSlice";
import { fetchWishlist } from "../../redux/slices/wishlistSlice"; 


const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); 

  const [showAccount, setShowAccount] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user = useSelector((state) => state.auth?.user || state.authSlice?.user);

const cartData = useSelector((state) => state.cart?.cart || state.cart?.items || []); 
const cartCount = Array.isArray(cartData) 
  ? cartData.length 
  : (cartData?.items?.length || 0);

  const wishlistState = useSelector((state) => state.wishlist?.wishlist);
  
  const wishlistItems = Array.isArray(wishlistState) 
    ? wishlistState 
    : (wishlistState?.products || wishlistState?.items || wishlistState?.wishlist || []);
    
  const wishlistCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const token = localStorage.getItem("token");

useEffect(() => {
  if (token) {
    dispatch(getCart());
    dispatch(fetchWishlist())
  }
}, [dispatch, token]);


  const handleAccountClick = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/user/login");
      return;
    }

    setShowAccount((prev) => !prev);
  };

  // Trigger Logout Modal
  const handleLogoutClick = () => {
    setShowAccount(false);
    setShowLogoutModal(true);
  };

  // Perform Actual Logout
  const confirmLogout = () => {
    setShowLogoutModal(false);
    dispatch(logoutUser({ role: "user" }));
    navigate("/user/home", { replace: true });
  };

  // Cancel Logout
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // User initials
  const getInitials = () => {
    if (!user?.name) {
      return "U";
    }

    return user.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        <div className="navbar-container">

          {/* ================= LEFT SIDE ================= */}
          <div className="navbar-left">
            {/* Logo */}
            <div
              className="navbar-logo"
              onClick={() => navigate("/user/home")}
            >
              URBAN SOLE
            </div>

            {/* Navigation Links */}
            <ul className="navbar-links">
              <li>
                <button
                  className={`nav-link ${location.pathname.includes("/user/home") ? "active" : ""}`}
                  onClick={() => navigate("/user/home")}
                >
                  HOME
                </button>
              </li>

              <li>
                <button
                  className={`nav-link ${location.pathname.includes("/user/men") ? "active" : ""}`}
                  onClick={() => navigate("/user/men")}
                >
                  MEN'S
                </button>
              </li>

              <li>
                <button 
                  className={`nav-link ${location.pathname.includes("/user/women") ? "active" : ""}`}
                  onClick={() => navigate("/user/women")}
                >
                  WOMEN'S
                </button>
              </li>

              <li>
                <button 
                  className={`nav-link ${location.pathname.includes("/user/explore") ? "active" : ""}`}
                  onClick={() => navigate("/user/explore")}
                >
                  EXPLORE
                </button>
              </li>

              <li>
                <button 
                  className={`nav-link ${location.pathname.includes("/user/about") ? "active" : ""}`}
                  onClick={() => navigate("/user/about")}
                >
                  ABOUT US
                </button>
              </li>
            </ul>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="navbar-actions">

           {/* WISHLIST */}
<button 
  className="navbar-icon-btn wishlist-button"
  onClick={() => navigate("/user/wishlist")}
>
  <span className="material-symbols-outlined">
    favorite
  </span>
  
  {/* Wishlist Count Badge */}
  {wishlistCount > 0 && (
    <span className="cart-count wishlist-count">
      {wishlistCount}
    </span>
  )}
</button>

            {/* CART */}
            <button
              className="navbar-icon-btn cart-button"
              onClick={() => navigate("/user/cart")}
            >
              <span className="material-symbols-outlined">
                shopping_bag
              </span>
            {cartCount > 0 && (
  <span className="cart-count">
    {cartCount}
  </span>
)}
            </button>

            {/* ACCOUNT */}
            <div className="account-wrapper">
              <button
                className="navbar-icon-btn"
                onClick={handleAccountClick}
              >
                <span className="material-symbols-outlined">
                  person
                </span>
              </button>

              {/* ACCOUNT DROPDOWN */}
              {showAccount && token && (
                <div className="account-dropdown">
                  <div className="account-header">
                    <div className="account-avatar">
                      {getInitials()}
                    </div>
                    <div className="account-user-info">
                      <h3>
                        {user?.name || "User"}
                      </h3>
                      <p>
                        {user?.email || ""}
                      </p>
                    </div>
                  </div>

                  <div className="account-menu">
                    <button
                      className="account-menu-item"
                      onClick={() => {
                        setShowAccount(false);
                        navigate("/user/profile");
                      }}
                    >
                      <span className="material-symbols-outlined">person</span>
                      <span className="account-menu-title">MY PROFILE</span>
                      <span className="material-symbols-outlined arrow">chevron_right</span>
                    </button>

                    <button
                      className="account-menu-item"
                      onClick={() => {
                        setShowAccount(false);
                        navigate("/user/orders");
                      }}
                    >
                      <span className="material-symbols-outlined">shopping_bag</span>
                      <span className="account-menu-title">MY ORDERS</span>
                      <span className="material-symbols-outlined arrow">chevron_right</span>
                    </button>

                    <button
                      className="account-menu-item"
                      onClick={() => setShowAccount(false)}
                    >
                      <span className="material-symbols-outlined">reviews</span>
                      <span className="account-menu-title">MY REVIEWS</span>
                      <span className="material-symbols-outlined arrow">chevron_right</span>
                    </button>

                    <button
                      className="account-menu-item"
                      onClick={() => {
                        setShowAccount(false);
                        navigate("/user/address");
                      }}
                    >
                      <span className="material-symbols-outlined">location_on</span>
                      <span className="account-menu-title">ADDRESSES</span>
                      <span className="material-symbols-outlined arrow">chevron_right</span>
                    </button>

                    <button
                      className="account-menu-item"
                      onClick={() => {
                        setShowAccount(false);
                        navigate("/wallet");
                      }}
                    >
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                      <span className="account-menu-title">WALLET</span>
                      <span className="material-symbols-outlined arrow">chevron_right</span>
                    </button>

                    <button
                      className="account-menu-item"
                      onClick={() => setShowAccount(false)}
                    >
                      <span className="material-symbols-outlined">redeem</span>
                      <span className="account-menu-title">REFER & EARN</span>
                      <span className="material-symbols-outlined arrow">chevron_right</span>
                    </button>
                  </div>

                  <div className="account-logout-section">
                    <button
                      className="account-logout"
                      onClick={handleLogoutClick}
                    >
                      <span className="material-symbols-outlined">logout</span>
                      <span>LOGOUT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* CONFIRM LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={cancelLogout}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Logout</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to log out of your account?</p>
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="modal-btn confirm-btn" onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;