import React, { useState, useEffect } from 'react';
import './Cart.css';
import Navbar from "../../../partials/navbar/navbar";
import UserFooter from '../../../partials/UserFooter/UserFooter';
import { useNavigate } from 'react-router-dom';
import { increment, decrement, removeFromCart, getCart } from '../../../redux/slices/cartSlice';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../../../partials/Loader/Loader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { optimizeCloudinaryUrl } from '../../../utils/imageOptimizer';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const token=localStorage.getItem("token")

  if(!token){
    navigate("/user/login",{replace:true})
  }

  const cartState = useSelector((state) => state.cart);
  const cart = cartState?.cart;
  const loading = cartState?.loading;
  const cartItems = Array.isArray(cart?.items) ? cart.items : [];  

  const [itemToDelete, setItemToDelete] = useState(null);
  const [updatingItemIds, setUpdatingItemIds] = useState({});

  useEffect(() => {
    dispatch(getCart());
  }, [dispatch]);

  const handleIncrease = async(item) => {
    if (updatingItemIds[item._id]) return;
    if (item.quantity >= 5) {
      toast.error("Maximum quantity limit is 5");
      return;
    }

    setUpdatingItemIds(prev => ({ ...prev, [item._id]: true }));
    try{
      await dispatch(increment({ _id: item._id })).unwrap();
    }
    catch(error){
      console.log(error);
      const msg = error?.message || error?.data?.message || (typeof error === 'string' ? error : "Something went wrong");
      toast.error(msg);
    } finally {
      setUpdatingItemIds(prev => ({ ...prev, [item._id]: false }));
    }
  };

  const handleDecrease = async (item) => {
    if (updatingItemIds[item._id]) return;
    if (item.quantity <= 1) return;

    setUpdatingItemIds(prev => ({ ...prev, [item._id]: true }));
    try {
      await dispatch(decrement({ _id: item._id })).unwrap();
    } catch(error) {
      console.log(error);
      const msg = error?.message || error?.data?.message || (typeof error === 'string' ? error : "Something went wrong");
      toast.error(msg);
    } finally {
      setUpdatingItemIds(prev => ({ ...prev, [item._id]: false }));
    }
  };

  const handleOpenRemoveModal = (item) => {
    setItemToDelete(item);
  };

  const handleConfirmRemove = () => {
    if (itemToDelete) {
      dispatch(removeFromCart({ _id: itemToDelete._id }));
    }
    setItemToDelete(null);
  };

  const handleCancelRemove = () => {
    setItemToDelete(null);
  };

  // Subtotal Calculation
  const subtotal = cartItems.reduce((acc, item) => {
    const product = item.product || {};
    const price = Number(product.price || item.price || 0);
    const offer = Number(product.offer || item.offer || 0);
    
    const finalPrice = offer > 0 ? Math.round(price - (price * offer) / 100) : price;
    
    return acc + (finalPrice * Number(item.quantity || 1));
  }, 0);

  const taxPercentage = 18;
  const taxAmount = Number(((subtotal * taxPercentage) / 100).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  const handleItemClick = (item) => {
    const prod = item.product && typeof item.product === 'object' ? item.product : { _id: item.product || item._id };
    navigate('/user/productDetails', {
      state: {
        product: {
          ...prod,
          _id: prod._id || item.product,
          name: prod.name || item.name,
          price: prod.price || item.price,
          offer: prod.offer || item.offer,
          img: item.img || prod.img,
          colour: item.colour,
          size: item.size
        }
      }
    });
  };

  const buy = () => {
    const orderData = cartItems.map((item) => {
      const prod = item.product && typeof item.product === 'object' ? item.product : {};
      const price = Number(prod.price || item.price || 0);
      const offer = Number(prod.offer !== undefined ? prod.offer : (item.offer || 0));

      return {
        product: prod._id || item.product,
        _id: prod._id || item.product,
        name: prod.name || item.name || "",
        productName: prod.name || item.name || "",
        brand: prod.brand?.name || (typeof prod.brand === 'string' ? prod.brand : item.brand) || "",
        image: item.img || item.image || prod.img,
        img: item.img || item.image || prod.img,
        quantity: item.quantity,
        size: item.size,
        colour: item.colour,
        price: price,
        offer: offer
      };
    });

    orderData.type = "cart";
    navigate("/user/checkout", {
      state: {
        data: orderData
      }
    });
  };

  return (
    <div className="cart-page-wrapper">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />

      {loading === true && <Loader />}

      <main className="cart-main">
        <nav className="cart-breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/user/home', { replace: true }); }}>HOME</a>
          <span>/</span>
          <span className="active-crumb">CART</span>
        </nav>

        <div className="cart-content-layout">
          <section className="cart-items-column">
            <div className="cart-header-row">
              <h1 className="cart-title">Shopping Bag</h1>
              <span className="cart-item-count">{cartItems.length} Items</span>
            </div>

            <div className="cart-items-list">
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <p>Your shopping bag is empty.</p>
                  <button className="cart-shop-btn" onClick={() => navigate('/user/home')}>
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <div className="cart-item-card" key={`${item._id}-${item.size}-${item.colour}-${index}`}>
                    <div 
                      className="cart-item-image-box"
                      onClick={() => handleItemClick(item)}
                      style={{ cursor: "pointer" }}
                      title="View Product Details"
                    >
                      <img 
                        src={optimizeCloudinaryUrl(item.img || item.product?.img, 200)} 
                        alt={item.product?.name || item.name} 
                        loading="lazy" 
                        decoding="async" 
                      />
                    </div>

                    <div className="cart-item-details">
                      <div className="cart-item-top">
                        <div 
                          onClick={() => handleItemClick(item)}
                          style={{ cursor: "pointer" }}
                          title="View Product Details"
                        >
                          <h3 className="cart-item-name" style={{ cursor: "pointer" }}>{item.product?.name || item.name} • {item.colour}</h3>
                          <p className="cart-item-category">{item.product?.category?.name}</p>
                          <div className="cart-item-size-badge">SIZE: {item.size}</div>
                        </div>
                        
                        <span className="cart-item-price"> ₹{item.product?.offer && item.product?.offer > 0 
    ? Math.round(item.product?.price - (item.product?.price * item.product?.offer) / 100) 
    : item.product?.price}</span>
                      </div>

                      <div className="cart-item-bottom">
                        <div className="cart-quantity-box">
                          <button 
                            onClick={() => handleDecrease(item)} 
                            disabled={item.quantity <= 1 || !!updatingItemIds[item._id]}
                            style={{ 
                              opacity: (item.quantity <= 1 || updatingItemIds[item._id]) ? 0.5 : 1, 
                              cursor: (item.quantity <= 1 || updatingItemIds[item._id]) ? 'not-allowed' : 'pointer' 
                            }}
                          >
                            <span className="material-symbols-outlined">remove</span>
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            onClick={() => handleIncrease(item)} 
                            disabled={item.quantity >= 5 || !!updatingItemIds[item._id]}
                            style={{ 
                              opacity: (item.quantity >= 5 || updatingItemIds[item._id]) ? 0.5 : 1, 
                              cursor: (item.quantity >= 5 || updatingItemIds[item._id]) ? 'not-allowed' : 'pointer' 
                            }}
                          >
                            <span className="material-symbols-outlined">add</span>
                          </button>
                        </div>

                        <div className="cart-remove-group">
                          <button 
                            className="cart-action-link remove" 
                            onClick={() => handleOpenRemoveModal(item)}
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Right Column: Order Summary */}
          <section className="cart-summary-column">
            <div className="cart-summary-card">
              <h2 className="cart-summary-title">Order Summary</h2>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span className="val">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="cart-summary-row">
                <span>Tax Percentage</span>
                <span className="val">{taxPercentage}%</span>
              </div>

              <div className="cart-summary-row">
                <span>Tax Amount</span>
                <span className="val">+₹{taxAmount.toFixed(2)}</span>
              </div>

              <div className="cart-summary-row">
                <span>Estimated Shipping</span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Calculated at checkout</span>
              </div>

              <div className="cart-summary-total-row">
                <span className="label">Total</span>
                <span className="val">₹{totalAmount.toFixed(2)}</span>
              </div>

              <button className="cart-checkout-btn" onClick={buy} disabled={cartItems.length === 0}>
                PROCEED TO CHECKOUT
              </button>

              <div className="cart-secure-badge">
                <span className="material-symbols-outlined">lock</span>
                <span>SECURE CHECKOUT</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ================= CUSTOM REMOVE CONFIRMATION MODAL ================= */}
      {itemToDelete && (
        <div className="aep-modal-overlay" onClick={handleCancelRemove}>
          <div className="aep-modal" style={{ maxWidth: '400px', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div className="aep-modal-header">
              <h3 className="aep-modal-title">REMOVE ITEM</h3>
              <button type="button" className="aep-icon-btn" onClick={handleCancelRemove}>✕</button>
            </div>
            
            <div className="aep-modal-body" style={{ margin: '15px 0' }}>
              <p style={{ fontSize: '14px', color: '#4b5563' }}>
                Are you sure you want to remove <strong style={{ color: '#111827' }}>{itemToDelete.product?.name || itemToDelete.name}</strong> from your shopping bag?
              </p>
            </div>

            <div className="aep-modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="aep-btn-secondary" 
                onClick={handleCancelRemove}
                style={{ padding: '8px 16px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="aep-save-btn" 
                onClick={handleConfirmRemove}
                style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <UserFooter />
    </div>
  );
};

export default Cart;