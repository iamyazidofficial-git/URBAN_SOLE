import React, { useState, useEffect } from 'react';
import './CouponManagement.css';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../../../utils/axiosInstance';
import AdminSidebar from "../../../partials/AdminSidebar/AdminSidebar";

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [deleteCoupon, setDeleteCoupon] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const addForm = useForm({
    defaultValues: {
      name: '',
      code: '',
      expiryDate: '',
      usageCount: '',
      minCart: '',
      maxDiscount: '',
      discountType: 'Percentage',
      discountValue: ''
    }
  });

  const editForm = useForm({
    defaultValues: {
      name: '',
      code: '',
      expiryDate: '',
      usageCount: '',
      minCart: '',
      maxDiscount: '',
      discountType: 'Percentage',
      discountValue: ''
    }
  });

  const addDiscountType = addForm.watch("discountType");
  const addMinCart = addForm.watch("minCart");

  const editDiscountType = editForm.watch("discountType");
  const editMinCart = editForm.watch("minCart");

  const fetchCoupons = async () => {
    try {
      const response = await axiosInstance.get("/admin/coupon/getCoupon");
      if (response?.data?.success) {
        setCoupons(response.data?.data || []);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch coupons");
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const onAddSubmit = async (data) => {
    try {
      const response = await axiosInstance.post("/admin/coupon/addCoupon", {
        name: data.name,
        code: data.code,
        expiryDate: data.expiryDate,
        usageCount: data.usageCount,
        minCart: data.minCart,
        maxDiscount: data.discountType === 'Percentage' ? data.maxDiscount : "",
        discountType: data.discountType,
        discountValue: data.discountValue
      });

      if (response?.data?.success) {
        toast.success(response.data?.message || "Coupon added successfully");
        addForm.reset({
          name: '',
          code: '',
          expiryDate: '',
          usageCount: '',
          minCart: '',
          maxDiscount: '',
          discountType: 'Percentage',
          discountValue: ''
        });
        fetchCoupons();
      } else {
        toast.error(response?.data?.message || "Failed to add coupon");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add coupon");
    }
  };

  const onAddError = (errors) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && errors[firstKey]?.message) {
      toast.error(errors[firstKey].message);
    }
  };

  const handleCancelAdd = () => {
    addForm.reset({
      name: '',
      code: '',
      expiryDate: '',
      usageCount: '',
      minCart: '',
      maxDiscount: '',
      discountType: 'Percentage',
      discountValue: ''
    });
  };

  const handleEditClick = (coupon) => {
    setEditingCoupon(coupon);
    editForm.reset({
      name: coupon.name || '',
      code: coupon.code || '',
      expiryDate: coupon.expiryDate
        ? new Date(coupon.expiryDate).toISOString().split("T")[0]
        : '',
      usageCount: coupon.usageCount ?? '',
      minCart: coupon.minCart ?? '',
      maxDiscount: coupon.maxDiscount ?? '',
      discountType: coupon.discountType || 'Percentage',
      discountValue: coupon.discountValue ?? ''
    });
    setIsEditModalOpen(true);
  };

  const onEditSubmit = async (data) => {
    if (!editingCoupon?._id) return;
    try {
      const response = await axiosInstance.put(`/admin/coupon/editCoupon/${editingCoupon._id}`, {
        name: data.name,
        code: data.code,
        expiryDate: data.expiryDate,
        usageCount: data.usageCount,
        minCart: data.minCart,
        maxDiscount: data.discountType === 'Percentage' ? data.maxDiscount : "",
        discountType: data.discountType,
        discountValue: data.discountValue
      });

      if (response?.data?.success) {
        toast.success(response.data?.message || "Coupon updated successfully");
        setIsEditModalOpen(false);
        setEditingCoupon(null);
        editForm.reset();
        fetchCoupons();
      } else {
        toast.error(response?.data?.message || "Failed to update coupon");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update coupon");
    }
  };

  const onEditError = (errors) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && errors[firstKey]?.message) {
      toast.error(errors[firstKey].message);
    }
  };

  const handleCancelEdit = () => {
    editForm.reset();
    setIsEditModalOpen(false);
    setEditingCoupon(null);
  };

  const handleToggleStatus = async (couponId) => {
    try {
      const response = await axiosInstance.patch(`/admin/coupon/toggleStatus/${couponId}`);
      if (response?.data?.success) {
        toast.success(response.data.message || "Coupon status updated successfully");
        fetchCoupons();
      } else {
        toast.error(response?.data?.message || "Failed to update coupon status");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update coupon status");
    }
  };

  const handleDelete = async () => {
    if (!deleteCoupon?._id) return;
    try {
      const response = await axiosInstance.delete(`/admin/coupon/deleteCoupon/${deleteCoupon._id}`);
      if (response?.data?.success) {
        toast.success(response.data.message || "Coupon deleted successfully");
        fetchCoupons();
      } else {
        toast.error(response?.data?.message || "Failed to delete coupon");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete coupon");
    } finally {
      setDeleteCoupon(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteCoupon(null);
  };

  return (
    <>
      <AdminSidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="coupon-page-container">
        {/* Header Section */}
        <div className="coupon-header">
          <h1 className="coupon-title">COUPON MANAGEMENT</h1>
          <p className="coupon-subtitle">Configure active promotional codes and discounts.</p>
        </div>

        {/* Generate New Code Card */}
        <div className="card generate-card">
          <form onSubmit={addForm.handleSubmit(onAddSubmit, onAddError)}>
            <div className="card-section-title">GENERATE NEW CODE</div>
            <div className="form-grid">
              <div className="form-group">
                <label>COUPON NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Winter Sale"
                  {...addForm.register("name", {
                    required: "Name is required",
                    pattern: {
                      value: /^[a-zA-Z0-9\s]+$/,
                      message: "Only letters, numbers, and spaces are allowed"
                    },
                    validate: {
                      minLengthWithoutSpaces: (value) =>
                        value.replace(/\s/g, '').length >= 4 || "Name must be at least 4 characters",
                      minLetters: (value) =>
                        (value.match(/[a-zA-Z]/g) || []).length >= 2 || "Must contain at least 2 letters"
                    }
                  })}
                />
                {addForm.formState.errors.name && (
                  <span className="error-message">{addForm.formState.errors.name.message}</span>
                )}
              </div>

              <div className="form-group">
                <label>COUPON CODE</label>
                <input
                  type="text"
                  maxLength={30}
                  placeholder="E.G. SNOW2024"
                  {...addForm.register("code", {
                    required: "Code is required",
                    minLength: {
                      value: 8,
                      message: "Code must be at least 8 characters"
                    },
                    pattern: {
                      value: /^(?=(?:.*[A-Za-z]){4})\S+$/,
                      message: "Code must contain at least 4 letters and no spaces"
                    }
                  })}
                />
                {addForm.formState.errors.code && (
                  <span className="error-message">{addForm.formState.errors.code.message}</span>
                )}
              </div>

              <div className="form-group">
                <label>EXPIRY DATE</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  onKeyDown={(e) => e.preventDefault()}
                  {...addForm.register("expiryDate", {
                    required: "Expiry date is required",
                    validate: {
                      notPast: (value) => {
                        const today = new Date().toISOString().split("T")[0];
                        return value >= today || "Past dates are not allowed";
                      }
                    }
                  })}
                />
                {addForm.formState.errors.expiryDate && (
                  <span className="error-message">{addForm.formState.errors.expiryDate.message}</span>
                )}
              </div>

              <div className="form-group">
                <label>USAGE COUNT</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 100"
                  {...addForm.register("usageCount", {
                    required: "Usage count is required",
                    pattern: {
                      value: /^[0-9]+$/,
                      message: "Only numbers are allowed"
                    },
                    validate: (val) => {
                      const num = Number(val);
                      if (num < 10) return "Usage count must be at least 10";
                      if (num > 10000) return "Usage count must be below 10000";
                      return true;
                    }
                  })}
                />
                {addForm.formState.errors.usageCount && (
                  <span className="error-message">{addForm.formState.errors.usageCount.message}</span>
                )}
              </div>

              <div className="form-group">
                <label>MIN CART VALUE</label>
                <input
                  type="text"
                  placeholder="0.00"
                  maxLength={8}
                  {...addForm.register("minCart", {
                    required: "Min cart value is required",
                    pattern: {
                      value: /^[0-9]+$/,
                      message: "Only numbers are allowed"
                    },
                    validate: (val) => {
                      const num = Number(val);
                      if (num < 10) return "Min cart value must be at least 10";
                      return true;
                    }
                  })}
                />
                {addForm.formState.errors.minCart && (
                  <span className="error-message">{addForm.formState.errors.minCart.message}</span>
                )}
              </div>

              {/* Dynamic Discount Type Fields */}
              <div className="form-group">
                <label>DISCOUNT TYPE</label>
                <select {...addForm.register("discountType")}>
                  <option value="Percentage">Percentage</option>
                  <option value="Flat">Flat Amount</option>
                </select>
              </div>

              <div className="form-group">
                <label>{addDiscountType === 'Percentage' ? 'PERCENTAGE (%)' : 'FLAT AMOUNT (₹)'}</label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder={addDiscountType === 'Percentage' ? 'e.g. 20' : 'e.g. 100'}
                  {...addForm.register("discountValue", {
                    required: "Discount value is required",
                    maxLength: {
                      value: 5,
                      message: "Cannot exceed 5 digits"
                    },
                    pattern: {
                      value: /^[0-9]+$/,
                      message: "Only numbers are allowed"
                    },
                    validate: (value) => {
                      const num = Number(value);
                      if (num < 10) return "Value must be at least 10";
                      if (addDiscountType === 'Percentage' && num > 90) {
                        return "Percentage cannot exceed 90";
                      }
                      if (addDiscountType === 'Flat') {
                        if (num > 10000) return "Flat discount cannot exceed 10000";
                        const minCartVal = Number(addMinCart);
                        if (minCartVal && num >= minCartVal) {
                          return "Flat discount must be less than minimum cart value";
                        }
                      }
                      return true;
                    }
                  })}
                />
                {addForm.formState.errors.discountValue && (
                  <span className="error-message">{addForm.formState.errors.discountValue.message}</span>
                )}
              </div>

              {/* Max discount amount only appears if discount type is Percentage */}
              {addDiscountType === 'Percentage' && (
                <div className="form-group">
                  <label>MAXIMUM DISCOUNT AMOUNT</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="e.g. 500"
                    {...addForm.register("maxDiscount", {
                      required: "Maximum discount amount is required",
                      maxLength: {
                        value: 5,
                        message: "Cannot exceed 5 digits"
                      },
                      pattern: {
                        value: /^[0-9]+$/,
                        message: "Only numbers are allowed"
                      },
                      validate: (value) => {
                        const num = Number(value);
                        if (num < 10) return "Value must be at least 10";
                        if (num > 10000) return "Max discount cannot exceed 10000";
                        const minCartVal = Number(addMinCart);
                        if (minCartVal && num > minCartVal) {
                          return "Max discount cannot exceed min cart value";
                        }
                        return true;
                      }
                    })}
                  />
                  {addForm.formState.errors.maxDiscount && (
                    <span className="error-message">{addForm.formState.errors.maxDiscount.message}</span>
                  )}
                </div>
              )}
            </div>

            <div className="button-container" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancelAdd}
              >
                CLEAR
              </button>
              <button className="btn-black" type="submit">
                ADD COUPON
              </button>
            </div>
          </form>
        </div>

        {/* Active Directory Table Card */}
        <div className="card table-card">
          <div className="table-header-row">
            <span className="table-section-title">ACTIVE DIRECTORY</span>
            <span className="table-count">Showing {coupons?.length || 0} coupons</span>
          </div>

          <table className="coupon-table">
            <thead>
              <tr>
                <th>CODE</th>
                <th>NAME</th>
                <th>DISCOUNT</th>
                <th>MIN CART</th>
                <th>EXPIRY DATE</th>
                <th>TYPE</th>
                <th>STATUS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {coupons && coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <tr key={coupon._id} className={coupon.status !== 'Active' ? 'row-inactive' : ''}>
                    <td className="font-bold">{coupon.code}</td>
                    <td>{coupon.name}</td>
                    <td>
                      {coupon.discountType === 'Percentage'
                        ? `${coupon.discountValue}% (Max ₹${coupon.maxDiscount || 'N/A'})`
                        : `₹${coupon.discountValue}`}
                    </td>
                    <td>₹{coupon.minCart}</td>
                    <td>
                      {coupon.expiryDate
                        ? new Date(coupon.expiryDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>{coupon.discountType}</td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={coupon.status === "Active"}
                          onChange={() => handleToggleStatus(coupon._id)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td className="text-right action-icons">
                      <button onClick={() => handleEditClick(coupon)} className="icon-btn" title="Edit">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button onClick={() => setDeleteCoupon(coupon)} className="icon-btn" title="Delete">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                    No coupons found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer text */}
        <div className="page-footer">
          © 2024 Urban Sole Admin Panel. Internal Use Only.
        </div>

        {/* Edit Coupon Modal */}
        {isEditModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <form onSubmit={editForm.handleSubmit(onEditSubmit, onEditError)} className="card generate-card" style={{ margin: 0, padding: 0, border: 'none', boxShadow: 'none' }}>
                <div className="modal-header">
                  <div>
                    <h2>EDIT COUPON</h2>
                    <p>Update coupon details and discount settings</p>
                  </div>
                  <button
                    type="button"
                    className="close-modal-btn"
                    onClick={handleCancelEdit}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="modal-form-grid">
                  <div className="form-group">
                    <label>COUPON NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. Winter Sale"
                      {...editForm.register("name", {
                        required: "Name is required",
                        pattern: {
                          value: /^[a-zA-Z0-9\s]+$/,
                          message: "Only letters, numbers, and spaces are allowed"
                        },
                        validate: {
                          minLengthWithoutSpaces: (value) =>
                            value.replace(/\s/g, '').length >= 4 || "Name must be at least 4 characters",
                          minLetters: (value) =>
                            (value.match(/[a-zA-Z]/g) || []).length >= 2 || "Must contain at least 2 letters"
                        }
                      })}
                    />
                    {editForm.formState.errors.name && (
                      <span className="error-message">{editForm.formState.errors.name.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>COUPON CODE</label>
                    <input
                      type="text"
                      maxLength={30}
                      placeholder="E.G. SNOW2024"
                      {...editForm.register("code", {
                        required: "Code is required",
                        minLength: {
                          value: 8,
                          message: "Code must be at least 8 characters"
                        },
                        pattern: {
                          value: /^(?=(?:.*[A-Za-z]){4})\S+$/,
                          message: "Code must contain at least 4 letters and no spaces"
                        }
                      })}
                    />
                    {editForm.formState.errors.code && (
                      <span className="error-message">{editForm.formState.errors.code.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>EXPIRY DATE</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      onKeyDown={(e) => e.preventDefault()}
                      {...editForm.register("expiryDate", {
                        required: "Expiry date is required",
                        validate: {
                          notPast: (value) => {
                            const today = new Date().toISOString().split("T")[0];
                            return value >= today || "Past dates are not allowed";
                          }
                        }
                      })}
                    />
                    {editForm.formState.errors.expiryDate && (
                      <span className="error-message">{editForm.formState.errors.expiryDate.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>USAGE COUNT</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 100"
                      {...editForm.register("usageCount", {
                        required: "Usage count is required",
                        pattern: {
                          value: /^[0-9]+$/,
                          message: "Only numbers are allowed"
                        },
                        validate: (val) => {
                          const num = Number(val);
                          if (num < 10) return "Usage count must be at least 10";
                          if (num > 10000) return "Usage count must be below 10000";
                          return true;
                        }
                      })}
                    />
                    {editForm.formState.errors.usageCount && (
                      <span className="error-message">{editForm.formState.errors.usageCount.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>MINIMUM CART VALUE</label>
                    <input
                      type="text"
                      placeholder="0.00"
                      maxLength={8}
                      {...editForm.register("minCart", {
                        required: "Min cart value is required",
                        pattern: {
                          value: /^[0-9]+$/,
                          message: "Only numbers are allowed"
                        },
                        validate: (val) => {
                          const num = Number(val);
                          if (num < 10) return "Min cart value must be at least 10";
                          return true;
                        }
                      })}
                    />
                    {editForm.formState.errors.minCart && (
                      <span className="error-message">{editForm.formState.errors.minCart.message}</span>
                    )}
                  </div>

                  {/* Modal Dynamic Discount Type */}
                  <div className="form-group">
                    <label>DISCOUNT TYPE</label>
                    <select {...editForm.register("discountType")}>
                      <option value="Percentage">Percentage</option>
                      <option value="Flat">Flat Amount</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{editDiscountType === 'Percentage' ? 'PERCENTAGE (%)' : 'FLAT AMOUNT (₹)'}</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder={editDiscountType === 'Percentage' ? 'e.g. 20' : 'e.g. 100'}
                      {...editForm.register("discountValue", {
                        required: "Discount value is required",
                        maxLength: {
                          value: 5,
                          message: "Cannot exceed 5 digits"
                        },
                        pattern: {
                          value: /^[0-9]+$/,
                          message: "Only numbers are allowed"
                        },
                        validate: (value) => {
                          const num = Number(value);
                          if (num < 10) return "Value must be at least 10";
                          if (editDiscountType === 'Percentage' && num > 90) {
                            return "Percentage cannot exceed 90";
                          }
                          if (editDiscountType === 'Flat') {
                            if (num > 10000) return "Flat discount cannot exceed 10000";
                            const minCartVal = Number(editMinCart);
                            if (minCartVal && num >= minCartVal) {
                              return "Flat discount must be less than minimum cart value";
                            }
                          }
                          return true;
                        }
                      })}
                    />
                    {editForm.formState.errors.discountValue && (
                      <span className="error-message">{editForm.formState.errors.discountValue.message}</span>
                    )}
                  </div>

                  {editDiscountType === 'Percentage' && (
                    <div className="form-group">
                      <label>MAXIMUM DISCOUNT AMOUNT</label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="e.g. 500"
                        {...editForm.register("maxDiscount", {
                          required: "Maximum discount amount is required",
                          maxLength: {
                            value: 5,
                            message: "Cannot exceed 5 digits"
                          },
                          pattern: {
                            value: /^[0-9]+$/,
                            message: "Only numbers are allowed"
                          },
                          validate: (value) => {
                            const num = Number(value);
                            if (num < 10) return "Value must be at least 10";
                            if (num > 10000) return "Max discount cannot exceed 10000";
                            const minCartVal = Number(editMinCart);
                            if (minCartVal && num > minCartVal) {
                              return "Max discount cannot exceed min cart value";
                            }
                            return true;
                          }
                        })}
                      />
                      {editForm.formState.errors.maxDiscount && (
                        <span className="error-message">{editForm.formState.errors.maxDiscount.message}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCancelEdit}
                  >
                    CANCEL
                  </button>
                  <button className="btn-black" type="submit">
                    SAVE CHANGES
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Remove Confirmation Modal */}
        {deleteCoupon !== null && (
          <div
            className="aep-modal-overlay"
            onClick={handleCancelDelete}
          >
            <div
              className="aep-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aep-modal-header">
                <h3 className="aep-modal-title">REMOVE COUPON</h3>
                <button
                  type="button"
                  className="aep-icon-btn"
                  onClick={handleCancelDelete}
                >
                  ✕
                </button>
              </div>

              <div className="aep-modal-body">
                <p>
                  Are you sure you want to remove{" "}
                  <strong>{deleteCoupon?.name} ({deleteCoupon?.code})</strong>?
                </p>
              </div>

              <div className="aep-modal-footer">
                <button
                  type="button"
                  className="aep-btn-secondary"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="aep-save-btn"
                  onClick={handleDelete}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
