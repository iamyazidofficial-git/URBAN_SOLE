import React, { useState, useEffect } from 'react'
import './ProductDetails.css'
import Navbar from '../../../partials/navbar/navbar'
import UserFooter from '../../../partials/UserFooter/UserFooter'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../../../redux/slices/cartSlice'
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../../../redux/slices/wishlistSlice'
import axiosInstance from '../../../utils/axiosInstance'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ProductDetails = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const initialProduct = location.state?.product || {}
  const [product, setProduct] = useState(initialProduct)
  const { _id, name, price, description, brand, category, countryOfOrgin, offer, status, vartiant = [] } = product
  const cartItems = useSelector((state) => state.cart?.items || []);

  useEffect(() => {
    if (location.state?.product) {
      setProduct(location.state.product);
    }
  }, [location.state?.product]);

  useEffect(() => {
    const fetchFullProduct = async () => {
      const prodId = _id || location.state?.product?._id;
      if (prodId && (!product.vartiant || product.vartiant.length === 0)) {
        try {
          const res = await axiosInstance.get(`/user/product/getProduct/${prodId}`);
          if (res?.data?.success && res.data.data) {
            setProduct(res.data.data);
          }
        } catch (err) {
          console.log("Failed to fetch full product details:", err);
        }
      }
    };
    fetchFullProduct();
  }, [_id, location.state?.product]);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [accordionOpen, setAccordionOpen] = useState({ 1: false, 2: false })
  const [relatedProducts, setRelatedProducts] = useState([])

  // Hover Magnifier States
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.5);

  // Related Product Quick Add-To-Cart Modal States
  const [selectedRelatedProduct, setSelectedRelatedProduct] = useState(null);
  const [selectedRelVariantIndex, setSelectedRelVariantIndex] = useState(0);
  const [selectedRelSize, setSelectedRelSize] = useState(null);

  // Review States
  const [productReviews, setProductReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);

  const [toastMessage, setToastMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  const showToast = (msg, type = "success") => {
    if (type === "warn" || type === "error") {
      toast.warn(msg);
    } else {
      toast.success(msg);
    }
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

  // Fetch Product Reviews
  useEffect(() => {
    const fetchProductReviews = async () => {
      try {
        const response = await axiosInstance.get(`/user/review/getProductReview/${_id}`);
        if (response?.data?.success) {
          setProductReviews(response.data.data.reviews || []);
          setAvgRating(response.data.data.averageRating || 0);
          setTotalReviewsCount(response.data.data.totalReviews || 0);
        }
      } catch (error) {
        console.log("Failed to load product reviews:", error);
      }
    };
    if (_id) fetchProductReviews();
  }, [_id]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const brandName = typeof brand === 'object' ? brand?.name : brand;
        if (!brandName) return;

        const res = await axiosInstance.get(`/user/product/getProducts?brand=${encodeURIComponent(brandName)}&limit=8`);
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
  }, [selectedVariantIndex]);

  const getStockForSize = (size) => {
    const item = inventoryList.find(inv => Number(inv.size) === Number(size));
    return item ? Number(item.quantity) : 0;
  };

  const toggleAccordion = (index) => {
    setAccordionOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Mouse Move Handler for Hover Magnification
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setMousePosition({ x, y });
  };

  // ADD TO CART EXECUTION (Main Product)
  const executeAddToCart = async () => {
    if (selectedSize === null || !currentVariant) {
      showToast("Please select a size", "warn");
      return;
    }

    const currentStock = getStockForSize(selectedSize);

    if (currentStock <= 0) {
      showToast("Selected size is out of stock!", "warn");
      setShowConfirmModal(null);
      return;
    }

    const existingCartItem = cartItems.find(item => {
      const prodId = typeof item.product === 'object' ? item.product?._id : (item.product || item._id);
      return prodId === _id &&
             Number(item.size) === Number(selectedSize) &&
             item.colour === currentVariant.colour;
    });

    const quantityAlreadyInCart = existingCartItem ? existingCartItem.quantity : 0;

    if (quantityAlreadyInCart >= 5) {
      showToast("Already have 5 quantity (maximum limit reached)", "warn");
      setShowConfirmModal(null);
      return;
    }

    if (quantityAlreadyInCart >= currentStock) {
      showToast(`Already have ${quantityAlreadyInCart} (maximum stock reached)`, "warn");
      setShowConfirmModal(null);
      return;
    }

    if (quantityAlreadyInCart + quantity > 5) {
      showToast(`Maximum allowed total in cart is 5 quantities`, "warn");
      setShowConfirmModal(null);
      return;
    }

    if (quantityAlreadyInCart + quantity > currentStock) {
      showToast(`Only ${currentStock} items available in stock`, "warn");
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
        showToast(errorMessage, "warn");
        setShowConfirmModal(null);
        return;
      }

      showToast("Added to cart successfully!");
      setShowConfirmModal(null);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      showToast(error?.message || "Failed to add to cart", "error");
      setShowConfirmModal(null);
    }
  };

  const handleWishlistToggle = async () => {
    if (isProductInWishlist) {
      dispatch(removeFromWishlist(_id));
      showToast("Removed from wishlist");
    } else {
      try {
        await dispatch(addToWishlist(_id)).unwrap()
        showToast("Added to wishlist");
      } catch (error) {
        console.log("ER", error)
        showToast(error?.message || "Failed to add to wishlist", "warn");
      }
    }
  };

  const buy = () => {
    if (selectedSize === null) {
      showToast("Please select a size", "warn");
      return;
    }
    const currentStock = getStockForSize(selectedSize);
    if (currentStock <= 0) {
      showToast("Selected size is out of stock!", "warn");
      return;
    }
    if (quantity > currentStock) {
      showToast(`Cannot proceed. Available stock is ${currentStock}`, "warn");
      return;
    }
    if (quantity > 5) {
      showToast("Maximum quantity allowed is 5", "warn");
      return;
    }

    navigate("/user/checkout", {
      state: {
        data: [{
          product: _id,
          _id: _id,
          name: name,
          brand: brand?.name,
          price: price,
          size: selectedSize,
          colour: currentVariant.colour,
          img: images[activeImg] || images[0],
          quantity: quantity,
          offer: offer,
          status: status,
          stock: currentStock
        }] 
      }
    });
  };

  // RELATED PRODUCT QUICK ADD-TO-CART HANDLERS
  const handleOpenRelatedCartModal = (e, relProduct) => {
    e.stopPropagation();
    setSelectedRelatedProduct(relProduct);
    const variants = relProduct.vartiant || [];
    let varIdx = 0;
    const foundVarIdx = variants.findIndex(v => v.inventory?.some(inv => inv.quantity > 0));
    if (foundVarIdx !== -1) varIdx = foundVarIdx;
    setSelectedRelVariantIndex(varIdx);

    const activeVar = variants[varIdx];
    const firstAvail = activeVar?.inventory?.find(inv => inv.quantity > 0);
    setSelectedRelSize(firstAvail ? firstAvail.size : null);
  };

  const handleCloseRelatedCartModal = () => {
    setSelectedRelatedProduct(null);
    setSelectedRelVariantIndex(0);
    setSelectedRelSize(null);
  };

  const handleConfirmRelatedAddToCart = async () => {
    if (!selectedRelatedProduct || selectedRelSize === null) {
      showToast("Please select a size", "warn");
      return;
    }

    const currentRelVariant = selectedRelatedProduct.vartiant?.[selectedRelVariantIndex] || {};
    const inventoryList = currentRelVariant.inventory || [];
    const invItem = inventoryList.find(inv => Number(inv.size) === Number(selectedRelSize));
    const currentStock = invItem ? Number(invItem.quantity) : 0;

    if (currentStock <= 0) {
      showToast("Selected size is out of stock!", "warn");
      return;
    }

    const existingCartItem = cartItems.find(item => {
      const prodId = typeof item.product === 'object' ? item.product?._id : (item.product || item._id);
      return prodId === selectedRelatedProduct._id &&
             Number(item.size) === Number(selectedRelSize) &&
             item.colour === currentRelVariant.colour;
    });

    const quantityAlreadyInCart = existingCartItem ? existingCartItem.quantity : 0;

    if (quantityAlreadyInCart >= 5) {
      showToast("Already have 5 quantity (maximum limit reached)", "warn");
      return;
    }

    if (quantityAlreadyInCart >= currentStock) {
      showToast(`Already have ${quantityAlreadyInCart} (maximum stock reached)`, "warn");
      return;
    }

    const discountedPrice = selectedRelatedProduct.offer && selectedRelatedProduct.offer > 0 
      ? Math.round(selectedRelatedProduct.price - (selectedRelatedProduct.price * selectedRelatedProduct.offer) / 100) 
      : selectedRelatedProduct.price;

    try {
      const resultAction = await dispatch(addToCart({
        product: selectedRelatedProduct._id,
        _id: selectedRelatedProduct._id,
        name: selectedRelatedProduct.name,
        brand: typeof selectedRelatedProduct.brand === 'object' ? selectedRelatedProduct.brand?._id : selectedRelatedProduct.brand,
        price: discountedPrice,
        size: selectedRelSize,
        colour: currentRelVariant.colour || "Default",
        img: currentRelVariant.images?.[0] || selectedRelatedProduct.image,
        quantity: 1, 
        stock: currentStock
      }));

      if (addToCart.rejected.match(resultAction)) {
        const errorMessage = resultAction.payload?.message || resultAction.payload || "Failed to add to cart.";
        showToast(errorMessage, "warn");
        return;
      }

      showToast("Added to cart successfully!");
      handleCloseRelatedCartModal();
    } catch (error) {
      console.error("Failed to add to cart:", error);
      showToast(error?.message || "Failed to add to cart", "error");
    }
  };

  return (
    <div className="us-page-wrapper">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />

      <nav className="us-breadcrumb" aria-label="Breadcrumb">
        <ol className="us-breadcrumb-list">
          <li><a href="/user/home">HOME</a></li>
          <li className="us-separator">/</li>
          <li><span aria-current="page">PRODUCT DETAILS</span></li>
        </ol>
      </nav>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="custom-toast-notification">
          {toastMessage}
        </div>
      )}

      <main className="us-main-content">
        <div className="us-product-layout">
          
          {/* Left Column: Images with Smooth In-Place Hover Magnification & Click Zoom */}
          <div className="us-product-gallery">
            <div 
              className="us-main-image-box"
              onMouseEnter={() => setShowMagnifier(true)}
              onMouseLeave={() => setShowMagnifier(false)}
              onMouseMove={handleMouseMove}
              onClick={() => images.length > 0 && setIsZoomModalOpen(true)}
              title="Hover to zoom • Click to expand"
            >
              {images.length > 0 ? (
                <img 
                  src={images[activeImg] || images[0]} 
                  alt={name} 
                  className={`us-main-img ${showMagnifier ? 'zoomed' : ''}`}
                  style={{
                    transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                    transform: showMagnifier ? 'scale(2.4)' : 'scale(1)',
                    transition: showMagnifier ? 'transform 0.05s ease-out' : 'transform 0.25s ease-out',
                  }}
                />
              ) : (
                <div style={{ padding: '40px', color: '#5d5f5f', fontSize: '14px' }}>No images available</div>
              )}

              {/* Hover Zoom Hint */}
              {images.length > 0 && (
                <div className="us-zoom-hint">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>zoom_in</span>
                  <span>{showMagnifier ? 'Click to expand' : 'Hover to zoom'}</span>
                </div>
              )}

              <button 
                className={`us-fav-btn ${isProductInWishlist ? 'active' : ''}`} 
                aria-label="favorite"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWishlistToggle();
                }}
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
                    onClick={() => setActiveImg(idx)}
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
                <div className="us-rating-badge">★ {avgRating > 0 ? avgRating.toFixed(1) : '4.8'}</div>
                <span className="us-rating-text">{totalReviewsCount} Reviews</span>
              </div>
              <div className="us-price-row">
                <span className="us-current-price">
                  ₹{offer && offer > 0 
                    ? Math.round(price - (price * offer) / 100) 
                    : price}
                </span>
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
                    const currentStock = getStockForSize(selectedSize);
                    if (quantity >= 5) {
                      showToast("Maximum quantity is 5", "warn");
                      return;
                    }
                    if (currentStock > 0 && quantity >= currentStock) {
                      showToast("Maximum available stock reached", "warn");
                      return;
                    }
                    if (quantity < currentStock && quantity < 5) {
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

          {/* RATINGS & REVIEWS SECTION */}
          <div className="us-product-reviews-section">
            <div className="us-reviews-header-flex">
              <h2>RATINGS & REVIEWS ({totalReviewsCount})</h2>
              <div className="us-overall-rating-badge">
                <span>★ {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</span>
              </div>
            </div>

            {productReviews.length === 0 ? (
              <p className="us-no-reviews-text">No reviews yet for this product. Be the first to write one after purchasing!</p>
            ) : (
              <div className="us-reviews-list-container">
                {productReviews.map((rev) => (
                  <div key={rev._id} className="us-review-item-card">
                    <div className="us-review-item-top">
                      <strong className="us-review-username">
                        {rev.user?.name || "Verified Customer"}
                      </strong>
                      <span className="us-review-date">
                        {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="us-review-stars">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    <h4 className="us-review-card-title">{rev.title}</h4>
                    <p className="us-review-card-comment">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
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
                const relVariant = relProduct.vartiant?.[0] || {};
                const relImg = relVariant.images?.[0] || relProduct.image;

                const isRelInWishlist = wishlistItems.some(
                  item => (typeof item === 'string' ? item : item?._id) === relProduct._id
                );

                const discountedPrice = relProduct.offer && relProduct.offer > 0 
                  ? Math.round(relProduct.price - (relProduct.price * relProduct.offer) / 100) 
                  : relProduct.price;

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
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (isRelInWishlist) {
                            dispatch(removeFromWishlist(relProduct._id));
                            showToast("Removed from wishlist");
                          } else {
                            try {
                              await dispatch(addToWishlist(relProduct._id)).unwrap();
                              showToast("Added to wishlist");
                            } catch (error) {
                              showToast(error?.message || "Failed to add to wishlist", "warn");
                            }
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
                        <span className="us-trend-price">₹{discountedPrice}</span>
                      </div>
                      <p className="us-trend-desc">
                        {typeof relProduct.category === 'object' ? relProduct.category?.name : (relProduct.category || "Footwear")}
                      </p>
                      
                      {/* Open Color & Size Selection Modal for Related Product */}
                      <button 
                        className="us-trend-cart-btn"
                        onClick={(e) => handleOpenRelatedCartModal(e, relProduct)}
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

      {/* FULLSCREEN IMAGE ZOOM LIGHTBOX MODAL */}
      {isZoomModalOpen && images.length > 0 && (
        <div className="us-lightbox-overlay" onClick={() => setIsZoomModalOpen(false)}>
          <div className="us-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="us-lightbox-header">
              <span className="us-lightbox-title">{name} - Image {activeImg + 1} of {images.length}</span>
              <div className="us-lightbox-controls">
                <button 
                  type="button" 
                  className="us-lightbox-btn"
                  onClick={() => setZoomLevel(prev => Math.min(3, +(prev + 0.5).toFixed(1)))}
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined">zoom_in</span>
                </button>
                <button 
                  type="button" 
                  className="us-lightbox-btn"
                  onClick={() => setZoomLevel(prev => Math.max(1, +(prev - 0.5).toFixed(1)))}
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined">zoom_out</span>
                </button>
                <button 
                  type="button" 
                  className="us-lightbox-btn close"
                  onClick={() => setIsZoomModalOpen(false)}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="us-lightbox-image-wrap">
              {images.length > 1 && (
                <button 
                  className="us-lightbox-arrow prev" 
                  onClick={() => setActiveImg(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                  title="Previous image"
                >
                  ❮
                </button>
              )}
              <div className="us-lightbox-zoom-container">
                <img 
                  src={images[activeImg] || images[0]} 
                  alt={name} 
                  className="us-lightbox-img" 
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              </div>
              {images.length > 1 && (
                <button 
                  className="us-lightbox-arrow next" 
                  onClick={() => setActiveImg(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                  title="Next image"
                >
                  ❯
                </button>
              )}
            </div>

            {images.length > 1 && (
              <div className="us-lightbox-thumbs">
                {images.map((img, idx) => (
                  <button 
                    key={idx} 
                    className={`us-lightbox-thumb ${activeImg === idx ? 'active' : ''}`}
                    onClick={() => setActiveImg(idx)}
                  >
                    <img src={img} alt={`Thumb ${idx}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= RELATED PRODUCT COLOR & SIZE MODAL ================= */}
      {selectedRelatedProduct && (() => {
        const relVariants = selectedRelatedProduct.vartiant || [];
        const currentRelVar = relVariants[selectedRelVariantIndex] || relVariants[0] || {};
        const relInvList = currentRelVar.inventory || [];
        const relImg = currentRelVar.images?.[0] || selectedRelatedProduct.image;
        const relDiscountedPrice = selectedRelatedProduct.offer && selectedRelatedProduct.offer > 0 
          ? Math.round(selectedRelatedProduct.price - (selectedRelatedProduct.price * selectedRelatedProduct.offer) / 100) 
          : selectedRelatedProduct.price;
        const relStockForSelectedSize = (() => {
          const item = relInvList.find(inv => Number(inv.size) === Number(selectedRelSize));
          return item ? Number(item.quantity) : 0;
        })();

        return (
          <div className="us-modal-overlay" onClick={handleCloseRelatedCartModal}>
            <div className="us-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="us-modal-header">
                <h3 className="us-modal-title">SELECT COLOR & SIZE</h3>
                <button type="button" className="us-modal-close-btn" onClick={handleCloseRelatedCartModal}>✕</button>
              </div>

              <div className="us-modal-body">
                {/* Product Snapshot */}
                <div className="us-modal-prod-preview">
                  <img src={relImg} alt={selectedRelatedProduct.name} className="us-modal-prod-img" />
                  <div className="us-modal-prod-meta">
                    <span className="us-modal-brand">
                      {typeof selectedRelatedProduct.brand === 'object' ? selectedRelatedProduct.brand?.name : selectedRelatedProduct.brand}
                    </span>
                    <h4 className="us-modal-prod-name">{selectedRelatedProduct.name}</h4>
                    <div className="us-modal-price-row">
                      <span className="us-modal-cur-price">₹{relDiscountedPrice}</span>
                      {selectedRelatedProduct.offer > 0 && (
                        <>
                          <span className="us-modal-orig-price">₹{selectedRelatedProduct.price}</span>
                          <span className="us-modal-offer-badge">{selectedRelatedProduct.offer}% OFF</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1. COLOR SELECTION */}
                {relVariants.length > 0 && (
                  <div className="us-modal-section">
                    <label className="us-modal-label">
                      COLOR: <span className="us-modal-sub-label">{currentRelVar.colour?.toUpperCase() || ''}</span>
                    </label>
                    <div className="us-modal-color-options">
                      {relVariants.map((v, idx) => (
                        <button
                          key={v._id || idx}
                          type="button"
                          className={`us-modal-color-btn ${selectedRelVariantIndex === idx ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedRelVariantIndex(idx);
                            const newVar = relVariants[idx];
                            const firstAvail = newVar?.inventory?.find(inv => inv.quantity > 0);
                            setSelectedRelSize(firstAvail ? firstAvail.size : null);
                          }}
                          title={v.colour}
                        >
                          <span style={{ backgroundColor: v.colourHex || '#000000' }}></span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. SIZE SELECTION */}
                <div className="us-modal-section">
                  <label className="us-modal-label">
                    SIZE (UK): {selectedRelSize !== null && <span className="us-modal-sub-label">UK {selectedRelSize}</span>}
                  </label>
                  <div className="us-modal-size-grid">
                    {relInvList.map((inv) => {
                      const isOut = Number(inv.quantity) <= 0;
                      const isSelected = Number(selectedRelSize) === Number(inv.size);
                      return (
                        <button
                          key={inv.size}
                          type="button"
                          disabled={isOut}
                          className={`us-modal-size-btn ${isSelected ? 'active' : ''} ${isOut ? 'disabled' : ''}`}
                          onClick={() => !isOut && setSelectedRelSize(inv.size)}
                        >
                          {inv.size} {isOut ? '(OUT)' : ''}
                        </button>
                      );
                    })}
                  </div>
                  {selectedRelSize !== null && (
                    <p className="us-modal-stock-hint" style={{ color: relStockForSelectedSize > 0 ? '#10b981' : '#ef4444' }}>
                      {relStockForSelectedSize > 0 
                        ? `In Stock: ${relStockForSelectedSize} pairs available for UK ${selectedRelSize}`
                        : `Out of stock for UK ${selectedRelSize}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="us-modal-footer">
                <button type="button" className="us-modal-btn-cancel" onClick={handleCloseRelatedCartModal}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="us-modal-btn-confirm" 
                  onClick={handleConfirmRelatedAddToCart}
                  disabled={selectedRelSize === null || relStockForSelectedSize <= 0}
                >
                  Confirm & Add to Cart
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MAIN PRODUCT CART / BUY CONFIRMATION MODAL */}
      {showConfirmModal !== null && (
        <div className="us-modal-overlay" onClick={() => setShowConfirmModal(null)}>
          <div className="us-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="us-modal-header">
              <h3 className="us-modal-title">
                {showConfirmModal === "cart" ? "CONFIRM ADD TO CART" : "CONFIRM PURCHASE"}
              </h3>
              <button type="button" className="us-modal-close-btn" onClick={() => setShowConfirmModal(null)}>✕</button>
            </div>
            
            <div className="us-modal-body">
              {showConfirmModal === "cart" ? (
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                  Are you sure you want to add <strong style={{ color: '#111827' }}>{name}</strong> (Size: UK {selectedSize}, Color: {currentVariant.colour}) to your cart?
                </p>
              ) : (
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                  Are you sure you want to buy <strong style={{ color: '#111827' }}>{name}</strong> (Size: UK {selectedSize}, Color: {currentVariant.colour})?
                </p>
              )}
            </div>

            <div className="us-modal-footer">
              <button 
                type="button" 
                className="us-modal-btn-cancel" 
                onClick={() => setShowConfirmModal(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="us-modal-btn-confirm" 
                onClick={showConfirmModal === "cart" ? executeAddToCart : buy}
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
