import { useState, useEffect } from "react";
import "./Checkout.css";
import Navbar from "../../../partials/navbar/navbar";
import UserFooter from "../../../partials/UserFooter/UserFooter";
import axiosInstance from "../../../utils/axiosInstance";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";

// ==========================================
// ADDRESS FORM FIELDS COMPONENT
// ==========================================
const AddressFormFields = ({
  register,
  errors,
  watch,
  setValue,
  places = [],
  pinLoading,
  pinError,
}) => {
  const selectedPlace = watch("city");

  useEffect(() => {
    const place = places.find((item) => item.Name === selectedPlace);
    if (place) {
      setValue("state", place.State || "", { shouldValidate: true });
    }
  }, [selectedPlace, places, setValue]);

  return (
    <>
      <div className="form-grid">
        {/* FULL NAME */}
        <div className="address-field">
          <input
            type="text"
            placeholder="Full Name"
            {...register("fullName", {
              required: "Name is required",
              validate: {
                minLetters: (value) =>
                  (value.match(/[a-zA-Z]/g) || []).length >= 4 ||
                  "Name must contain at least 4 characters",
                onlyLetters: (value) =>
                  /^[a-zA-Z ]+$/.test(value) ||
                  "Name must contain only letters",
              },
            })}
          />
          {errors.fullName && (
            <p className="error-message">{errors.fullName.message}</p>
          )}
        </div>

        {/* PHONE NUMBER */}
        <div className="address-field">
          <input
            type="tel"
            placeholder="Phone Number"
            maxLength={10}
            {...register("phoneNumber", {
              required: "Phone number is required",
              validate: {
                validFormat: (value) => {
                  const cleanNum = value
                    .replace(/[\s-]/g, "")
                    .replace(/^(?:\+91|91|0)/, "");
                  if (!/^\d{10}$/.test(cleanNum)) {
                    return "Phone number must be exactly 10 digits";
                  }
                  if (!/^[6-9]/.test(cleanNum)) {
                    return "Indian mobile numbers must start with 6, 7, 8, or 9";
                  }
                  if (/^(\d)\1{9}$/.test(cleanNum)) {
                    return "Enter a valid phone number";
                  }
                  if (cleanNum === "9876543210" || cleanNum === "0123456789") {
                    return "Enter a valid phone number";
                  }
                  return true;
                },
              },
            })}
          />
          {errors.phoneNumber && (
            <p className="error">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* POSTAL CODE */}
        <div className="address-field">
          <input
            type="text"
            placeholder="Postal Code (6 Digits)"
            maxLength={6}
            {...register("postalCode", {
              required: "Postal code is required",
              pattern: {
                value: /^[1-9][0-9]{5}$/,
                message: "Enter a valid 6-digit PIN code",
              },
            })}
          />
          {errors.postalCode && (
            <p className="error-message">{errors.postalCode.message}</p>
          )}
          {pinError && <p className="error-message">{pinError}</p>}
        </div>

        {/* PLACE / POST OFFICE (CITY) */}
        <div className="address-field">
          <select
            {...register("city", {
              required: "Please select a place/city",
            })}
            disabled={pinLoading || places.length === 0}
          >
            <option value="">
              {pinLoading
                ? "Verifying PIN code..."
                : "Select Place / Post Office"}
            </option>
            {places.map((place, index) => (
              <option key={`${place.Name}-${index}`} value={place.Name}>
                {place.Name} ({place.District})
              </option>
            ))}
          </select>
          {errors.city && (
            <p className="error-message">{errors.city.message}</p>
          )}
        </div>

        {/* STATE - AUTO FILLED */}
        <div className="address-field">
          <input
            type="text"
            placeholder="State"
            readOnly
            {...register("state", {
              required: "State is required",
            })}
          />
          {errors.state && (
            <p className="error-message">{errors.state.message}</p>
          )}
        </div>

        {/* STREET ADDRESS */}
        <div className="address-field">
          <input
            type="text"
            placeholder="Street Address"
            maxLength={50}
            {...register("streetAddress")}
          />
        </div>

        {/* APARTMENT */}
        <div className="address-field">
          <input
            type="text"
            placeholder="Apartment / Building (Optional)"
            maxLength={12}
            {...register("apartment")}
          />
        </div>

        {/* ADDRESS TYPE */}
        <div className="address-field">
          <select {...register("addressType")}>
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* DEFAULT ADDRESS */}
      <label className="default-checkbox">
        <input type="checkbox" {...register("isDefault")} />
        Set as default address
      </label>
    </>
  );
};

