import { useState, useEffect } from 'react'
import './Men.css'
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

const Men = () => {
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilter, setIsFilter] = useState(false)
  const[loading,setLoading]=useState(false)
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
  
  // Cart & Size Selection Modal State
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
      const categoryQuery = activeFilters.categories.length > 0 ? activeFilters.categories.join(',') : ''
      const brandQuery = activeFilters.brands.length > 0 ? activeFilters.brands.join(',') : ''
      const sizeQuery = activeFilters.sizes.length > 0 ? activeFilters.sizes.join(',') : ''
      const priceQuery = activeFilters.price || ''
      const colorQuery = activeFilters.color || ''

      const url = `http://localhost:2222/user/product/getProducts?gender=Men&category=${encodeURIComponent(categoryQuery)}&brand=${encodeURIComponent(brandQuery)}&price=${encodeURIComponent(priceQuery)}&color=${encodeURIComponent(colorQuery)}&size=${encodeURIComponent(sizeQuery)}&search=${encodeURIComponent(searchQuery)}&sort=${encodeURIComponent(sortBy)}&page=${currentPage}&limit=8`
      
      const response = await axiosInstance.get(url)
      if (response.data?.success === true) {
        const fetchedProducts = response.data?.data || []
        const filteredProducts = fetchedProducts.filter(p => {
          if (p.status && p.status !== 'Active') return false
          return true
        })

        setProducts(filteredProducts)
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

  // ADD TO CART CLICK HANDLER
  const handleOpenCartModal = (e, product) => {
    e.stopPropagation() 
    setSelectedProductForCart(product)
    setSelectedVariant(null)
    setSelectedSize(null)
  }


//-----------------CONFIRM ADD TO CART--------------------

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
    setSelectedSize(null)
    setSelectedVariant(null)
  }

//-----------------CONFIRM ADD TO WISHLIST--------------------

  const handleAddToWishlist = async (product) => {
    console.log("Cart",cartItems)
    const isInCart = cartItems.some(item => {
      const prodId = typeof item.product === 'object' ? item.product?._id : item.product;
      return prodId === product._id;
    });

    if (isInCart) {
      toast.warn("This product is already in your cart!", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    try {
      await dispatch(addToWishlist(product._id)).unwrap();
      toast.success("Added to wishlist successfully!");
    } catch (error) {
      console.log("EEEEEE",error)
      toast.error(error?.message|| "Failed to add to wishlist");
    }
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
        {/* Header */}
        <header className="ms-header">
          <h1 className="ms-title">MEN'S SHOES</h1>
          <p className="ms-subtitle">Discover our curated collection of premium men's sneakers and shoes, designed for uncompromised style and performance.</p>
        </header>

        {/* Updated Top Row Toolbar */}
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

        {/*---------------------PRODUCT GRID------------------*/}

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
              <div 
                className="ms-card" 
                onClick={() => navigate("/user/productDetails", { state: { product: product } })} 
                key={product._id || product.id}
              >
                <div className="ms-image-container">
                  <img src={firstVariantImage} alt={product.name} className="ms-product-img" />
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
                  <span className="ms-card-name">
                    {typeof product.brand === 'object' ? product.brand?.name : product.brand} {product.name}
                  </span>
                  <span className="ms-card-category">
                    {typeof product.category === 'object' ? product.category?.name : product.category}
                  </span>
                  
                  <span className="ms-card-price"> ₹{product.offer && product.offer > 0 
    ? Math.round(product.price - (product.price * product.offer) / 100) 
    : product.price}</span>
                  <button 
                    className="ms-cart-btn" 
                    onClick={(e) => handleOpenCartModal(e, product)}
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
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

        {/* The Process Section */}
        <section className="ms-process-section">
          <h2 className="ms-process-main-title">THE PROCESS</h2>
          <div className="ms-process-grid">
            {/* Item 1 */}
            <div className="ms-process-item">
              <div className="ms-process-icon">
                <svg className="w-7 h-7 stroke-current" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2"></circle>
                  <path d="m12 7-6 13"></path>
                  <path d="m12 7 6 13"></path>
                  <path d="M8.5 15.5h7"></path>
                </svg>
              </div>
              <h3>ARCHITECTURAL DESIGN</h3>
              <p>Conceived through rigorous structural design principles, spatial ergonomics, and pure geometric proportions to create a distinctive contemporary silhouette.</p>
            </div>

            {/* Item 2 */}
            <div className="ms-process-item md-border-left">
              <div className="ms-process-icon">
                <svg className="w-7 h-7 stroke-current" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path d="M6 19h12"></path>
                  <path d="M8 19v-2a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v2"></path>
                  <circle cx="12" cy="9" r="2"></circle>
                  <path d="m13.5 7.5 3-3"></path>
                  <path d="m10.5 7.5-3-3"></path>
                  <path d="M17 4.5h2"></path>
                  <path d="M5 4.5h2"></path>
                </svg>
              </div>
              <h3>DISCIPLINED CRAFTSMANSHIP</h3>
              <p>Meticulously executed using high-grade, sustainable materials and precision stitching to guarantee long-lasting durability, refined finish, and exceptional comfort.</p>
            </div>

            {/* Item 3 */}
            <div className="ms-process-item md-border-left">
              <div className="ms-process-icon">
                <svg className="w-7 h-7 stroke-current" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path d="M9 18h6"></path>
                  <path d="M10 22h4"></path>
                  <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"></path>
                </svg>
              </div>
              <h3>URBAN INNOVATION</h3>
              <p>Engineered specifically for dynamic city environments, seamlessly integrating adaptive sole support with forward-thinking aesthetics for effortless everyday wear.</p>
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

                {/* 1. COLOR / VARIANT SELECTION */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                    SELECT COLOR: {selectedVariant?.colour ? `(${selectedVariant.colour.toUpperCase()})` : ''}
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
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

export default Men


