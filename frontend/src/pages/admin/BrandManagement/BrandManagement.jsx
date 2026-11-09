import React, { useEffect, useState } from "react"
import "./BrandManagement.css"
import { Pencil, Trash2 } from "lucide-react"
import AdminSidebar from "../../../partials/AdminSidebar/AdminSidebar"
import Loader from "../../../partials/Loader/Loader"
import axiosInstance from "../../../utils/axiosInstance"
import { useForm } from "react-hook-form"
import SearchBar from "../../../partials/SearchBar/SearchBar"

const BrandManagement = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [newError, setNewError] = useState("")
  const [brands, setBrands] = useState([])
  const [deleteId, setDeleteId] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [totalBrands, setTotalBrands] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const openModal = (type, brand) => {
    if (type === "add") {
      reset({
        _id: "",
        name: "",
        description: "",
        offer: "",
        offerExpiry: "",
        status: "Active",
      });
      setIsAddModalOpen(true);
      setNewError("")
    }
    if (type === "edit") {
      reset({
        _id: brand?._id,
        name: brand?.name,
        description: brand?.description,
        offer: brand.offer && brand.offer > 0 ? brand.offer : "",
        offerExpiry: brand?.offerExpiry ? brand.offerExpiry.split("T")[0] : "",
        status: brand?.status,
      });
      setIsEditModalOpen(true);
      setNewError("")
    }
  };

  const onSubmit = async (data) => {
    setNewError("");
    try {
      const response = await axiosInstance.post(
        "http://localhost:2222/admin/brand/addBrand",
        {
          name: data?.name,
          description: data?.description,
          status: data?.status,
          offer: data?.offer,
          offerExpiry: data?.offerExpiry,
        },
      );

      if (response.data?.success === true) {
        setIsAddModalOpen(false);
        getBrands();
      }
    } catch (error) {
      console.log("Error" + error);
      setNewError(error.response?.data?.message || "Something went wrong");
    }
  };

  const editBrand = async (data) => {
    try {
      const response = await axiosInstance.put(
        `http://localhost:2222/admin/brand/editBrand/${data._id}`,
        data,
      );
      if (response.data?.success === true) {
        setIsEditModalOpen(false);
        getBrands();
      }
    } catch (error) {
      console.log(error.response?.message || "Something went wrong");
      setNewError(error.response?.data?.message || "Something went wrong");
    }
  };

  const getBrands = async () => {
    try {
      const response = await axiosInstance.get(
        `http://localhost:2222/admin/brand/getBrand/?page=${page}&limit=5&search=${search}`,
      );

      if (response.data?.success === true) {
        setBrands(response.data?.data || []);
        setTotalBrands(response.data?.totalBrands || 0);
        setTotalPages(response.data?.totalPages || 1);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteBrand = async () => {
    setNewError("");
    try {
      const response = await axiosInstance.patch(
        `http://localhost:2222/admin/brand/deleteBrand/${deleteId}`
      );
      if (response.data?.success === true) {
        getBrands();
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Something went wrong");
    } finally {
      setDeleteId(null);
    }
  };

  useEffect(() => {
    getBrands();
  }, [search, page]);

  const toggleStatus = async (id) => {
    try {
      const response = await axiosInstance.patch(
        `http://localhost:2222/admin/brand/toggleStatus/${id}`
      );
      if (response.data?.success === true) {
        getBrands();
      }
    } catch (error) {
      console.log(error.response?.message || "Something went wrong");
    }
  };

  const changePage = (type) => {
    if (type === "next" && page < totalPages) {
      setPage((t) => t + 1);
    } else if (type === "prev" && page > 1) {
      setPage((t) => t - 1);
    }
  };

  const handleSearch = (searchTerm) => {
    setSearch(searchTerm);
    setPage(1); 
  };

  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      <AdminSidebar />
      <div className="brand-management-container">
        {/* Top Header Section */}
        <div className="content-header">
          <div>
            <h2>BRAND MANAGEMENT</h2>
            <p>Organize and manage your product brands.</p>
          </div>
          <button
            className="add-brand-main-btn"
            onClick={() => openModal("add")}
          >
            + ADD BRAND
          </button>
        </div>

        <div className="brand-search-container">
        <SearchBar
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onClear={() => handleSearch("")}
            placeholder="Search brands..."
          />
        </div>

        {/* Brands Table Card */}
        <div className="table-card">
          <table className="brand-table">
            <thead>
              <tr>
                <th>BRAND NAME</th>
                <th>NO. OF PRODUCTS</th>
                <th style={{ textAlign: "center" }}>OFFER</th>
                <th style={{ textAlign: "center" }}>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {brands.length > 0 ? (
                brands.map((brand) => (
                  <tr key={brand._id || brand.id}>
                    <td>{brand.name}</td>
                    <td>{brand.totalProducts ?? 0}</td>
                    <td style={{ textAlign: "center" }}>
                      {brand.offer ? (
                        <span className="offer-badge">{brand.offer}%</span>
                      ) : (
                        <span className="offer-plus">-</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`status-badge ${brand.status?.toLowerCase()}`}>
                        {brand.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                        <label className="custom-toggle" style={{ margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={brand.status === "Active"}
                            onChange={() => toggleStatus(brand._id)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <button
                          className="action-btn"
                          onClick={() => openModal("edit", brand)}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="action-btn delete-action"
                          onClick={() => setDeleteId(brand._id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                    No brands found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="table-footer">
            <span>
              Showing page {page} of {totalPages || 1} ({totalBrands} total entries)
            </span>
            <div className="pagination">
              <button className="page-btn" onClick={() => changePage("prev")} disabled={page === 1}>
                Prev
              </button>
              <button className="page-btn active">{page}</button>
              <button className="page-btn" onClick={() => changePage("next")} disabled={page >= totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* ADD BRAND MODAL */}
        {isAddModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsAddModalOpen(false)}
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Brand</h3>
                <p>Create a new product brand</p>
              </div>
              {newError && <p className="form-error">{newError}</p>}
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label>Brand Name *</label>
                  <input
                    type="text"
                    placeholder="Enter brand name"
                    maxLength={24}
                    {...register("name", {
                      required: "Name is required",
                      validate: {
                        minLetters: (value) =>
                          (value.match(/[a-zA-Z]/g) || []).length >= 2 ||
                          "Name must contain at least 2 characters",
                        onlyLetters: (value) =>
                          /^[a-zA-Z0-9 ]+$/.test(value) ||
                          "Name must contain only letters, numbers, and spaces",
                      },
                    })}
                  />
                  {errors.name && (
                    <p className="error-message">{errors?.name?.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    maxLength={200}
                    placeholder="Enter brand description"
                    {...register("description")}
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label>Status</label>
                    <select
                      {...register("status", {
                        required: "Status is required",
                      })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    {errors.status && (
                      <p className="error-message">{errors?.status?.message}</p>
                    )}
                  </div>
                  <div className="form-group half">
                    <label>Offer</label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="Enter offer percentage"
                      {...register("offer", {
                        validate: (value) => {
                          if (!value || value.trim() === "") {
                            return true;
                          }
                          if (isNaN(value)) {
                            return "Enter a valid number";
                          }
                          const num = Number(value);
                          if (num < 10 || num > 90) {
                            return "Offer must be between 10 and 90";
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.offer && (
                      <p className="error-message">{errors?.offer?.message}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Offer Expiry Date</label>
                  <input
  type="date"
  className="aep-input"
  min={new Date().toISOString().split("T")[0]}
  onKeyDown={(e) => e.preventDefault()} // 👈 ഇത് വഴി കീബോർഡ് ടൈപ്പിംഗ് പൂർണ്ണമായി ബ്ലോക്ക് ചെയ്യാം
  {...register("offerExpiry", {
    validate: (value, formValues) => {
      const offer = formValues.offer;

      if (offer && Number(offer) > 0) {
        if (!value) {
          return "Select an Offer Expiry date";
        }
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          return "Expiry date cannot be in the past";
        }
      }
      return true;
    },
  })}
/>
  {errors.offerExpiry && (
    <p className="error-message">{errors?.offerExpiry?.message}</p>
  )}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Add Brand
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT BRAND MODAL */}
        {isEditModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsEditModalOpen(false)}
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Brand</h3>
                <p>Update brand details</p>
              </div>
                            {newError && <p className="form-error">{newError}</p>}

              <form onSubmit={handleSubmit(editBrand)}>
                <input type="hidden" {...register("_id")} />
                <div className="form-group">
                  <label>Brand Name *</label>
                  <input
                    type="text"
                    {...register("name", {
                      required: "Name is required",
                      validate: {
                        minLetters: (value) =>
                          (value.match(/[a-zA-Z]/g) || []).length >= 2 ||
                          "Name must contain at least 2 characters",
                        onlyLetters: (value) =>
                          /^[a-zA-Z0-9 ]+$/.test(value) ||
                          "Name must contain only letters, numbers, and spaces",
                      },
                    })}
                  />
                    {errors.name && (
                      <p className="error-message">{errors?.name?.message}</p>
                    )}
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea {...register("description")}></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label>Status</label>
                    <select
                      {...register("status", {
                        required: "Status is required",
                      })}
                    >
                      <option value="Active">Active</option>
                      <option value="InActive">InActive</option>
                    </select>
                  </div>
                  <div className="form-group half">
                    <label>Offer</label>
                    <input
    type="text"
    maxLength={2}
    placeholder="Enter offer percentage"
    {...register("offer", {
      validate: (value) => {
        if (value === undefined || value === null || String(value).trim() === "") {
          return true;
        }
        const trimmed = String(value).trim();
        if (isNaN(trimmed)) {
          return "Enter a valid number";
        }
        const num = Number(trimmed);
        if (num < 10 || num > 90) {
          return "Offer must be between 10 and 90";
        }
        return true;
      },
    })}
  />
  {errors.offer && (
    <p className="error-message">{errors?.offer?.message}</p>
  )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Offer Expiry Date</label>
               <input
  type="date"
  className="aep-input"
  min={new Date().toISOString().split("T")[0]}
  onKeyDown={(e) => e.preventDefault()} 
  {...register("offerExpiry", {
    validate: (value, formValues) => {
      const offer = formValues.offer;

      if (offer && Number(offer) > 0) {
        if (!value) {
          return "Select an Offer Expiry date";
        }
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          return "Expiry date cannot be in the past";
        }
      }
      return true;
    },
  })}
/>
  {errors.offerExpiry && (
    <p className="error-message">{errors?.offerExpiry?.message}</p>
  )}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Update Brand
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Page Admin Footer */}
        <div className="page-admin-footer">
          <p>© 2024 Urban Sole Admin Panel. Internal Use Only.</p>
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="delete-icon">!</div>
            <h2>REMOVE BRAND?</h2>
            <p>Are you sure you want to delete this brand?</p>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setDeleteId(null)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={deleteBrand}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>


      )}

    </>
  );
};

export default BrandManagement;