// ==========================================
// MAIN CHECKOUT COMPONENT
// ==========================================
export default function Checkout() {
  const [orderData, setOrderData] = useState("");
  const [allAddresses, setAllAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [couponModal, setCouponModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState("");
  
  const location = useLocation();
  const currentData = location?.state?.data;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [newError, setNewError] = useState("");
  const [places, setPlaces] = useState([]);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [paymentMethod,selectedPaymentMethod]=useState("cashondelivery")
  const [orderConfirmModal,setOrderConfirmModal]=useState(false)
  
  const token = localStorage.getItem("token");
  const navigate=useNavigate()

  // React Hook Form Setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      streetAddress: "",
      apartment: "",
      city: "",
      state: "",
      postalCode: "",
      addressType: "home",
      isDefault: false,
    },
  });

  const postalCode = watch("postalCode");

  useEffect(() => {
    let isMounted = true;
    const lookupPincode = async () => {
      setPlaces([]);
      setPinError("");

      if (!/^[1-9][0-9]{5}$/.test(postalCode || "")) {
        setValue("city", "");
        setValue("state", "");
        return;
      }

      setPinLoading(true);
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${postalCode}`,
        );
        const data = await response.json();

        if (!isMounted) return;

        if (
          Array.isArray(data) &&
          data[0]?.Status === "Success" &&
          data[0]?.PostOffice?.length > 0
        ) {
          const postOffices = data[0].PostOffice;
          setPlaces(postOffices);
          setValue("city", postOffices[0].Name, { shouldValidate: true });
          setValue("state", postOffices[0].State, { shouldValidate: true });
        } else {
          setPinError("Invalid PIN code. No details found.");
          setValue("city", "");
          setValue("state", "");
        }
      } catch (error) {
        if (isMounted) {
          setPinError("Failed to fetch PIN details. Please try again.");
          setValue("city", "");
          setValue("state", "");
        }
      } finally {
        if (isMounted) setPinLoading(false);
      }
    };

    lookupPincode();
    return () => {
      isMounted = false;
    };
  }, [postalCode, setValue]);

  const resetAddressForm = () => {
    reset({
      fullName: "",
      phoneNumber: "",
      streetAddress: "",
      apartment: "",
      city: "",
      state: "",
      postalCode: "",
      addressType: "home",
      isDefault: false,
    });
    setPlaces([]);
    setPinError("");
    setNewError("");
  };

  const getAddresses = async () => {
    try {
      const response = await axiosInstance.get("/user/address/getAddresses");
      if (response.data?.success == true) {
        const fetchedList = response.data?.data || [];
        setAllAddresses(fetchedList);

        // Automatically select default address if not set
        if (!selectedAddress && fetchedList.length > 0) {
          const defaultAdd = fetchedList.find((addr) => addr.isDefault) || fetchedList[0];
          setSelectedAddress(defaultAdd);
        }
      }
    } catch (error) {
      console.error("GET ADDRESS ERROR:", error);
    }
  };

  const handleAddAddress = async (data) => {
    setNewError("");
    setSaving(true);
    try {
      const response = await axiosInstance.post(
        "/user/address/addAddress",
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data.success) {
        setShowAddModal(false);
        resetAddressForm();
        await getAddresses();
      }
    } catch (error) {
      setNewError(error.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = async (address) => {
    setSelectedAddress(address);
    setNewError("");
    reset({
      fullName: address.fullName || "",
      phoneNumber: address.phoneNumber || "",
      streetAddress: address.streetAddress || "",
      apartment: address.apartment || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      addressType: address.addressType || "home",
      isDefault: Boolean(address.isDefault),
    });

    if (address.postalCode && /^[1-9][0-9]{5}$/.test(address.postalCode)) {
      setPinLoading(true);
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${address.postalCode}`,
        );
        const data = await response.json();
        if (
          Array.isArray(data) &&
          data[0]?.Status === "Success" &&
          data[0]?.PostOffice?.length > 0
        ) {
          setPlaces(data[0].PostOffice);
        } else {
          setPlaces([]);
        }
      } catch (error) {
        setPlaces([]);
      } finally {
        setPinLoading(false);
      }
    }
    setShowEditModal(true);
  };

  const handleEditAddress = async (data) => {
    if (!selectedAddress) return;
    setNewError("");
    setSaving(true);
    try {
      const response = await axiosInstance.put(
        `/user/address/editAddress/${selectedAddress._id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setShowEditModal(false);
        setSelectedAddress(null);
        resetAddressForm();
        await getAddresses();
      }
    } catch (error) {
      setNewError(error.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

 
  const getCheckout = async () => {
    try {
      const response = await axiosInstance.get(`/user/checkout/fetchCheckout`, {
        params: {
          productData: JSON.stringify(currentData),
          selectedCoupon: selectedCoupon,
        },
      });
      if (response.data?.success == true) {
        setOrderData(response.data?.data);
        setCoupons(response?.data?.coupons);
      }
    } catch (error) {
      console.error("CHECKOUT FETCH ERROR:", error);
    }
  };

  const placeOrder=async()=>{
    try{
      const response=await axiosInstance.post("/user/checkout/placeOrder",{productData:orderData.items,address:selectedAddress._id,payment:paymentMethod,coupon:selectedCoupon||""})
      if(response?.data?.success==true){
        navigate("/user/checkout/orderSuccess",{replace:true,state:response?.data?.data})
      }
    }
    catch(error){
     toast.error(error?.response?.data?.message||"Something went wrong");
      console.log(error?.response.data.message)
    }finally{
      setOrderConfirmModal(false)
    }
  }

  useEffect(() => {
    getCheckout();
    getAddresses();
  }, [selectedCoupon]);

  return (
    <div className="checkout-body">
      <Navbar />

      {/* Main Content */}
      <main className="checkout-main">
        {/* Step Indicator */}
        <div className="step-indicator-wrapper">
          <div className="step-line"></div>
          <div className="step-item">
            <div className="step-circle active">1</div>
            <span className="step-label active">Delivery</span>
          </div>
          <div className="step-item">
            <div className="step-circle">2</div>
            <span className="step-label">Payment</span>
          </div>
          <div className="step-item">
            <div className="step-circle">3</div>
            <span className="step-label center-text">Order Confirmed</span>
          </div>
        </div>

        {/* Grid Container */}
        <div className="checkout-grid">
          {/* Left Sections */}
          <div className="left-sections-group">
            {/* Delivery Address */}
            <section className="section-block">
              <h2 className="section-heading">Delivery Address</h2>

              <div className="address-grid">
                {allAddresses?.map((address) => (
                  <label key={address._id} className="address-card">
                    <input
                      type="radio"
                      name="selectedAddress"
                      className="address-radio"
                      checked={selectedAddress?._id === address._id}
                      onChange={() => setSelectedAddress(address)}
                    />
<div className="address-header-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div className="address-name">{address.fullName}</div>
        <span className="address-type" style={{marginBottom:"6px"}}>{address.addressType}</span>
        {address.isDefault && (
          <span className="badge" style={{ fontSize: "8px",marginLeft:"2px",marginBottom:"6px", padding: "0px 6px", background: "#e0e0e0", borderRadius: "0px", fontWeight: "600" }}>DEFAULT</span>
        )}
      </div>                    <div className="address-details">
                      <p>{address.streetAddress}, {address.apartment}</p>
                      <p>{address.city}, {address.state}</p>
                      <p className="phone-spacing">Phone: {address.phoneNumber}</p>
                    </div>
                    <div className="address-card-actions">
                      <button type="button" onClick={() => openEditModal(address)}>
                        Edit
                      </button>
                    </div>
                  </label>
                ))}

                {/* Add New Address Button Card */}
                <button
                  type="button"
                  className="add-address-btn"
                  onClick={() => {
                    resetAddressForm();
                    setShowAddModal(true);
                  }}
                >
                  <span className="plus-icon">+</span>
                  <span className="add-text">Add New Address</span>
                </button>
              </div>
            </section>

            {/* Your Order */}
            <section className="section-block">
              <h2 className="section-heading">Your Order</h2>
              {orderData?.items?.map((item, idx) => (
                <div className="order-item-box" key={idx}>
                  <img
                    className="order-item-img"
                    src={item.img}
                    alt={item.name}
                  />
                  <div className="order-item-info">
                    <div>
                      <h3 className="item-title">
                        {item.brand} {item.name}
                      </h3>
                      <p className="item-desc">Color: {item.colour}</p>
                      <p className="item-desc">Size: {item.size}</p>
                    </div>
                    <div className="order-item-bottom">
                      <span className="item-qty">Qty: {item.quantity}</span>
<p className="ms-card-price"> ₹{item.offer && item.offer > 0 
                      ? Math.round(item.price - (item.price * item.offer) / 100) 
                      : item.price}
                    </p>                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Payment Method */}
            <section className="section-block">
              <h2 className="section-heading">Payment Method</h2>
              <div className="payment-options-group">
                <label className="payment-card">
                <input className="payment-radio"
                name="payment"
                 type="radio"
                 value="razorpay"
                 checked={paymentMethod === "razorpay"}
                 onChange={(e) => selectedPaymentMethod(e.target.value)}
                />
                  <div>
                    <span className="payment-title">Razor Pay</span>
                    <span className="payment-desc">
                      Pay securely using Razor Pay payment gateway.
                    </span>
                  </div>
                </label>
                <label className="payment-card">
<input className="payment-radio"
                name="payment"
                 type="radio"
                 value="cashondelivery"
                 checked={paymentMethod === "cashondelivery"}
                 onChange={(e) => selectedPaymentMethod(e.target.value)}
                /> 
                   <div>
                    <span className="payment-title">Cash on Delivery</span>
                    <span className="payment-desc">
                      Pay when your order arrives at your doorstep.
                    </span>
                  </div>
                </label>
                <label className="payment-card">
<input className="payment-radio"
                name="payment"
                 type="radio"
                 value="wallet"
                 checked={paymentMethod === "wallet"}
                 onChange={(e) => selectedPaymentMethod(e.target.value)}
                />                  <div>
                    <span className="payment-title">Wallet</span>
                    <span className="payment-desc">
                      Pay using your digital wallet balance.
                    </span>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Right Sidebar - Price Details */}
          <div className="right-sidebar-group">
            <div className="sticky-sidebar">
              <div className="price-details-card">
                <h2 className="price-heading">Price Details</h2>
                <div className="price-rows">
                  <div className="price-row">
                    <span>Sub Total</span>
                    <span>₹{orderData.subTotal}</span>
                  </div>
                  <div className="price-row">
                    <span>GST</span>
                    <span className="price-highlight">
                      {orderData.taxPercentage}%
                    </span>
                  </div>
                  <div className="price-row">
                    <span>Tax</span>
                    <span className="price-highlight">+{orderData.tax}</span>
                  </div>
                  {orderData?.couponDiscount && (
                    <div className="price-row">
                      <span>Coupon Discount</span>
                      <span className="price-highlight">
                        {orderData.couponDiscount}
                      </span>
                    </div>
                  )}
                  <div className="price-row">
                    <span>Shipping Charge</span>
                    <span className="price-highlight">
                      {orderData.shippingCharge == 0
                        ? "FREE"
                        : orderData.shippingCharge}
                    </span>
                  </div>
                </div>

                <div className="price-total-divider">
                  <div className="price-row total-amount-row">
                    <span>Total Amount</span>
                    <span>₹{orderData.totalAmount}</span>
                  </div>
                </div>

                <div className="sidebar-actions">
                  <button
                    className="btn-outline-custom"
                    onClick={() => setCouponModal(true)}
                  >
                    <span className="material-symbols-outlined icon-size">
                      sell
                    </span>
                    Apply Coupon
                  </button>
                  <button className="btn-solid-custom" onClick={()=>setOrderConfirmModal(true)}>Place Order</button>
                </div>
              </div>

              <div className="sidebar-footer-badges">
                <div className="badge-item">
                  <span className="material-symbols-outlined icon-size">
                    verified_user
                  </span>
                  <span>Secure Checkout</span>
                </div>
                <div className="badge-dot"></div>
                <div className="badge-item">
                  <span className="material-symbols-outlined icon-size">
                    local_shipping
                  </span>
                  <span>Secure Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dynamic Coupons List Modal */}
      {couponModal && (
        <div className="coupon-modal-overlay">
          <div className="coupon-modal">
            <div className="coupon-modal-header">
              <div>
                <h2>AVAILABLE COUPONS</h2>
                <p>Apply an available coupon and save more on your order.</p>
              </div>
              <button
                className="coupon-close-btn"
                onClick={() => setCouponModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="coupon-input-box">
              <span className="coupon-input-label">HAVE A CODE?</span>
              <div className="coupon-input-wrapper">
                <input
                  type="text"
                  placeholder="ENTER CODE"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                />
                <button className="coupon-apply-btn">APPLY</button>
              </div>
            </div>

            <div className="coupon-list">
              {coupons?.map((coupon) => {
                const isSelected = selectedCoupon === coupon._id;

                return (
                  (coupon.isApplied === false || isSelected) && (
                    <div
                      className={`coupon-card ${isSelected ? "applied" : ""}`}
                      key={coupon._id}
                    >
                      {isSelected && (
                        <div className="coupon-card-top-row">
                          <span className="coupon-applied-tag">✓ APPLIED</span>
                          <button
                            className="coupon-action-text"
                            onClick={() => setSelectedCoupon("")}
                          >
                            REMOVE
                          </button>
                        </div>
                      )}

                      {coupon.badge && !isSelected && (
                        <span className="coupon-badge-timer">
                          🕒 {coupon.badge}
                        </span>
                      )}

                      <h4 className="coupon-code-title">{coupon.code}</h4>
                      <p className="coupon-discount-desc">
                        {coupon.discountValue || coupon.description}
                      </p>

                      {coupon.subText && (
                        <p className="coupon-subtext">{coupon.subText}</p>
                      )}

                      <div className="coupon-card-footer">
                        {coupon.minOrder && (
                          <span className="coupon-limit">
                            🛒 Min order ₹{coupon.minOrder}
                          </span>
                        )}
                        {coupon.maxDiscount && (
                          <span className="coupon-limit">
                            🏷️ Max discount ₹{coupon.maxDiscount}
                          </span>
                        )}

                        {!isSelected && (
                          <button
                            className="coupon-card-apply-btn"
                            onClick={() => setSelectedCoupon(coupon._id)}
                          >
                            APPLY
                          </button>
                        )}
                      </div>
                    </div>
                  )
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>ADD NEW ADDRESS</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  resetAddressForm();
                }}
              >
                ×
              </button>
            </div>
            {newError && <p className="form-error">{newError}</p>}
            <form onSubmit={handleSubmit(handleAddAddress)}>
              <AddressFormFields
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                places={places}
                pinLoading={pinLoading}
                pinError={pinError}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  disabled={saving}
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddressForm();
                  }}
                >
                  CANCEL
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? "ADDING..." : "ADD ADDRESS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>EDIT ADDRESS</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAddress(null);
                  resetAddressForm();
                }}
              >
                ×
              </button>
            </div>
            {newError && <p className="form-error">{newError}</p>}
            <form onSubmit={handleSubmit(handleEditAddress)}>
              <AddressFormFields
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                places={places}
                pinLoading={pinLoading}
                pinError={pinError}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  disabled={saving}
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAddress(null);
                    resetAddressForm();
                  }}
                >
                  CANCEL
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? "SAVING..." : "SAVE CHANGES"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedAddress && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="delete-icon">!</div>
            <h2>REMOVE ADDRESS?</h2>
            <p>Are you sure you want to remove this address?</p>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAddress(null);
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="save-btn remove-confirm-btn"
                onClick={handleDeleteAddress}
              >
                REMOVE
              </button>
            </div>
          </div>
        </div>
      )}



       {/* DELETE MODAL */}
        {orderConfirmModal&& (
          <div className="modal-overlay">
            <div className="delete-modal">
              <div className="delete-icon">!</div>
              <h2>PLACE ORDER?</h2>
              <p>Are you sure you want to purchase this order?</p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setOrderConfirmModal(false)
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  className="delete-confirm-btn"
                  onClick={placeOrder}
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
}