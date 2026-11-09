import React, { useState, useEffect } from 'react'
import './ProductDetails.css'
import Navbar from '../../../partials/navbar/navbar'
import UserFooter from '../../../partials/UserFooter/UserFooter'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../../../redux/slices/cartSlice'
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../../../redux/slices/wishlistSlice'
import axiosInstance from '../../../utils/axiosInstance'

// Image zoom external library import
import ControlledZoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { toast } from 'react-toastify'

const ProductDetails = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const product = location.state?.product || {}
  const { _id, name, price, description, brand, category, countryOfOrgin,offer, vartiant = [] } = product
  const cartItems = useSelector((state) => state.cart?.items || []);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [accordionOpen, setAccordionOpen] = useState({ 1: false, 2: false })
  const [isZoomed, setIsZoomed] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])

  const [toastMessage, setToastMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const currentVariant = vartiant[selectedVariantIndex] || {};
  const images = currentVariant.images || [];
  const inventoryList = currentVariant.inventory || [];

  const wishlistState = useSelector((state) => state.wishlist);
  const wishlistItems = wishlistState?.wishlist?.products || [];

 useEffect(() => {
    const token = localStorage.getItem("token")

    if (token) {
        dispatch(fetchWishlist())
    }
}, [dispatch])

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const brandName = typeof brand === 'object' ? brand?.name : brand;
        if (!brandName) return;

        const res = await axiosInstance.get(`/user/product/getProducts?brand=${encodeURIComponent(brandName)}&limit=5`);
        if (res.data?.success) {
          const filtered = (res.data.data || []).filter(p => p._id !== _id).slice(0, 4);
          setRelatedProducts(filtered);
        }
      } catch (err) {
        console.error("Error fetching related products:", err);
      }
    };
    if (_id) fetchRelated();
  }, [_id, brand])
  

  const isProductInWishlist = wishlistItems.some(
    item => (typeof item === 'string' ? item : item?._id) === _id
  );

  useEffect(() => {
    setActiveImg(0);
    const firstAvailable = inventoryList.find(inv => inv.quantity > 0);
    setSelectedSize(firstAvailable ? firstAvailable.size : null);
    setQuantity(1);
    setIsZoomed(false);
  }, [selectedVariantIndex]);

  const getStockForSize = (size) => {
    const item = inventoryList.find(inv => Number(inv.size) === Number(size));
    return item ? Number(item.quantity) : 0;
  };

  const toggleAccordion = (index) => {
    setAccordionOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // ADD TO CART EXECUTION
 const executeAddToCart = async () => {
    if (selectedSize === null || !currentVariant) return;

    const currentStock = getStockForSize(selectedSize);

    // 1. Calculate how many of this product (matching size & color) are already in the cart
    const existingCartItem = cartItems.find(item => {
      const prodId = typeof item.product === 'object' ? item.product?._id : (item.product || item._id);
      return prodId === _id &&
             Number(item.size) === Number(selectedSize) &&
             item.colour === currentVariant.colour;
    });

    const quantityAlreadyInCart = existingCartItem ? existingCartItem.quantity : 0;

    // 2. Validations
    if (quantityAlreadyInCart >= 5) {
      showToast("Already have 5 quantity its maximum");
      setShowConfirmModal(null);
      return;
    }

    if (quantityAlreadyInCart >= currentStock) {
      showToast(`Already have ${quantityAlreadyInCart} its maximum stock`);
      setShowConfirmModal(null);
      return;
    }

    if (quantityAlreadyInCart + quantity > 5) {
      showToast(`Already have ${quantityAlreadyInCart} quantity, maximum allowed total is 5`);
      setShowConfirmModal(null);
      return;
    }

    if (quantityAlreadyInCart + quantity > currentStock) {
      showToast(`Already have ${quantityAlreadyInCart} products maximum stock is ${currentStock}`);
      setShowConfirmModal(null);
      return;
    }

    try {
      const resultAction = await dispatch(addToCart({
        product: _id,
        _id: _id,
        name: name,
        brand: brand?._id || brand,
        price: price,
        size: selectedSize,
        colour: currentVariant.colour,
        img: images[activeImg] || images[0],
        quantity: quantity, 
        stock: currentStock
      }));

      if (addToCart.rejected.match(resultAction)) {
        const errorMessage = resultAction.payload?.message || resultAction.payload || "Failed to add product to cart.";
        showToast(errorMessage);
        setShowConfirmModal(null);
        return;
      }

      dispatch(removeFromWishlist(_id));
      showToast("Added to cart successfully!");
      setShowConfirmModal(null);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      showToast(error?.message || "Failed to add to cart");
      setShowConfirmModal(null);
    }
  };

  const handleWishlistToggle = async () => {
    if (isProductInWishlist) {
      dispatch(removeFromWishlist(_id));
      showToast("Removed from wishlist");
    } else {
      try{
       await dispatch(addToWishlist(_id)).unwrap()
      showToast("Added to wishlist");
      }
      catch(error){
        console.log("ER",error)
        showToast(error?.message);
      }
    }
  };


  const buy=()=>{

     const currentStock = getStockForSize(selectedSize);
    if (quantity > currentStock) {
      showToast(`Cannot add more. Available stock is ${currentStock}`);
      return;
    }

      navigate("/user/checkout",{state:{
        data:[{ product: _id,
        _id: _id,
        name: name,
        brand: brand?.name,
        price: price,
        size: selectedSize,
        colour: currentVariant.colour,
        img: images[activeImg] || images[0],
        quantity: quantity,
        offer:offer,
        stock: currentStock}]     
      }})

  }

  return (
    <div className="us-page-wrapper">
      <Navbar />

       <nav class="us-breadcrumb" aria-label="Breadcrumb">
  <ol class="us-breadcrumb-list">
    <li><a href="/user/home">HOME</a></li>
    <li class="us-separator">/</li>
    <li><span aria-current="page">PRODUCT DETAILS</span></li>
  </ol>
</nav>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="custom-toast-notification">
          {toastMessage}
        </div>
      )}

      <main className="us-main-content">
        <div className="us-product-layout">
          
          {/* Left Column: Database Images with Zoom */}
          <div className="us-product-gallery">
            <div className="us-main-image-box">
              {images.length > 0 ? (
                <ControlledZoom isZoomed={isZoomed} onZoomChange={setIsZoomed}>
                  <img 
                    src={images[activeImg] || images[0]} 
                    alt={name} 
                    className="us-main-img" 
                    style={{ cursor: 'zoom-in', width: '100%', height: 'auto', objectFit: 'cover' }}
                  />
                </ControlledZoom>
              ) : (
                <div style={{ padding: '40px', color: '#5d5f5f', fontSize: '14px' }}>No images available</div>
              )}
              
              <button 
                className={`us-fav-btn ${isProductInWishlist ? 'active' : ''}`} 
                aria-label="favorite"
                onClick={handleWishlistToggle}
                style={{ color: isProductInWishlist ? '#000' : '#6b7280' }}
              >
                <span 
                  className="material-symbols-outlined" 
                  style={{ fontVariationSettings: isProductInWishlist ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
              </button>
            </div>

            {/* Thumbnails */}
            {images.length > 0 && (
              <div className="us-thumbnails-grid">
                {images.map((img, idx) => (
                  <button 
                    key={idx} 
                    className={`us-thumb-btn ${activeImg === idx ? 'active' : ''}`}
                    onClick={() => {
                      setActiveImg(idx);
                      setIsZoomed(false);
                    }}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Actions */}
          <div className="us-product-details-panel">
            <div className="us-product-header">
              <span className="us-brand-tag">{brand?.name}</span>
              <h1 className="us-prod-title">{name}</h1>
              <div className="us-rating-row">
                <div className="us-rating-badge">★ 4.8</div>
                <span className="us-rating-text">124 Ratings & 38 Reviews</span>
              </div>
              <div className="us-price-row">
                <span className="us-current-price"> ₹{offer && offer > 0 
    ? Math.round(price - (price *offer) / 100) 
    : price}</span>
                <span className="us-original-price">₹{price ? price + 2000 : 11999}</span>
                <span className="us-discount-badge">SPECIAL OFFER</span>
              </div>
              <span className="us-tax-text">Inclusive of all taxes</span>
            </div>

            {/* Product Highlights */}
            <div className="us-highlights-box">
              <ul>
                <li><span className="material-symbols-outlined">check_circle</span> Premium everyday sneakers with classic silhouette</li>
                <li><span className="material-symbols-outlined">check_circle</span> Cushioned footbed for all-day comfort</li>
                <li><span className="material-symbols-outlined">check_circle</span> Durable leather upper with perforations for breathability</li>
                <li><span className="material-symbols-outlined">check_circle</span> Non-marking rubber outsole for excellent traction</li>
              </ul>
            </div>

            {/* Dynamic Colors */}
            <div className="us-selection-group">
              <span className="us-label">
                COLOR: <span className="us-sub-label">{currentVariant.colour?.toUpperCase() || ''}</span>
              </span>
              <div className="us-color-options">
                {vartiant.map((v, index) => (
                  <button 
                    key={v._id || index}
                    className={`us-color-btn ${selectedVariantIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedVariantIndex(index)}
                    title={v.colour}
                  >
                    <span style={{ backgroundColor: v.colourHex || '#000000' }}></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Sizes & Stock */}
            <div className="us-selection-group">
              <div className="us-size-header">
                <span className="us-label">SIZE (UK)</span>
                <button className="us-size-guide-btn">SIZE GUIDE</button>
              </div>

              <div className="us-size-grid">
                {inventoryList.map((inv) => {
                  const isOutOfStock = inv.quantity <= 0;
                  const isSelected = selectedSize === inv.size;

                  return (
                    <button 
                      key={inv.size} 
                      className={`us-size-btn ${isSelected ? 'active' : ''} ${isOutOfStock ? 'disabled' : ''}`}
                      onClick={() => !isOutOfStock && setSelectedSize(inv.size)}
                      disabled={isOutOfStock}
                    >
                      {inv.size} {isOutOfStock ? '(OUT)' : ''}
                    </button>
                  );
                })}
              </div>

              {selectedSize !== null && (
                <p className="us-fit-note" style={{ marginTop: '6px', color: '#10b981', fontWeight: '600' }}>
                  In Stock: {getStockForSize(selectedSize)} pairs left for UK {selectedSize}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="us-selection-group">
              <span className="us-label">QUANTITY</span>
              <div className="us-qty-selector">
                <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>−</button>
                <span>{quantity}</span>
                <button 
                  onClick={() => {
                    const currentStock = getStockForSize(selectedSize)
                    if(quantity==5){
                      showToast("Maximum quantity is 5")
                    }
                    if(quantity==currentStock){
                      showToast("Maximum Stock is reached")
                    }
                    if (quantity < currentStock && quantity <5) {
                      setQuantity(prev => prev + 1);
                    }
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="us-cta-group">
              <div className="us-main-cta-row">
                <button 
                  className="us-btn-add-cart" 
                  disabled={selectedSize === null || getStockForSize(selectedSize) <= 0}
                  onClick={() => setShowConfirmModal("cart")}
                >
                  ADD TO CART
                </button>
                <button 
                  className="us-btn-buy-now" 
              disabled={selectedSize === null || getStockForSize(selectedSize) <= 0}
                  onClick={() => setShowConfirmModal("buy")}
                >
                  BUY NOW
                </button>
              </div>
              <button className="us-btn-wishlist" onClick={handleWishlistToggle}>
                <span 
                  className="material-symbols-outlined" 
                  style={{ fontVariationSettings: isProductInWishlist ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span> 
                {isProductInWishlist ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST'}
              </button>
            </div>

            {/* Delivery Card */}
            <div className="us-delivery-card">
              <h3>DELIVERY & SERVICES</h3>
              <div className="us-delivery-perks">
                <div className="us-perk-item">
                  <span className="material-symbols-outlined">local_shipping</span>
                  <span>FREE DELIVERY</span>
                </div>
                <div className="us-perk-item">
                  <span className="material-symbols-outlined">assignment_return</span>
                  <span>7-DAY RETURNS</span>
                </div>
                <div className="us-perk-item">
                  <span className="material-symbols-outlined">lock</span>
                  <span>SECURE PAY</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Detailed Information Section */}
        <div className="us-specs-section">
          <div className="us-desc-block">
            <h2>OUR SPECIALITIES</h2>
            <p>{description}</p>
          </div>

          <div className="us-specs-table-block">
            <h2>SPECIFICATIONS</h2>
            <div className="us-specs-grid">
              <div className="us-spec-row"><span>Brand</span><strong>{brand?.name}</strong></div>
              <div className="us-spec-row"><span>Model</span><strong>{name}</strong></div>
              <div className="us-spec-row"><span>Category</span><strong>{typeof category === 'object' ? category?.name : category}</strong></div>
              <div className="us-spec-row"><span>Country of Origin</span><strong>{countryOfOrgin}</strong></div>
            </div>
          </div>

          {/* Accordions */}
          <div className="us-accordions">
            <div className="us-accordion-item">
              <button onClick={() => toggleAccordion(1)}>
                <span>DELIVERY INFORMATION</span>
                <span className={`material-symbols-outlined accordion-icon ${accordionOpen[1] ? 'open' : ''}`}>expand_more</span>
              </button>
              <div className={`accordion-content ${accordionOpen[1] ? 'open' : ''}`}>
                <p>Standard delivery takes 3-5 business days. Express delivery (1-2 days) is available. All orders are tracked.</p>
              </div>
            </div>
            <div className="us-accordion-item">
              <button onClick={() => toggleAccordion(2)}>
                <span>RETURN & EXCHANGE POLICY</span>
                <span className={`material-symbols-outlined accordion-icon ${accordionOpen[2] ? 'open' : ''}`}>expand_more</span>
              </button>
              <div className={`accordion-content ${accordionOpen[2] ? 'open' : ''}`}>
                <p>We accept returns and exchanges within 7 days of delivery. Items must be unworn, in original condition, and with all tags attached.</p>
              </div>
            </div>
          </div>
        </div>

       {/* ================= RELATED PRODUCTS SECTION ================= */}
        {relatedProducts.length > 0 && (
          <section className="us-trending-section">
            <div className="us-trending-header">
              <h2 className="us-trending-title">RELATED PRODUCTS</h2>
              <p className="us-trending-subtitle">Discover more styles matching your preference.</p>
            </div>

            <div className="us-trending-grid">
              {relatedProducts.map((relProduct) => {
                const relImg = relProduct.vartiant?.[0]?.images?.[0] || relProduct.image;
                const isRelInWishlist = wishlistItems.some(
                  item => (typeof item === 'string' ? item : item?._id) === relProduct._id
                );

                return (
                  <div 
                    className="us-trend-card" 
                    key={relProduct._id}
                    onClick={() => {
                      navigate("/user/productDetails", { state: { product: relProduct } });
                      window.scrollTo(0, 0);
                    }}
                  >
                    <div className="us-trend-img-box">
                      <img src={relImg} alt={relProduct.name} />
                      <button 
                        className={`us-trend-fav-btn ${isRelInWishlist ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isRelInWishlist) {
                            dispatch(removeFromWishlist(relProduct._id));
                            showToast("Removed from wishlist");
                          } else {
                            dispatch(addToWishlist(relProduct._id));
                            showToast("Added to wishlist");
                          }
                        }}
                      >
                        <span 
                          className="material-symbols-outlined" 
                          style={{ fontVariationSettings: isRelInWishlist ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          favorite
                        </span>
                      </button>
                    </div>

                    <div className="us-trend-body">
                      <div className="us-trend-title-price">
                        <span className="us-trend-name">
                          {relProduct.brand?.name ? `${relProduct.brand.name} ${relProduct.name}` : relProduct.name}
                        </span>
                        <span className="us-trend-price">₹{relProduct.price}</span>
                      </div>
                      <p className="us-trend-desc">
                        {typeof relProduct.category === 'object' ? relProduct.category?.name : (relProduct.category || "Footwear")}
                      </p>
                      
                      <button 
                        className="us-trend-cart-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/user/productDetails", { state: { product: relProduct } });
                          window.scrollTo(0, 0);
                        }}
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* ================= CART CONFIRMATION MODAL ================= */}
      {showConfirmModal !==null && (
        <div className="aep-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="aep-modal" style={{ maxWidth: '400px', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div className="aep-modal-header">
              <h3 className="aep-modal-title">CONFIRM ADD TO CART</h3>
              <button type="button" className="aep-icon-btn" onClick={() => setShowConfirmModal(null)}>✕</button>
            </div>
            
            <div className="aep-modal-body" style={{ margin: '15px 0' }}>
              {showConfirmModal=="cart" && (<p style={{ fontSize: '14px', color: '#4b5563' }}>
                Are you sure you want to add <strong style={{ color: '#111827' }}>{name}</strong> (Size: UK {selectedSize}, Color: {currentVariant.colour}) to your cart?
              </p>)}
              {showConfirmModal=="buy" && (<p style={{ fontSize: '14px', color: '#4b5563' }}>
                Are you sure you want Buy <strong style={{ color: '#111827' }}>{name}</strong> (Size: UK {selectedSize}, Color: {currentVariant.colour})
              </p>)}
            </div>

            <div className="aep-modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="aep-btn-secondary" 
                onClick={() => setShowConfirmModal(null)}
                style={{ padding: '8px 16px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="aep-save-btn" 
                onClick={showConfirmModal=="cart"?executeAddToCart:buy}
                style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <UserFooter />
    </div>
  );
};

export default ProductDetails;