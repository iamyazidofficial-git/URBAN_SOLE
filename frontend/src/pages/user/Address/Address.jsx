//*****************************IMPORTS***********************************/

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axiosInstance from "../../../utils/axiosInstance";
import "./Address.css";
import Navbar from "../../../partials/navbar/navbar";
import Loader from "../../../partials/Loader/Loader";

//*****************************VALIDATER***********************************/

const AddressFormFields = ({register,errors,watch,setValue,places = [],pinLoading,pinError,}) => {
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
            maxLength={10} // Increased to accommodate optional country code/prefixes
            {...register("phoneNumber", {
              required: "Phone number is required",
              validate: {
                validFormat: (value) => {
                  // Normalizes string: removes spaces, hyphens, and leading +91, 91, or 0
                  const cleanNum = value
                    .replace(/[\s-]/g, "")
                    .replace(/^(?:\+91|91|0)/, "");

                  // 1. Must be exactly 10 digits
                  if (!/^\d{10}$/.test(cleanNum)) {
                    return "Phone number must be exactly 10 digits";
                  }

                  // 2. Must start with valid Indian mobile prefix (6, 7, 8, or 9)
                  if (!/^[6-9]/.test(cleanNum)) {
                    return "Indian mobile numbers must start with 6, 7, 8, or 9";
                  }

                  // 3. Block invalid dummy sequences (e.g., 9999999999, 8888888888)
                  if (/^(\d)\1{9}$/.test(cleanNum)) {
                    return "Enter a valid phone number";
                  }

                  // 4. Block sequential invalid patterns (e.g., 9876543210, 1234567890)
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




//*****************************MAIN COMPONENT***********************************/

 function MyAddresses() {

  //-------------------STATES-------------------

  const [addresses, setAddresses] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [selectedAddress, setSelectedAddress] = useState(null)
  const [newError, setNewError] = useState("")
  const [loading, setIsLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [places, setPlaces] = useState([])
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState("")

  const token = localStorage.getItem("token")

  //-------------------USEFORM-------------------

  const {register,handleSubmit,reset,watch,setValue,formState: { errors },} = useForm({
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
  })

  const postalCode = watch("postalCode")

  useEffect(() => {
    let isMounted = true

    const lookupPincode = async () => {
      setPlaces([])
      setPinError("")

      if (!/^[1-9][0-9]{5}$/.test(postalCode || "")) {
        setValue("city", "")
        setValue("state", "")
        return
      }

      setPinLoading(true)


      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${postalCode}`,
        )

       
        const data = await response.json()
        console.log("DDD",data)

        if (!isMounted) return

        if (
          Array.isArray(data) &&
          data[0]?.Status === "Success" &&
          data[0]?.PostOffice?.length > 0
        ) {
          const postOffices = data[0].PostOffice
          setPlaces(postOffices)

          setValue("city", postOffices[0].Name, { shouldValidate: true })
          setValue("state", postOffices[0].State, { shouldValidate: true })
        } else {
          setPinError("Invalid PIN code. No details found.")
          setValue("city", "")
          setValue("state", "")
        }
      } catch (error) {
        if (isMounted) {
          setPinError("Failed to fetch PIN details. Please try again.")
          setValue("city", "")
          setValue("state", "")
        }
      } finally {
        if (isMounted) setPinLoading(false)
      }
    }

    lookupPincode()

    return () => {
      isMounted = false
    }
  }, [postalCode, setValue])


  //-------------------GET ADDRESS-------------------

  const getAddresses = async () => {
    
    try {
      setIsLoading(true)
      const response = await axiosInstance.get("/user/address/getAddresses")
      if (response.data.success) {
        setAddresses(response.data.data)
      }
    } catch (error) {
      console.error("GET ADDRESS ERROR:", error)
    } finally {
      setIsLoading(false)
    }
  }


  //-------------------FETCH CALL-------------------

  useEffect(() => {
    getAddresses()
  }, [])


  //-------------------RESET FUNCTION-------------------

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
    })
    setPlaces([])
    setPinError("")
    setNewError("")
  }


  //-------------------ADDRESS MODAL-------------------

  const openAddModal = () => {
    resetAddressForm()
    setShowAddModal(true)
  }


//-------------------ADD ADDRESS-------------------

  const handleAddAddress = async (data) => {
    setNewError("")
    setSaving(true)
    try {
      const response = await axiosInstance.post(
        "/user/address/addAddress",
        data,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (response.data.success) {
        setShowAddModal(false)
        resetAddressForm()
        await getAddresses()
      }
    } catch (error) {
      setNewError(error.response?.data?.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

    //-------------------EDIT ADDRESS MODAL-------------------

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
          `https://api.postalpincode.in/pincode/${address.postalCode}`
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


  //-------------------EDIT ADDRESS-------------------

  const handleEditAddress = async (data) => {
    if (!selectedAddress) return
    setNewError("")
    setSaving(true)

    try {
      const response = await axiosInstance.put(
        `/user/address/editAddress/${selectedAddress._id}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (response.data.success) {
        setShowEditModal(false)
        setSelectedAddress(null)
        resetAddressForm()
        await getAddresses()
      }
    } catch (error) {
      setNewError(error.response?.data?.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }



  //-------------------DELETE MODAL-------------------

  const openDeleteModal = (address) => {
    setSelectedAddress(address)
    setShowDeleteModal(true)
  }



  //-------------------DELETE ADDRESS-------------------

  const handleDeleteAddress = async () => {
    if (!selectedAddress) return
    try {
      setIsLoading(true)
      const response = await axiosInstance.delete(
        `/user/address/deleteAddress/${selectedAddress._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (response.data.success) {
        setShowDeleteModal(false)
        setSelectedAddress(null)
        await getAddresses()
      }
    } catch (error) {
      console.error("DELETE ADDRESS ERROR:", error)
    } finally {
      setIsLoading(false)
    }
  }

  //-------------------RETURNS-------------------

  return (
    <>
      <Navbar />

      {loading && <Loader />}

      <div className="addresses-container">
        <header className="addresses-header">
          <div>
            <h1 className="title">MY ADDRESSES</h1>
            <p>Manage your saved delivery addresses.</p>
          </div>
          <button type="button" className="add-btn" onClick={openAddModal}>
            + ADD NEW ADDRESS
          </button>
        </header>

        <div className="address-list">
          {addresses.length === 0 ? (
            <div className="empty-address">
              <h3>No addresses found</h3>
              <p>Add an address to make checkout faster.</p>
              <button type="button" className="add-btn" onClick={openAddModal}>
                + ADD ADDRESS
              </button>
            </div>
          ) : (
            addresses.map((address) => (
              <div className="address-card" key={address._id}>
                <div className="card-content">
                  <div className="name-row">
                    <span className="person-name">{address.fullName}</span>
                    {address.isDefault && (
                      <span className="badge">DEFAULT</span>
                    )}
                    <span className="address-type">{address.addressType}</span>
                  </div>
                  <p className="address-line">
                    {address.streetAddress}
                    {address.apartment && `, ${address.apartment}`}
                  </p>
                  <p className="address-line">
                    {address.city}, {address.state} - {address.postalCode}
                  </p>
                  <div className="phone-row">
                    <span>{address.phoneNumber}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    type="button"
                    className="action-btn edit-btn"
                    onClick={() => openEditModal(address)}
                  >
                    EDIT
                  </button>
                  <button
                    type="button"
                    className="action-btn remove-btn"
                    onClick={() => openDeleteModal(address)}
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

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
                  className="delete-confirm-btn"
                  onClick={handleDeleteAddress}
                >
                  REMOVE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}



export default MyAddresses