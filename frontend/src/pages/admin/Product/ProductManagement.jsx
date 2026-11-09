import React, { useState, useEffect } from 'react'
import './ProductManagement.css'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../../utils/axiosInstance'
import AdminSidebar from "../../../partials/AdminSidebar/AdminSidebar"
import SearchBar from "../../../partials/SearchBar/SearchBar"
import { Pencil, Trash2, Power } from "lucide-react"

const ProductManagement = () => {

    //-------------------STATES-------------------

  const [products, setProducts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedProductVariants, setSelectedProductVariants] = useState(null)
  const [deleteModalProductId, setDeleteModalProductId] = useState(null)
  const navigate = useNavigate()

    //-------------------GET-------------------

  const getProducts = async (page = 1, searchQuery = '') => {
    try {
      const response = await axiosInstance.get(`/admin/product/getProducts?page=${page}&limit=8&search=${searchQuery}`)
      if (response.data?.success === true) {
        setProducts(response.data?.data || [])
        setTotalPages(response.data?.totalPages || 1)
        setCurrentPage(response.data?.currentPage || page)
        setTotalProducts(response.data?.totalProducts || 0)
      }
    } catch (error) {
      console.log(error.response?.data?.message || 'Something went wrong')
    }
  }

    //-------------------SEARCH-------------------

const handleSearch = (eOrString) => {
  const searchTerm = typeof eOrString === 'string' ? eOrString : eOrString.target.value

  setSearch(searchTerm)
  setCurrentPage(1)
  getProducts(1, searchTerm)
}

  //-------------------TOGGLE------------------

  const handleToggleStatus = async (productId) => {
    try {
      const response = await axiosInstance.patch(`/admin/product/toggleStatus/${productId}`)
      if (response.data?.success) {
        getProducts(currentPage, search)
      }
    } catch (error) {
      console.error("Error toggling status", error)
    }
  }

    //-------------------DELETE CONFIRM-------------------

  const confirmDelete = async () => {
    if (!deleteModalProductId) return
    try {
      const response = await axiosInstance.patch(`/admin/product/deleteProduct/${deleteModalProductId}`)
      if (response.data?.success) {
        setDeleteModalProductId(null)
        getProducts(currentPage, search)
      }
    } catch (error) {
      console.error("Error deleting product", error)
    }
  }

    //-------------------NEXT PAGE-------------------

  const changePage = (type) => {
    if (type === "next" && currentPage < totalPages) {
      setCurrentPage(t => t + 1)
    } else if (type === "prev" && currentPage > 1) {
      setCurrentPage(t => t - 1)
    }
  }

    //-------------------FETCH CALL-------------------

  useEffect(() => {
    getProducts(currentPage, search)
  }, [currentPage])

  return (
    <>
      <AdminSidebar />


        {/*-------------------ADD PRODUCT----------------*/}

      <div className="category-management-container">
        {/* Top Header Section */}
        <div className="content-header">
          <div>
            <h2>PRODUCT MANAGEMENT</h2>
            <p>Manage your footwear products and inventory.</p>
          </div>
          <button
            className="add-category-main-btn"
            onClick={() => navigate('addEditProduct')}
          >
            + ADD PRODUCT
          </button>
        </div>



        {/*-------------------SEARCHBAR----------------*/}

        <div className="category-search-container">
         <SearchBar
            value={search}
            onChange={handleSearch}
            onClear={() => {
              setSearch('');
              setCurrentPage(1);
              getProducts(1, '');
            }}
          />
        </div>



        {/*-------------------PRODUCT TABLE----------------*/}

        <div className="table-card">
          <table className="category-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>VARIANT/STOCK</th>
                <th>BRAND</th>
                <th style={{ textAlign: "center" }}>PRICE (₹)</th>
                <th style={{ textAlign: "center" }}>STATUS</th>
                <th style={{ textAlign: "center" }}>OFFER</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const thumbImage = product.vartiant?.[0]?.images?.[0] || '';

                  return (
                    <tr key={product._id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {thumbImage && <img src={thumbImage} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                        <span>{product.name}</span>
                      </td>
                      
                      <td>
                        <button 
                          className="action-btn" 
                          title="View Variants" 
                          onClick={() => setSelectedProductVariants(product.vartiant || [])}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f3f4f6', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{product.vartiant?.length || 0}</span>
                        </button>
                      </td>

                      <td>{product.brand?.name || '-'}</td>
                      
<td style={{ textAlign: "center" }}>
  ₹{product.offer && product.offer > 0 
    ? Math.round(product.price - (product.price * product.offer) / 100) 
    : product.price}
</td>                      
                      <td style={{ textAlign: "center" }}>
                        <span className={`status-badge ${product.status?.toLowerCase()}`}>
                          {product.status}
                        </span>
                      </td>
                      
                      <td style={{ textAlign: "center" }}>
                        {product.offer ? (
                          <span className="offer-badge">{product.offer}%</span>
                        ) : (
                          <span className="offer-plus">-</span>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                          <label className="custom-toggle" style={{ margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={product.status === "Active"}
                              onChange={() => handleToggleStatus(product._id)}
                            />
                            <span className="toggle-slider"></span>
                          </label>

                          <button 
                            className="action-btn" 
                            title="Edit" 
                            onClick={() => navigate(`/admin/productManagement/addEditProduct/${product._id}`)}
                          >
                            <Pencil size={16} />
                          </button>
                          
                          <button 
                            className="action-btn delete-action" 
                            title="Delete" 
                            onClick={() => setDeleteModalProductId(product._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="table-footer">
            <span>
              Showing page {currentPage} of {totalPages || 1} ({totalProducts} total entries)
            </span>
            <div className="pagination">
              <button className="page-btn" onClick={() => changePage("prev")} disabled={currentPage === 1}>
                Prev
              </button>
              <button className="page-btn active">{currentPage}</button>
              <button className="page-btn" onClick={() => changePage("next")} disabled={currentPage >= totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="page-admin-footer">
          <p>© 2026 Urban Sole Admin Panel. Internal Use Only.</p>
        </div>
      </div>



      {/*------------------DELETE CONFIRMATION MODAL-------------*/}

      {deleteModalProductId && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="delete-icon">!</div>
            <h2>DELETE PRODUCT?</h2>
            <p>Are you sure you want to delete this product?</p>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setDeleteModalProductId(null)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={confirmDelete}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}




      {/*------------------VARIANT SHOW MODAL---------------*/}

      {selectedProductVariants && (
        <div className="modal-overlay" onClick={() => setSelectedProductVariants(null)}>
          <div className="modal-card" style={{ maxWidth: '700px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Product Variants Details</h3>
              <p>View all available variants and stock details</p>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px 0' }}>
              {selectedProductVariants.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No variants available for this product.</p>
              ) : (
                selectedProductVariants.map((variant, idx) => (
                  <div key={idx} style={{ marginBottom: '20px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: variant.colourHex, display: 'inline-block', border: '1px solid #ccc' }}></span>
                        <strong style={{ fontSize: '15px' }}>{variant.colour}</strong>
                      </div>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Photos: {variant.images?.length || 0}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '10px' }}>
                      {variant.inventory?.map((inv) => (
                        <div key={inv.size} style={{ background: '#fff', padding: '6px', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>Size {inv.size}</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{inv.quantity}</div>
                        </div>
                      ))}
                    </div>

                    {variant.images && variant.images.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {variant.images.map((imgUrl, imgIdx) => (
                          <img key={imgIdx} src={imgUrl} alt="Variant" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" className="submit-btn" onClick={() => setSelectedProductVariants(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductManagement