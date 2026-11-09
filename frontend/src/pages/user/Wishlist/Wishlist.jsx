import React, { useEffect, useState } from "react";
import "./Wishlist.css";
import Navbar from "../../../partials/navbar/navbar";
import UserFooter from "../../../partials/UserFooter/UserFooter";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlist, removeFromWishlist } from "../../../redux/slices/wishlistSlice";
import { addToCart } from "../../../redux/slices/cartSlice"; 
import { useNavigate } from "react-router-dom";
export default function Wishlist() {
  const navigate=useNavigate()
 
  const dispatch = useDispatch();
  const wishlistState = useSelector((state) => state.wishlist);
  const wishlistItems = wishlistState?.wishlist?.products || [];

  

  // Cart & Size Selection Modal State
  const [selectedProductForCart, setSelectedProductForCart] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
     const token=localStorage.getItem("token")
  console.log("Tok",token)
  if(!token){
    return navigate("/user/login",{replace:true})
  }
    dispatch(fetchWishlist());
  }, [dispatch]);

  useEffect(() => {
    console.log("FULL WISHLIST DATA FROM REDUX:", wishlistState);
    console.log("WISHLIST ITEMS ARRAY:", wishlistItems);
    if (wishlistItems.length > 0) {
      console.log("FIRST PRODUCT OBJECT:", wishlistItems[0]);
    }
  }, [wishlistState, wishlistItems]);
  const handleRemove = (productId) => {
    dispatch(removeFromWishlist(productId));
  };

  // Helper to get variants array safely
  const getProductVariants = (product) => {
    return product?.vartiant || product?.variants || product?.variant || [];
  };

  // 1. Open Modal and set initial default variant
  const handleOpenCartModal = (product) => {
    const variants = getProductVariants(product);
    setSelectedProductForCart(product);
    setSelectedVariant(variants.length > 0 ? variants[0] : null);
    setSelectedSize(null);
  };

  // 2. Confirm Add to Cart & Remove from Wishlist
  const handleConfirmAddToCart = async () => {
    if (!selectedSize || !selectedVariant || !selectedProductForCart) return;

    let currentStock = 10; 
    if (selectedVariant && selectedVariant.inventory) {
      const invItem = selectedVariant.inventory.find(i => Number(i.size) === Number(selectedSize));
      if (invItem) {
        currentStock = invItem.quantity;
      }
    }

    try {
      // Send standard cart payload
      await dispatch(addToCart({
        productId: selectedProductForCart._id,
        _id: selectedProductForCart._id,
        name: selectedProductForCart.name,
        brand: selectedProductForCart.brand,
        price: selectedProductForCart.price,
        size: selectedSize,
        colour: selectedVariant.colour,
        img: selectedVariant?.images?.[0] || selectedProductForCart.image || selectedProductForCart.images?.[0],
        quantity: 1,
        stock: currentStock 
      })).unwrap();
      
      // Remove from wishlist after successfully adding to cart
      dispatch(removeFromWishlist(selectedProductForCart._id));
    } catch (error) {
      console.log("Failed to move item to cart:", error);
    } finally {
      setSelectedProductForCart(null);
      setSelectedVariant(null);
      setSelectedSize(null);
    }
  };

  const handleCancelCartModal = () => {
    setSelectedProductForCart(null);
    setSelectedVariant(null);
    setSelectedSize(null);
  };

  return (
    <>
      <Navbar/>
      <div className="wishlist-page-wrapper">
        <main className="wishlist-main-content">
          <header className="wishlist-header-section">
            <h1>WISHLIST</h1>
            <p>
              Curate your personal collection of Urban Sole's most essential footwear. From 
              architectural silhouettes to minimalist icons, keep track of the styles that define 
              your aesthetic and move them to your cart when you're ready to make them yours.
            </p>
          </header>

          <div className="wishlist-products-grid">
            {wishlistItems.length > 0 ? (
              wishlistItems.map((item) => {
                const variants = getProductVariants(item);
                // Safe image fallback check
                const productImage = variants?.[0]?.images?.[0] || item.image || item.images?.[0] || "/placeholder.jpg";

                return (
                  <article key={item._id} className="wishlist-product-card">
                    <div className="product-card-img-box">
                      <button 
                        className="product-remove-btn" 
                        onClick={() => handleRemove(item._id)}
                        aria-label="Remove item"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                      <img src={productImage} alt={item.name || "Product"} />
                    </div>
                    
                    <div className="product-card-details">
                      <div className="product-title-price">
                        <h3>{item.brand?.name ? `${item.brand.name} ${item.name}` : item.name}</h3>
                        <span>₹{item.offer && item.offer > 0 
    ? Math.round(item.price - (item.price *item.offer) / 100) 
    : item.price}</span>
                      </div>
                      <p className="product-category-text">
                        {typeof item.category === 'object' ? item.category?.name : (item.category || "Footwear")}
                      </p>

                      <div className="product-card-footer">
                        <div className="product-stock-status">
                          <span className="stock-indicator-dot in-stock"></span>
                          <span>In Stock</span>
                        </div>
                        <button 
                          className="move-to-cart-action-btn"
                          onClick={() => handleOpenCartModal(item)}
                        >
                          MOVE TO CART
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-wishlist-notice">
                <p>Your wishlist is currently empty.</p>
              </div>
            )}
          </div>
        </main>

        {/* ================= COLOR & SIZE SELECTION MODAL ================= */}
        {selectedProductForCart && (
          <div className="aep-modal-overlay" onClick={handleCancelCartModal}>
            <div className="aep-modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
              <div className="aep-modal-header">
                <h3 className="aep-modal-title">SELECT COLOR & SIZE</h3>
                <button type="button" className="aep-icon-btn" onClick={handleCancelCartModal}>✕</button>
              </div>
              
              <div className="aep-modal-body">
                <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
                  {selectedProductForCart.brand?.name} {selectedProductForCart.name}
                </p>

                {/* 1. COLOR / VARIANT SELECTION */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                    SELECT COLOR:
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {getProductVariants(selectedProductForCart).map((variant, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setSelectedSize(null); 
                        }}
                        style={{
                          width: '35px',
                          height: '35px',
                          borderRadius: '50%',
                          backgroundColor: variant.colour || '#000',
                          border: selectedVariant?.colour === variant.colour ? '3px solid #000' : '1px solid #d1d5db',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        title={variant.colour}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. SIZE SELECTION */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                    SELECT SIZE (US):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {[6, 7, 8, 9, 10, 11, 12].map((size) => {
                      let isAvailable = false;
                      let stockQty = 0;

                      if (selectedVariant && selectedVariant.inventory && Array.isArray(selectedVariant.inventory)) {
                        const invItem = selectedVariant.inventory.find(i => Number(i.size) === Number(size));
                        if (invItem && invItem.quantity > 0) {
                          isAvailable = true;
                          stockQty = invItem.quantity;
                        }
                      }

                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={!isAvailable}
                          style={{
                            padding: '12px 0',
                            border: selectedSize === size ? '2px solid #000' : '1px solid #e5e7eb',
                            backgroundColor: !isAvailable ? '#f3f4f6' : (selectedSize === size ? '#000' : '#fff'),
                            color: !isAvailable ? '#9ca3af' : (selectedSize === size ? '#fff' : '#111827'),
                            fontWeight: '600',
                            borderRadius: '6px',
                            cursor: !isAvailable ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: !isAvailable ? 0.5 : 1
                          }}
                          onClick={() => isAvailable && setSelectedSize(size)}
                          title={!isAvailable ? 'Out of stock' : `${stockQty} in stock`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div className="aep-modal-footer">
                <button type="button" className="aep-btn-secondary" onClick={handleCancelCartModal}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="aep-save-btn" 
                  onClick={handleConfirmAddToCart}
                  style={{ opacity: (!selectedVariant || !selectedSize) ? 0.6 : 1 }}
                  disabled={!selectedVariant || !selectedSize}
                >
                  Confirm & Move to Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <UserFooter />
    </>
  );
}