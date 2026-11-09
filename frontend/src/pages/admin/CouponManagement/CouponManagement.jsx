import React, { useState,useEffect } from 'react';
import './CouponManagement.css';
import { useForm } from 'react-hook-form';
import axiosInstance from '../../../utils/axiosInstance';
import AdminSidebar from "../../../partials/AdminSidebar/AdminSidebar"

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [deleteCoupon,setDeleteCoupon]=useState(null)

  const { register, handleSubmit, reset, watch,formState: { errors }} = useForm({
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

const [newError,setNewError]=useState("")
 const [isEditModalOpen,setIsEditModalOpen]=useState(false)

 const fetchCoupons=async()=>{
    try{
        const response=await axiosInstance.get("/admin/coupon/getCoupon")
        if(response?.data?.success==true){
            console.log("RRR",response.data?.data)
            setCoupons(response?.data?.data)
        }
    }catch(error){
        console.log(error?.response?.data?.message||"Something went wrong")
    }
}

 const handleEditClick=(x)=>{
    console.log("jjj",x.expiryDate)
    setNewError("")
    reset({...x,  expiryDate: x.expiryDate
      ? new Date(x.expiryDate).toISOString().split("T")[0]
      : ""})
    setIsEditModalOpen(true)
 }

 const editCoupon=async (data)=>{
    try{
       const response=await axiosInstance.put(`admin/coupon/editCoupon/${data._id}`,{
             name: data.name,
    code: data.code,
    expiryDate: data.expiryDate,
    usageCount: data.usageCount,
    minCart: data.minCart,
    maxDiscount: data.maxDiscount||"",
    discountType: data.discountType,
    discountValue: data.discountValue
        })
       if(response.data?.success==true){
        setNewError("")
        setIsEditModalOpen(false)
        fetchCoupons()
       }
       else{
        setNewError(response?.data?.message||"Something went wrong")
       }

       console.log("response",response.data)
    }catch(error){
        setNewError(error?.response?.data?.message||"something went wrong")
      console.log(error?.response?.data?.message)
    }finally{
          reset( {name: '',
    code: '',
    expiryDate: '',
    usageCount: '',
    minCart: '',
    maxDiscount: '',
    discountType: 'Percentage', 
    discountValue: ''})
    }
 }

 const handleDelete=async()=>{
    try{
        const response=await axiosInstance.delete(`/admin/coupon/deleteCoupon/${deleteCoupon?._id}`)
        if(response?.data?.success==true){
            fetchCoupons()
        }
    }catch(error){
         console.log(error?.response?.data?.message)
    }finally{
        setDeleteCoupon(null)
    }
 }

 const handleCancelDelete=async()=>{
    console.log("LLL")
    setDeleteCoupon(null)
 }

 



useEffect(()=>{
fetchCoupons()
},[])

const selectedDiscountType=watch("discountType")
  
  const onSubmit=async(data)=>{
    setNewError("")
    try{
        const response=await axiosInstance.post("/admin/coupon/addCoupon",{
             name: data.name,
    code: data.code,
    expiryDate: data.expiryDate,
    usageCount: data.usageCount,
    minCart: data.minCart,
    maxDiscount: data.maxDiscount||"",
    discountType: data.discountType,
    discountValue: data.discountValue
        })

        if(response?.data?.success==true){
            setNewError("")
            fetchCoupons()
        }
    }catch(error){
        setNewError(error.response?.data?.message||"Something went wrong")
    }

  }

  const handleCancel=()=>{
    reset( {name: '',
    code: '',
    expiryDate: '',
    usageCount: '',
    minCart: '',
    maxDiscount: '',
    discountType: 'Percentage', 
    discountValue: ''})
    setNewError("")
    setIsEditModalOpen(false)
  }



  return (
    <>

    <AdminSidebar />

    <div className="coupon-page-container">

      {/* Header Section */}
      <div className="coupon-header">
        <h1 className="coupon-title">COUPON MANAGMENT</h1>
        <p className="coupon-subtitle">Configure active promotional codes and discounts.</p>
      </div>

      {/* Generate New Code Card */}
      <div className="card generate-card">
        <form onSubmit={handleSubmit(onSubmit)} className="card generate-card">
        <div className="card-section-title">GENERATE NEW CODE</div>
        <div className="form-grid">
            {newError && <p className="form-error">{newError}</p>}
          <div className="form-group">
            <label>COUPON NAME</label>
        <input 
  type="text" 
  placeholder="e.g. Winter Sale"
  {...register("name", {
    required: "Name is required",
    pattern: {
      value: /^[a-zA-Z0-9\s]+$/,
      message: "Only letters, numbers, and spaces are allowed"
    },
    validate: {
      minLengthWithoutSpaces: (value) => 
        value.replace(/\s/g, '').length >= 4 || "Name Must be at least 4 characters",
      
      minLetters: (value) => 
        (value.match(/[a-zA-Z]/g) || []).length >= 2 || "Must contain at least 2 letters"
    }
  })}
/>
            {errors.name && (
              <span className="error-message">{errors.name.message}</span>
            )}
          </div>
          <div className="form-group">
            <label>COUPON CODE</label>
           <input
  type="text"
  maxLength={30}
  placeholder="E.G. SNOW20"
  {...register("code", {
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
            {errors.code && (
              <span className="error-message">{errors.code.message}</span>
            )}
          </div>

        <div className="form-group">
  <label>EXPIRY DATE</label>
 <input 
  type="date"
  min={new Date().toISOString().split("T")[0]}
  onKeyDown={(e) => e.preventDefault()}
  {...register("expiryDate", {
    required: "Expiry date is required",
    validate: {
      notPast: (value) => {
        const today = new Date().toISOString().split("T")[0];
        return value >= today || "Past dates are not allowed";
      }
    }
  })}
/>
  {errors.expiryDate && (
              <span className="error-message">{errors.expiryDate.message}</span>
            )}
</div>
          <div className="form-group">
            <label>USAGE COUNT</label>
            <input 
  type="text" 
  maxLength={6}
  placeholder="eg:-100" 
  {...register("usageCount", {
    required: "Usage count is required",
    pattern: {
      value: /^[0-9]+$/,
      message: "Only numbers are allowed"
    }
  })}
/>
{errors.usageCount && (
              <span className="error-message">{errors.usageCount.message}</span>
            )}
          </div>


          <div className="form-group">
            <label>MIN CART VALUE</label>
            <input 
              type="text" 
              placeholder="0.00"
              maxLength={8} 
            {...register("minCart", {
    required: "Min cart value is required",
    pattern: {
      value: /^[0-9]+$/,
      message: "Only numbers are allowed"
    }
  })}
            />
            {errors.minCart && (
              <span className="error-message">{errors.minCart.message}</span>
            )}
          </div>

          {/* Dynamic Discount Type Fields */}
          <div className="form-group">
            <label>Discount Type</label>
            <select 
             
              {...register("discountType")}
            >
              <option value="Percentage">Percentage</option>
              <option value="Flat">Flat Amount</option>
            </select>
          </div>

          <div className="form-group">
            <label>{selectedDiscountType === 'Percentage' ? 'Percentage %' : 'Flat Amount (₹)'}</label>
        <input 
  type="text" 
  maxLength={5}
  placeholder={selectedDiscountType === 'Percentage' ? 'e.g. 20' : 'e.g. 100'} 
  {...register("discountValue", {
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
      
      // Minimum value validation
      if (num < 10) {
        return "Value must be at least 10";
      }

      // Percentage max value validation
      if (selectedDiscountType === 'Percentage' && num > 90) {
        return "Percentage cannot exceed 90";
      }

      return true;
    }
  })}
/>
{errors.discountValue && (
              <span className="error-message">{errors.discountValue.message}</span>
            )}
          </div>

          {/* Max discount amount only appears if discount type is Percentage */}
          {selectedDiscountType === 'Percentage' && (
            <div className="form-group">
              <label>Maximum discount Amount</label>
           <input 
  type="text" 
  maxLength={5}
  placeholder="0.00" 
  {...register("maxDiscount", {
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
      if (num < 10) {
        return "Value must be at least 10";
      }
      return true;
    }
  })}
/>
{errors.maxDiscount && (
              <span className="error-message">{errors.maxDiscount.message}</span>
            )}
            </div>
          )}
        </div>

         <button
            type="button"
            className="cancel-btn"
            onClick={ handleCancel}
          >
            CANCEL
          </button>

        <div className="button-container">
          <button className="btn-black" type='submit'>ADD COUPON</button>
        </div>
        </form>
      </div>

       {/*Active Directory Table Card*/}

      <div className="card table-card">
        <div className="table-header-row">
          <span className="table-section-title">ACTIVE DIRECTORY</span>
          <span className="table-count">Showing {coupons?.length} of 12</span>
        </div>
        
        <table className="coupon-table">
          <thead>
            <tr>
              <th>CODE</th>
              <th>DISCOUNT</th>
              <th>EXPIRY DATE</th>
              <th>TYPE</th>
              <th>STATUS</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {coupons?.map((coupon) => (
              <tr key={coupon.id} className={!coupon.status ? 'row-inactive' : ''}>
                <td className="font-bold">{coupon.code}</td>
                <td>{coupon.discountValue}</td>
                <td>{coupon.expiryDate}</td>
                <td>{coupon.discountType}</td>
                <td>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={coupon.status} 
                      onChange={() => handleToggleStatus(coupon.id)} 
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
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {/* <div className="pagination-container">
          <div className="pagination">
            {[1, 2, 3].map((page) => (
              <button 
                key={page} 
                className={`page-btn ${activePage === page ? 'active' : ''}`}
                onClick={() => setActivePage(page)}
              >
                {page}
              </button>
            ))}
          </div>
        </div> */}
      </div>

      {/* Footer text */}
      <div className="page-footer">
        © 2024 Urban Sole Admin Panel. Internal Use Only.
      </div>

      {/* Edit Coupon Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
        <form onSubmit={handleSubmit(editCoupon)} className="card generate-card">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>EDIT COUPON</h2>
                <p>Update coupon details and discount settings</p>
                {newError && <p className="form-error">{newError}</p>}

              </div>
              <button className="close-modal-btn" onClick={() => setIsEditModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="modal-form-grid">
              <div className="form-group">
                <label>COUPON NAME</label>
                <input 
              type="text" 
              placeholder="e.g. Winter Sale"
               
              {...register("name",{
                required:"Name is required",
                minLength: {
    value: 4,
    message: "Name must be 4 charecters"
  },
                pattern: {
    value: /^[a-zA-Z0-9]+([a-zA-Z0-9\s]*[a-zA-Z0-9])?$/,
    message: "Name can only contain letters and numbers"
  }
              })}
            />
            {errors.name && (
              <span className="error-message">{errors.name.message}</span>
            )}
              </div>


              <div className="form-group">
                <label>EXPIRY DATE</label>
                <input 
    type="date"
    {...register("expiryDate",{
        required:"Expiry date is required "
    })}
  />
  {errors.expiryDate && (
              <span className="error-message">{errors.expiryDate.message}</span>
            )}
              </div>



              <div className="form-group">
                <label>COUPON CODE</label>
                  <input 
              type="text" 
              placeholder="E.G. SNOW20" 
            {...register("code",{
  required: "Code is required",
  minLength: {
    value: 8,
    message: "Name must be 8 charecters"
  },
  pattern: {
    value: /^\S+$/,
    message: "Spaces are not allowed"
  }
})}
            />
            {errors.code && (
              <span className="error-message">{errors.code.message}</span>
            )}
              </div>
              <div className="form-group">
                <label>MINIMUM CART VALUE</label>
                 <input 
              type="text" 
              placeholder="0.00"
              maxLength={8} 
            {...register("minCart", {
    required: "Min cart value is required",
    pattern: {
      value: /^[0-9]+$/,
      message: "Only numbers are allowed"
    }
  })}
            />
            {errors.minCart && (
              <span className="error-message">{errors.minCart.message}</span>
            )}
              </div>

              {/* Modal Dynamic Discount Type */}
              <div className="form-group">
                <label>Discount Type</label>
                <select 
             
              {...register("discountType")}
            >
              <option value="Percentage">Percentage</option>
              <option value="Flat">Flat Amount</option>
            </select>
              </div>

              <div className="form-group">
                <label>{selectedDiscountType === 'Percentage' ? 'Percentage %' : 'Flat Amount (₹)'}</label>
                 <input 
  type="text" 
  placeholder={selectedDiscountType === 'Percentage' ? 'e.g. 20' : 'e.g. 100'} 
  {...register("discountValue", {
    required: "Discount value is required",
    pattern: {
      value: /^[0-9]+$/,
      message: "Only numbers are allowed"
    },
    validate: (value) => {
      if (selectedDiscountType === 'Percentage' && Number(value) > 90) {
        return "Percentage cannot exceed 90";
      }
      return true;
    }
  })}
/>
{errors.discountValue && (
              <span className="error-message">{errors.discountValue.message}</span>
            )}
              </div>

              <div className="form-group">
                <label>USAGE COUNT</label>
                 <input 
  type="number" 
  placeholder="eg:-100" 
  maxLength={4}
  {...register("usageCount", {
    required: "Usage count is required",
    pattern: {
      value: /^[0-9]+$/,
      message: "Only numbers are allowed"
    }
  })}
/>
{errors.usageCount && (
              <span className="error-message">{errors.usageCount.message}</span>
            )}
              </div>

              {selectedDiscountType === 'Percentage' && (
                <div className="form-group">
                  <label>Maximum discount Amount</label>
                 <input 
  type="text" 
  maxLength={5}
  placeholder="0.00" 
  {...register("maxDiscount", {
    required: "Maximum discount amount is required",
    pattern: {
      value: /^[0-9]+$/,
      message: "Only numbers are allowed"
    }
  })}
/>
{errors.maxDiscount && (
              <span className="error-message">{errors.maxDiscount.message}</span>
            )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancel}>CANCEL</button>
              <button className="btn-black" type="submit">SAVE CHANGES</button>
            </div>
          </div>
          </form>
        </div>
      )}


{/* Remove Confirmation Modal */}
{deleteCoupon!==null && (
  <div
    className="aep-modal-overlay"
    onClick={handleDelete}
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
          <strong>
            {deleteCoupon?.name}
          </strong>{" "}
        </p>
      </div>

      <div className="aep-modal-footer">
        <button
          type="button"
          className="aep-btn-secondary"
          onClick={handleDelete}
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