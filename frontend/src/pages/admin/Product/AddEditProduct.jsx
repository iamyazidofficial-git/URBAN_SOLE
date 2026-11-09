import React, { useState, useEffect, useRef } from "react"
import "./AddEditProduct.css"
import { useForm, useFieldArray } from "react-hook-form"
import axiosInstance from "../../../utils/axiosInstance"
import { useNavigate, useParams } from "react-router-dom"
import Loader from "../../../partials/Loader/Loader"
import AdminSidebar from "../../../partials/AdminSidebar/AdminSidebar"

// React Image Crop imports
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

const SIZES = [6, 7, 8, 9, 10, 11, 12]

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  )
}

const AddEditProduct = () => {

  //-------------------STATES-------------------

  const { id } = useParams()
  const [type, setType] = useState("add")
  const [newError, setNewError] = useState("")
  const [variantError, setVariantError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVariantIndex, setEditingVariantIndex] = useState(null)
  const [Loading, setIsLoading] = useState(false)

  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState("")
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const [pendingFilesQueue, setPendingFilesQueue] = useState([])
  const [activeImageIndexToReplace, setActiveImageIndexToReplace] =useState(null)
  const imgRef = useRef(null)

  const [subCategories, setSubCategories] = useState([])
  const [brands, setBrands] = useState([])
  const navigate = useNavigate()

  const [newVariant, setNewVariant] = useState({
    colour: "",
    colourHex: "#000000",
    inventory: SIZES.map((size) => ({ size, quantity: 0 })),
    images: [],
  })

  //-------------------REGISTRATION-------------------

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      regularPrice: "",
      status: "Active",
      category: "",
      subCategory: "",
      brand: "",
      sole: "",
      countryOfOrgin: "",
      offer: "",
      offerExpiry: "",
      variants: [],
    },
  })

  const watchOffer = watch("offer")

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "variants",
  })

  //-------------------FETCH DATAS-------------------

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const catRes = await axiosInstance.get("/admin/category/getCategory")
        const brandsRes = await axiosInstance.get("/admin/brand/getBrand")

        if (catRes.data?.success) setSubCategories(catRes.data.data)
        if (brandsRes.data?.success) setBrands(brandsRes.data.data)

        if (id) {
          setType("edit")
          const prodRes = await axiosInstance.get(
            `/admin/product/getProduct/${id}`,
          )
          if (prodRes.data?.success) {
            const product = prodRes.data.data

            const formattedVariants = (product.vartiant || []).map((v) => ({
              colour: v.colour || "",
              colourHex: v.colourHex || "#000000",
              inventory: SIZES.map((size) => {
                const found = v.inventory?.find(
                  (inv) => Number(inv.size) === Number(size),
                )
                return { size, quantity: found ? found.quantity : 0 }
              }),
              images: (v.images || []).map((imgUrl) => ({
                url: imgUrl,
                file: null,
                isExisting: true,
              })),
            }))

            reset({
              name: product.name || "",
              description: product.description || "",
              regularPrice: product.price || "",
              status: product.status || "Active",
              category: product.gender || "",
              subCategory: product.category?.name || "",
              brand: product.brand?.name || product.brand || "",
              sole: product.sole || "",
              countryOfOrgin: product.countryOfOrgin || "",
              variants: formattedVariants,
              offer: product.offer || "",
              offerExpiry: product.offerExpiry
                ? product.offerExpiry.split("T")[0]
                : "",
            })
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id, reset])

  //---------------------STOCK CHANGE---------------------

  const handleModalInventoryChange = (size, qtyValue) => {
    let parsedValue = parseInt(qtyValue, 10)
    if (isNaN(parsedValue) || parsedValue < 0) parsedValue = 0
    const updatedInventory = newVariant.inventory.map((item) =>
      item.size === size ? { ...item, quantity: parsedValue } : item,
    )
    setNewVariant({ ...newVariant, inventory: updatedInventory })
  }

  //-------------------VARIANT IMAGE SETTING------------------

  const handleVariantImageUpload = (e) => {
    const files = Array.from(e.target.files)

    const hasInvalidFiles = files.some((file) => {
      const isValidType = file.type && file.type.startsWith("image/")
      const isValidExtension = /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(
        file.name,
      )
      return !isValidType && !isValidExtension
    })

    if (hasInvalidFiles) {
      setVariantError(
        "Only image files (JPEG, PNG, WEBP, etc.) are permitted.",
      )
      e.target.value = ""
      return
    }

    if (newVariant.images.length + files.length > 4) {
      setVariantError("You can upload a maximum of 4 photos per variant.")
      e.target.value = ""
      return
    }

    setVariantError("")
    if (files.length > 0) {
      setActiveImageIndexToReplace(null)
      setPendingFilesQueue(files)
      processNextFileForCrop(files[0])
    }
    e.target.value = ""
  }

  //-------------------REPLACE IMAGE------------------

  const handleReplaceImageTrigger = (indexToReplace, e) => {
    const file = e.target.files[0]
    if (!file) return

    const isValidType = file.type && file.type.startsWith("image/")
    const isValidExtension = /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(file.name)

    if (!isValidType && !isValidExtension) {
      setVariantError("Only valid image files are allowed.")
      e.target.value = ""
      return
    }

    setVariantError("")
    setActiveImageIndexToReplace(indexToReplace)
    setPendingFilesQueue([file])
    processNextFileForCrop(file)
    e.target.value = ""
  }

  //-------------------SET IMAGE TO CROP-------------------

  const processNextFileForCrop = (file) => {
    if (imgSrc) {
      URL.revokeObjectURL(imgSrc)
    }
    const imageUrl = URL.createObjectURL(file)
    setImgSrc(imageUrl)
    setCropModalOpen(true)
  }

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }

  //-------------------IMAGE CROPPING-------------------

  const handleCropCompleteConfirm = async () => {
    if (!completedCrop || !imgRef.current) return

    const image = imgRef.current
    const canvas = document.createElement("canvas")
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY

    const ctx = canvas.getContext("2d")
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    canvas.toBlob((blob) => {
      if (!blob) return
      const croppedFile = new File([blob], `variant_${Date.now()}.jpg`, {
        type: "image/jpeg",
      })
      const croppedUrl = URL.createObjectURL(croppedFile)

      const newImageItem = {
        url: croppedUrl,
        file: croppedFile,
        isExisting: false,
      }

      if (activeImageIndexToReplace !== null) {
        const updatedImages = [...newVariant.images]
        updatedImages[activeImageIndexToReplace] = newImageItem
        setNewVariant((prev) => ({ ...prev, images: updatedImages }))
        setActiveImageIndexToReplace(null)
        setCropModalOpen(false)
      } else {
        setNewVariant((prev) => ({
          ...prev,
          images: [...prev.images, newImageItem],
        }))

        const remainingQueue = pendingFilesQueue.slice(1)
        setPendingFilesQueue(remainingQueue)
        setCropModalOpen(false)

        if (remainingQueue.length > 0) {
          setTimeout(() => {
            processNextFileForCrop(remainingQueue[0])
          }, 300)
          return
        }
      }
    }, "image/jpeg")
  }

  //-----------------REMOVE VARIANT IMAGE------------------

  const handleRemoveVariantImage = (indexToRemove) => {
    setNewVariant((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove),
    }))
  }

  //-------------------OPEN MODALS-------------------

  const openAddModal = () => {
    setVariantError("")
    setEditingVariantIndex(null)
    setNewVariant({
      colour: "",
      colourHex: "#000000",
      inventory: SIZES.map((size) => ({ size, quantity: 0 })),
      images: [],
    })
    setIsModalOpen(true)
  }

  const openEditModal = (index) => {
    const variantToEdit = fields[index]
    setEditingVariantIndex(index)
    setVariantError("")
    setNewVariant({
      colour: variantToEdit.colour,
      colourHex: variantToEdit.colourHex || "#000000",
      inventory: SIZES.map((size) => {
        const found = variantToEdit.inventory?.find(
          (inv) => Number(inv.size) === Number(size),
        )
        return { size, quantity: found ? found.quantity : 0 }
      }),
      images: (variantToEdit.images || []).map((img) => {
        if (typeof img === "string") {
          return { url: img, file: null, isExisting: true }
        }
        return img
      }),
    })
    setIsModalOpen(true)
  }

  //-------------------ADD VARIANT-------------------

  const handleSaveVariantFromModal = () => {
    const trimmedColour = newVariant.colour.trim()
    if (!trimmedColour) {
      setVariantError("Please enter a colour name.")
      return
    }
   const colorRegex = /^[A-Za-z]+( [A-Za-z]+)*$/
  if (!colorRegex.test(trimmedColour) || trimmedColour.length < 4) {
    setVariantError("Colour name must contain 3 charecters")
    return
  }

    const isDuplicateColor = fields.some((field, index) => {
      if (editingVariantIndex !== null && index === editingVariantIndex)
        return false
      return field.colour.trim().toLowerCase() === trimmedColour.toLowerCase()
    })

    if (isDuplicateColor) {
      setVariantError(
        `A variant with the color "${trimmedColour}" already exists.`,
      )
      return
    }

    if (newVariant.images.length !== 4) {
      setVariantError(
        "Minimum and maximum 4 photos are required for each variant.",
      )
      return
    }

    const variantPayload = {
      colour: trimmedColour,
      colourHex: newVariant.colourHex,
      inventory: [...newVariant.inventory],
      images: newVariant.images,
    }

    if (editingVariantIndex !== null) {
      update(editingVariantIndex, variantPayload)
    } else {
      append(variantPayload)
    }

    setIsModalOpen(false)
  }

  //-----------------------MAIN PART-------------------------

  const onSubmit = async (data) => {
    if (!data.variants || data.variants.length === 0) {
      setNewError("Add at least one variant")
      return
    }
    setNewError("")
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("description", data.description)
      formData.append("regularPrice", data.regularPrice)
      formData.append("status", data.status)
      formData.append("category", data.category)
      formData.append("subCategory", data.subCategory)
      formData.append("brand", data.brand)
      formData.append("countryOfOrgin", data.countryOfOrgin)
      formData.append("sole", data.sole)
      formData.append("offer", data.offer || 0)
      if (data.offerExpiry) formData.append("offerExpiry", data.offerExpiry)

      const cleanVariants = data.variants.map((v, vIndex) => {
        const cleanedImages = [];
        (v.images || []).forEach((img) => {
          if (typeof img === "object" && img.file instanceof File) {
            formData.append(`variants[${vIndex}][images]`, img.file)
          } else if (typeof img === "string") {
            cleanedImages.push(img)
          } else if (img && img.url) {
            cleanedImages.push(img.url)
          }
        })
        return {
          colour: v.colour,
          colourHex: v.colourHex,
          inventory: v.inventory,
          images: cleanedImages,
        }
      })

      formData.append("variants", JSON.stringify(cleanVariants))

      if (type === "add") {
        const response = await axiosInstance.post(
          "/admin/product/addProduct",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        )
        if (response.data?.success === true)
          navigate("/admin/productManagement", { replace: true })
      } else {
        const response = await axiosInstance.put(
          `/admin/product/editProduct/${id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        )
        if (response.data?.success === true)
          navigate("/admin/productManagement", { replace: true })
      }
    } catch (error) {
      setNewError(error?.response?.data?.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AdminSidebar />
      {Loading && <Loader />}

    {/*------------------PRODUCT MODAL-----------------*/}

      <div className="aep-container">
        <div className="aep-breadcrumb"></div>

        <nav className="us-breadcrumb" aria-label="Breadcrumb">
          <ol className="us-breadcrumb-list">
            <li>
              <a href="/admin/productManagement">PRODUCT MANAGEMENT</a>
            </li>
            <li className="us-separator">/</li>
            <li>
              <span aria-current="page">ADD/EDIT PRODUCT</span>
            </li>
          </ol>
        </nav>

        <h1 className="aep-title">
          {type === "add" ? "Add Product" : "Edit Product"}
        </h1>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          {newError && (
            <p
              className="form-error"
              style={{
                marginBottom: "16px",
                color: "#ef4444",
                fontWeight: 600,
              }}
            >
              {newError}
            </p>
          )}

          <div className="aep-card">
            <h2 className="aep-card-title">Product Details</h2>

            {/* PRODUCT NAME */}
            <div className="aep-field">
              <label className="aep-label">Product Name</label>
              <input
                type="text"
                className="aep-input"
                placeholder="Enter Name of Product"
                maxLength={24}
                {...register("name", {
                  required: "Name is required",
                  validate: {
                    notOnlySpaces: (value) =>
                      value.trim().length > 0 || "Name cannot be empty spaces",
                    minLetters: (value) =>
                      (value.match(/[a-zA-Z]/g) || []).length >= 4 ||
                      "Must contain at least 4 letters",
                    alphanumericSpace: (value) =>
                      /^[a-zA-Z0-9 ]+$/.test(value) ||
                      "Must contain only letters, numbers, and spaces",
                  },
                })}
              />
              {errors.name && (
                <p className="error-message">{errors.name?.message}</p>
              )}
            </div>

            {/* PRODUCT DESCRIPTION */}
            <div className="aep-field">
              <label className="aep-label">Product Description</label>
              <textarea
                placeholder="Enter Description of Product"
                className="aep-textarea"
                maxLength={200}
                rows={4}
                {...register("description", {
                  required: "Description is required",
                  validate: {
                    notOnlySpaces: (value) =>
                      value.trim().length > 0 ||
                      "Description cannot be empty spaces",
                    minNonSpaceLength: (value) =>
                      (value && value.replace(/\s/g, "").length >= 25) ||
                      "Description must contain at least 25 characters",
                  },
                })}
              />
              {errors.description && (
                <span className="error-message">
                  {errors.description?.message}
                </span>
              )}
            </div>

            <div className="aep-row-2">
              {/* REGULAR PRICE */}
              <div className="aep-field">
                <label className="aep-label">Regular Price</label>
                <input
                  type="number"
                  className="aep-input"
                  placeholder="Enter Price of Product"
                  onKeyDown={(e) =>
                    ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                  }
                  {...register("regularPrice", {
                    required: "Price is required",
                    valueAsNumber: true,
                    min: { value: 1, message: "Price must be greater than 0" },
                    max: {
                      value: 10000000,
                      message: "Price cannot exceed 1 Crore (10,000,000)",
                    },
                  })}
                />
                {errors.regularPrice && (
                  <p className="error-message">
                    {errors.regularPrice?.message}
                  </p>
                )}
              </div>

              <div className="aep-field">
                <label className="aep-label">Status</label>
                <select className="aep-select" {...register("status")}>
                  <option value="Active">Active</option>
                  <option value="InActive">InActive</option>
                </select>
              </div>
            </div>

            <div className="aep-row-2">
              {/* SUBCATEGORY */}
              <div className="aep-field">
                <label className="aep-label">SubCategory</label>
                <select
                  className="aep-select"
                  {...register("subCategory", {
                    required: "SubCategory is required",
                  })}
                >
                  <option value="">Select SubCategory</option>
                  {subCategories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.subCategory && (
                  <p className="error-message">{errors.subCategory?.message}</p>
                )}
              </div>

              {/* CATEGORY (GENDER) */}
              <div className="aep-field">
                <label className="aep-label">Category (Gender)</label>
                <select
                  className="aep-select"
                  {...register("category", {
                    required: "Category is required",
                  })}
                >
                  <option value="">Select Category</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                </select>
                {errors.category && (
                  <p className="error-message">{errors.category?.message}</p>
                )}
              </div>
            </div>

            <div className="aep-row-3">
              {/* BRAND */}
              <div className="aep-field">
                <label className="aep-label">Brand</label>
                <select
                  className="aep-select"
                  {...register("brand", { required: "Brand is required" })}
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand._id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {errors.brand && (
                  <p className="error-message">{errors.brand?.message}</p>
                )}
              </div>

              {/* COUNTRY OF ORIGIN */}
              <div className="aep-field">
  <label className="aep-label">Country of Origin</label>
  <select
    className="aep-input"
    defaultValue=""
    {...register("countryOfOrgin", {
      required: "Origin is required",
    })}
  >
    <option value="" disabled>
      Select Country of Origin
    </option>
    <option value="China">China</option>
    <option value="India">India</option>
    <option value="Vietnam">Vietnam</option>
    <option value="Brazil">Brazil</option>
    <option value="Indonesia">Indonesia</option>
    <option value="Pakistan">Pakistan</option>
    <option value="Bangladesh">Bangladesh</option>
    <option value="Turkey">Turkey</option>
    <option value="Cambodia">Cambodia</option>
    <option value="Mexico">Mexico</option>
    <option value="USA">USA</option>
    <option value="Japan">Japan</option>
    <option value="North Korea">North Korea</option>
    <option value="Russia">Russia</option>
    <option value="France">France</option>
  </select>

  {errors.countryOfOrgin && (
    <p className="error-message">
      {errors.countryOfOrgin?.message}
    </p>
  )}
</div>
            </div>

            <div className="aep-row-2">
              {/* OFFER PERCENTAGE */}
              <div className="aep-field">
                <label className="aep-label">Offer Percentage (%)</label>
                <input
                  type="text"
                  className="aep-input"
                  maxLength={2}
                  placeholder="Enter offer percentage"
                  onInput={(e) => {
                    e.target.value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 2)
                  }}
                  {...register("offer", {
                    validate: (value) => {
                      if (!value || String(value).trim() === "") return true
                      if (!/^\d{1,2}$/.test(value))
                        return "Must be fully numbers (max 2 digits)"
                      const num = Number(value)
                      if (num < 10 || num > 90)
                        return "Offer must be between 10 and 90"
                      return true
                    },
                  })}
                />
                {errors.offer && (
                  <p className="error-message">{errors.offer?.message}</p>
                )}
              </div>

             {/* OFFER EXPIRY */}
  <div className="aep-field">
    <label className="aep-label">Offer Expiry Date</label>
    <input
      type="date"
      className="aep-input"
      min={new Date().toISOString().split("T")[0]}
      onKeyDown={(e) => e.preventDefault()}
      {...register("offerExpiry", {
        validate: (value) => {
          const currentOffer = watchOffer
          if (currentOffer && Number(currentOffer) > 0) {
            if (!value)
              return "Offer expiry date is required when an offer is active"
            
            const selectedDate = new Date(value)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            if (selectedDate < today)
              return "Expiry date cannot be in the past"
          }
          return true
        },
      })}
    />
    {errors.offerExpiry && (
      <p className="error-message">{errors.offerExpiry?.message}</p>
    )}
  </div>
            </div>
          </div>

          <div className="aep-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 className="aep-card-title" style={{ margin: 0 }}>
                Product Variants & Stock (Sizes 6-12)
              </h3>
              <button
                type="button"
                className="aep-save-btn"
                style={{ padding: "8px 16px", fontSize: "12px" }}
                onClick={openAddModal}
              >
                + Add Variant
              </button>
            </div>

            <div className="aep-table-container">
              <table className="aep-table">
                <thead>
                  <tr>
                    <th>Colour</th>
                    {SIZES.map((size) => (
                      <th key={size} className="aep-text-center">
                        Size {size}
                      </th>
                    ))}
                    <th>Photos</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.length === 0 ? (
                    <tr>
                      <td
                        colSpan={SIZES.length + 3}
                        className="aep-text-center"
                        style={{ padding: "32px", color: "#6b7280" }}
                      >
                        No variants added yet.
                      </td>
                    </tr>
                  ) : (
                    fields.map((variant, index) => (
                      <tr key={variant.id}>
                        <td>
                          <div className="aep-color-cell">
                            <span
                              className="aep-color-preview"
                              style={{
                                backgroundColor: variant.colourHex || "#000",
                              }}
                            ></span>
                            <span>{variant.colour}</span>
                          </div>
                        </td>
                        {SIZES.map((size) => {
                          const invItem = variant.inventory?.find(
                            (i) => Number(i.size) === Number(size),
                          )
                          return (
                            <td key={size} className="aep-text-center">
                              {invItem ? invItem.quantity : 0}
                            </td>
                          )
                        })}
                        <td>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            {variant.images?.length || 0} / 4 photos
                          </span>
                        </td>
                        <td>
                          <div className="aep-action-icons">
                            <button
                              type="button"
                              className="aep-icon-btn"
                              onClick={() => openEditModal(index)}
                              title="Edit Variant"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="aep-icon-btn aep-delete"
                              onClick={() => remove(index)}
                              title="Delete Variant"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/*------------------VARIANT MODAL-----------------*/}

          {isModalOpen && !cropModalOpen && (
            <div className="aep-modal-overlay" style={{ zIndex: 1000 }}>
              <div className="aep-modal">
                <div className="aep-modal-header">
                  <h3 className="aep-modal-title">
                    {editingVariantIndex !== null
                      ? "Edit Colour Variant"
                      : "Add Colour Variant"}
                  </h3>
                  <button
                    type="button"
                    className="aep-icon-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="aep-modal-body">
                  {variantError && <p className="form-error">{variantError}</p>}

                  <div className="aep-field">
                    <label className="aep-label">
                      Colour Name (Letters only, max 12)
                    </label>
                    <div className="aep-color-input-wrapper">
                     <input
  type="text"
  className="aep-input"
  maxLength={15}
  placeholder="e.g. Dark Blue"
  value={newVariant.colour}
  onChange={(e) => {
    let val = e.target.value;
    if (val.startsWith(" ")) return;
    val = val.replace(/[^A-Za-z ]/g, "").replace(/\s\s+/g, " ");
    setNewVariant({ ...newVariant, colour: val });
  }}
/>
                      <input
                        type="color"
                        className="aep-color-picker"
                        value={newVariant.colourHex}
                        onChange={(e) =>
                          setNewVariant({
                            ...newVariant,
                            colourHex: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="aep-field">
                    <label className="aep-label">
                      Inventory per Size (6 to 12)
                    </label>
                    <div
                      className="aep-sizes-grid"
                      style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
                    >
                      {newVariant.inventory.map((inv) => (
                        <div key={inv.size} className="aep-size-box">
                          <span className="aep-size-title">
                            Size {inv.size}
                          </span>
                          <input
                            type="number"
                            min="0"
                            className="aep-input aep-text-center"
                            value={inv.quantity}
                            onChange={(e) =>
                              handleModalInventoryChange(
                                inv.size,
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="aep-field" style={{ marginBottom: 0 }}>
                    <label className="aep-label">
                      Variant Photos (Exactly 4 Required with Crop support)
                    </label>
                    <div className="aep-images-grid">
                      {newVariant.images.length < 4 && (
                        <label className="aep-upload-box">
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            + Add Image
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="aep-file-input"
                            onChange={handleVariantImageUpload}
                          />
                        </label>
                      )}
                      {newVariant.images.map((img, idx) => (
                        <div key={idx} className="aep-image-preview-box">
                          <img
                            src={img.url}
                            alt={`Variant preview ${idx}`}
                            className="aep-preview-img"
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: 2,
                              left: 2,
                              right: 2,
                              display: "flex",
                              gap: "2px",
                            }}
                          >
                            <label
                              style={{
                                flex: 1,
                                background: "rgba(0,0,0,0.7)",
                                color: "#fff",
                                fontSize: "9px",
                                textAlign: "center",
                                cursor: "pointer",
                                padding: "3px",
                              }}
                            >
                              Crop/Edit
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) =>
                                  handleReplaceImageTrigger(idx, e)
                                }
                              />
                            </label>
                            <button
                              type="button"
                              className="aep-remove-img-btn"
                              onClick={() => handleRemoveVariantImage(idx)}
                              style={{
                                background: "red",
                                color: "#fff",
                                border: "none",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        color:
                          newVariant.images.length === 4
                            ? "#10b981"
                            : "#ef4444",
                        display: "block",
                        marginTop: "6px",
                      }}
                    >
                      {newVariant.images.length}/4 photos uploaded{" "}
                      {newVariant.images.length !== 4 && "(Must be exactly 4)"}
                    </span>
                  </div>
                </div>

                <div className="aep-modal-footer">
                  <button
                    type="button"
                    className="aep-btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="aep-save-btn"
                    onClick={handleSaveVariantFromModal}
                  >
                    {editingVariantIndex !== null
                      ? "Update Variant"
                      : "Add Variant"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/*------------------CROP MODAL-----------------*/}

          {cropModalOpen && (
            <div className="aep-modal-overlay" style={{ zIndex: 1100 }}>
              <div
                className="aep-modal"
                style={{ maxWidth: "500px", textAlign: "center" }}
              >
                <h3
                  className="aep-modal-title"
                  style={{ marginBottom: "16px" }}
                >
                  Crop Image Before Upload
                </h3>
                {imgSrc && (
                  <div style={{ maxHeight: "400px", overflow: "auto" }}>
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={1}
                    >
                      <img
                        ref={imgRef}
                        src={imgSrc}
                        alt="Crop preview"
                        onLoad={onImageLoad}
                        style={{ maxHeight: "350px" }}
                      />
                    </ReactCrop>
                  </div>
                )}
                <div className="aep-modal-footer" style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    className="aep-btn-secondary"
                    onClick={() => {
                      setCropModalOpen(false)
                      setPendingFilesQueue([])
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="aep-save-btn"
                    onClick={handleCropCompleteConfirm}
                  >
                    Crop & Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/*------------------SAVE PRODUCT-----------------*/}

          <div
            className="aep-actions"
            style={{ display: "flex", gap: "12px", marginTop: "20px" }}
          >
            <button
              type="button"
              className="aep-btn-secondary"
              onClick={() => navigate("/admin/productManagement")}
              style={{
                flex: 1,
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="aep-save-btn"
              disabled={Loading}
              style={{ flex: 1, padding: "12px", opacity: Loading ? 0.7 : 1 }}
            >
              {Loading
                ? "SAVING..."
                : type === "add"
                  ? "SAVE PRODUCT"
                  : "UPDATE PRODUCT"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default AddEditProduct
