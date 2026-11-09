import { useState, useEffect } from 'react'
import './Women.css'
import Navbar from "../../../partials/navbar/navbar"
import UserFilter from "../../../partials/UserFilter/UserFilter"
import UserFooter from '../../../partials/UserFooter/UserFooter'
import axiosInstance from '../../../utils/axiosInstance'
import SearchBar from '../../../partials/SearchBar/SearchBar'
import { useNavigate } from 'react-router-dom'
import { addToCart } from "../../../redux/slices/cartSlice"
import { useDispatch, useSelector } from 'react-redux'
import { addToWishlist, removeFromWishlist, fetchWishlist } from "../../../redux/slices/wishlistSlice"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loader from '../../../partials/Loader/Loader'

const Women = () => {
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilter, setIsFilter] = useState(false)
  const [loading,setLoading]=useState(false)
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    price: '',
    color: '',
    brands: [],
    sizes: []
  })
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Cart & Selection Modal State
  const [selectedProductForCart, setSelectedProductForCart] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)

  const wishlistState = useSelector((state) => state.wishlist)
  const wishlistItems = wishlistState?.wishlist?.products || []
  const cartItems = useSelector((state) => state.cart?.items || [])

 useEffect(() => {
    const token = localStorage.getItem("token")

    if (token) {
        dispatch(fetchWishlist())
    }
}, [dispatch])

  const isProductInWishlist = (productId) => {
    return wishlistItems.some(item => (typeof item === 'string' ? item : item._id) === productId)
  }

  const navigate = useNavigate()

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters)
    setCurrentPage(1) 
  }

  const getProducts = async () => {
    setLoading(true)
    try {
      const categoryQuery = activeFilters.categories.join(',') 
      const brandQuery = activeFilters.brands.join(',')
      const sizeQuery = activeFilters.sizes.join(',')
      const priceQuery = activeFilters.price
      const colorQuery = activeFilters.color

      const url = `http://localhost:2222/user/product/getProducts?gender=Women&category=${categoryQuery}&brand=${brandQuery}&price=${priceQuery}&color=${colorQuery}&size=${sizeQuery}&search=${searchQuery}&sort=${sortBy}&page=${currentPage}&limit=8`      
      const response = await axiosInstance.get(url)
      
      if (response.data?.success === true) {
        setProducts(response.data?.data || [])
        setTotalPages(response.data?.totalPages || 1)
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Something went wrong")
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => {
    getProducts()
  }, [activeFilters, searchQuery, sortBy, currentPage])

  // ADD TO CART MODAL OPEN
  const handleOpenCartModal = (e, product) => {
    e.stopPropagation() 
    setSelectedProductForCart(product)
    const defaultVariant = product.vartiant?.[0] || null
    setSelectedVariant(defaultVariant)
    setSelectedSize(null)
  }

  // CONFIRM ADD TO CART
 // CONFIRM ADD TO CART
const handleConfirmAddToCart = async () => {
  if (!selectedSize || !selectedVariant) return

  // 1. Find max stock available for this specific variant & size
  let currentStock = 10
  if (selectedVariant && selectedVariant.inventory) {
    const invItem = selectedVariant.inventory.find(i => Number(i.size) === Number(selectedSize))
    if (invItem) {
      currentStock = invItem.quantity
    }
  }

  // 2. Calculate how many of this product (matching size & color/variant) are already in the cart
  const existingCartItem = cartItems.find(item => {
    const prodId = typeof item.product === 'object' ? item.product?._id : (item.product || item._id);
    return prodId === selectedProductForCart._id &&
           Number(item.size) === Number(selectedSize) &&
           item.colour === selectedVariant.colour;
  });

  const quantityAlreadyInCart = existingCartItem ? existingCartItem.quantity : 0;

  // 3. Apply client-side checks matching your backend rules
  if (quantityAlreadyInCart >= 5) {
    toast.warn("Already have 5 quantity its maximum", {
      position: "top-right",
      autoClose: 3000
    });
    return;
  }

  if (quantityAlreadyInCart >= currentStock) {
    toast.warn(`Already have ${quantityAlreadyInCart} its maximum stock`, {
      position: "top-right",
      autoClose: 3000
    });
    return;
  }

  try {
    const resultAction = await dispatch(addToCart({
      _id: selectedProductForCart._id,
      name: selectedProductForCart.name,
      brand: selectedProductForCart.brand,
      price: selectedProductForCart.price,
      size: selectedSize,
      colour: selectedVariant.colour,
      img: selectedVariant?.images?.[0] || selectedProductForCart.image,
      stock: currentStock
    }))

    // Check if the createAsyncThunk was rejected or returned an error message from backend
    if (addToCart.rejected.match(resultAction)) {
      const errorMessage = resultAction.payload?.message || resultAction.payload || "Failed to add product to cart."
      toast.warn(errorMessage, { position: "top-right", autoClose: 3000 })
      return;
    }

    toast.success("Added to cart successfully!")
  } catch (error) {
    console.error("Failed to add to cart:", error)
    toast.error(error?.message || "Failed to add product to cart.")
  } finally {
    setSelectedProductForCart(null)
    setSelectedVariant(null)
    setSelectedSize(null)
  }
}

  const handleCancelCartModal = () => {
    setSelectedProductForCart(null)
    setSelectedVariant(null)
    setSelectedSize(null)
  }

  const handleAddToWishlist = (product) => {
    const isInCart = cartItems.some(item => (item.product?._id || item.product || item._id) === product._id)
    if (isInCart) {
      toast.info("This product (or its variant) is already in your cart!")
      return
    }
    dispatch(addToWishlist(product._id))
    toast.success("Added to wishlist!")
  }

  return (
    <div className="ms-page-wrapper">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      {loading &&<Loader/>}

      <UserFilter
        isOpen={isFilter}
        onClose={() => setIsFilter(false)}
        initialFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
      />
      
      <main className="ms-main-content">
        {/* Header Section */}
        <header className="ms-header">
          <div className="ms-header-text">
            <h1 className="ms-title">WOMEN'S FOOTWEAR</h1>
            <p className="ms-subtitle">Discover stylish sneakers, casual shoes, running footwear and everyday essentials designed for modern women.</p>
          </div>
        </header>

        {/* Controls Toolbar */}
        <div className="ms-top-toolbar">
          <div className="ms-toolbar-left">
            <button className="ms-filter-box-btn" onClick={() => setIsFilter(true)}>
              <span className="material-symbols-outlined ms-filter-icon">tune</span>
              FILTER
            </button>
            <SearchBar 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              onClear={() => setSearchQuery('')}
            />
          </div>

          <div className="ms-toolbar-right">
            <span className="ms-sort-text">SORT BY:</span>
            <div className="ms-sort-select-container">
              <select 
                className="ms-sort-box-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">RECOMMENDED</option>
                <option value="price-asc">PRICE: LOW TO HIGH</option>
                <option value="price-desc">PRICE: HIGH TO LOW</option>
                <option value="name-asc">A TO Z</option>
                <option value="name-desc">Z TO A</option>
              </select>
            </div>
          </div>
        </div>
        
{/* Product Grid / Empty State */}
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '1.25rem', color: '#222', marginBottom: '8px', fontWeight: '600' }}>
              No products found.
            </p>
            <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '24px' }}>
              We couldn't find anything matching your search or applied filters.
            </p>
            <button 
              onClick={() => {
                setSearchQuery('')
                setActiveFilters({
                  categories: [],
                  price: '',
                  color: '',
                  brands: [],
                  sizes: []
                })
              }}
              style={{
                display: 'inline-block',
                backgroundColor: '#000',
                color: '#fff',
                padding: '14px 32px',
                border: 'none',
                fontWeight: 'bold',
                letterSpacing: '1px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              CLEAR SEARCH & FILTERS
            </button>
          </div>
        ) : (
          <div className="ms-grid">
            {products.map((product) => {
              const firstVariantImage = product.vartiant?.[0]?.images?.[0] || product.image
              const inWishlist = isProductInWishlist(product._id)

              return (
                <article 
                  className="ms-card" 
                  key={product._id || product.id}
                  onClick={() => navigate("/user/productDetails", { state: { product: product } })}
                >
                  <div className="ms-image-container">
                    <img src={firstVariantImage} alt={product.name} className="ms-product-img" />
                    <div className="ms-badge">TRENDING</div>
                    <button 
                      className={`ms-fav-btn ${inWishlist ? 'active' : ''}`} 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (inWishlist) {
                          dispatch(removeFromWishlist(product._id))
                          toast.info("Removed from wishlist")
                        } else {
                          handleAddToWishlist(product)
                        }
                      }}
                      style={{ color: inWishlist ? '#000' : '#6b7280' }}
                    >
                      <span 
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: inWishlist ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>
                  </div>
                  <div className="ms-card-body">
                    <h3 className="ms-card-name">
                      {typeof product.brand === 'object' ? product.brand?.name : product.brand} {product.name}
                    </h3>
                    <span className="ms-card-category">
                      {typeof product.category === 'object' ? product.category?.name : product.category}
                    </span>
                    <p className="ms-card-price"> ₹{product.offer && product.offer > 0 
                      ? Math.round(product.price - (product.price * product.offer) / 100) 
                      : product.price}
                    </p>
                    <button 
                      className="ms-cart-btn"
                      onClick={(e) => handleOpenCartModal(e, product)}
                    >
                      ADD TO CART
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="ms-pagination">
          <button 
            className="ms-page-btn" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          
          <button className="ms-page-btn active">{currentPage}</button>
          
          <button 
            className="ms-page-btn" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        <div className="ms-section-divider"></div>

        {/* The Experience Section */}
        <section className="ms-experience-section">
          <h2 className="ms-experience-main-title">THE EXPERIENCE</h2>
          <div className="ms-experience-grid">
            <div className="ms-experience-item">
              <div className="ms-experience-icon">
                <span className="material-symbols-outlined">eco</span>
              </div>
              <h3>SUSTAINABLE SOLES</h3>
              <p>Every step counts. We use recycled compounds and ethically sourced materials to ensure our environmental footprint is as light as our shoes.</p>
            </div>
            <div className="ms-experience-item">
              <div className="ms-experience-icon">
                <span className="material-symbols-outlined">settings_input_antenna</span>
              </div>
              <h3>URBAN ADAPTIVE TECH</h3>
              <p>Engineered for the changing landscape. Our responsive cushioning technology adapts to the concrete grind, providing all-day comfort for the modern explorer.</p>
            </div>
            <div className="ms-experience-item">
              <div className="ms-experience-icon">
                <span className="material-symbols-outlined">architecture</span>
              </div>
              <h3>ARCHITECTURAL FIT</h3>
              <p>Structure meets anatomy. We design from the inside out, using spatial principles to create a silhouette that supports the natural movement of the human foot.</p>
            </div>
          </div>
        </section>

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
                  {typeof selectedProductForCart.brand === 'object' ? selectedProductForCart.brand?.name : selectedProductForCart.brand} {selectedProductForCart.name}
                </p>

                {/* 1. COLOR SELECTION */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                    SELECT COLOR: {selectedVariant?.colour ? `(${selectedVariant.colour.toUpperCase()})` : ''}
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedProductForCart.vartiant?.map((variant, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedVariant(variant)
                          setSelectedSize(null)
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
                      let isAvailable = false
                      let stockQty = 0

                      if (selectedVariant && selectedVariant.inventory && Array.isArray(selectedVariant.inventory)) {
                        const invItem = selectedVariant.inventory.find(i => Number(i.size) === Number(size))
                        if (invItem && invItem.quantity > 0) {
                          isAvailable = true
                          stockQty = invItem.quantity
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
                      )
                    })}
                  </div>
                </div>

              </div>

              <div className="aep-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="aep-btn-secondary" onClick={handleCancelCartModal} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="aep-save-btn" 
                  onClick={handleConfirmAddToCart}
                  style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', opacity: (!selectedVariant || !selectedSize) ? 0.6 : 1, cursor: 'pointer' }}
                  disabled={!selectedVariant || !selectedSize}
                >
                  Confirm & Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <UserFooter />
    </div>
  )
}

export default Women