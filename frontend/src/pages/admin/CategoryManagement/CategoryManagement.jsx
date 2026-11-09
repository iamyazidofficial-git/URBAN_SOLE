import React, { useEffect, useState } from "react";
import "./CategoryManagement.css";
import { Pencil, Trash2, Power } from "lucide-react";
import AdminSidebar from "../../../partials/AdminSidebar/AdminSidebar";
import Loader from "../../../partials/Loader/Loader";
import axiosInstance from "../../../utils/axiosInstance";
import { useForm } from "react-hook-form";
import SearchBar from "../../../partials/SearchBar/SearchBar";

const CategoryManagement = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newError, setNewError] = useState("");
  const [categories, setCategories] = useState([]);
  const [deleteId,setDeleteId]=useState(null)
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState("")
  const [totalCategories,setTotalCategories]=useState(0)
  const [totalPages,setTotalPages]=useState(0)
 

  const openModal = (type, cat) => {
    if (type == "add") {
      reset({
        _id: "",
        name: "",
        description: "",
        offer: "",
        offerExpiry: "",
        status: "Active",
      });
      setNewError("")
      setIsAddModalOpen(true);
    }
   if (type == "edit") {
    let formattedDate = "";
    if (cat?.offerExpiry) {
      const d = new Date(cat.offerExpiry);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split("T")[0];
      }
    }

    reset({
      _id: cat?._id,
      name: cat?.name,
      description: cat?.description,
      offer: cat.offer && cat.offer > 0 ? cat.offer : "",
      offerExpiry: formattedDate, 
      status: cat?.status,
    })
    setNewError("");
    setIsEditModalOpen(true);
  }
  };

  console.log("Serch",search)

  const onSubmit = async (data) => {
    try {
      const response = await axiosInstance.post(
        "http://localhost:2222/admin/category/addCategory",
        {
          name: data?.name,
          description: data?.description,
          status: data?.status,
          offer: data?.offer,
          offerExpiry: data?.offerExpiry,
        },
      );

      if (response.data?.success == true) {
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.log("Error" + error?.response?.data);

      setNewError(error.response?.data?.message || "Something went wrong");
    }
  };

  const editCategory = async (data) => {
    try {
    
      const response = await axiosInstance.put(
        `http://localhost:2222/admin/category/editCategory/${data._id}`,
        data,
      );
      if (response.data?.success == true) {
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Something went wrong")
      setNewError(error?.response?.data?.message||"Something went wrong")
    }
  };

  const getCategories = async () => {
    try {
      console.log("Page",page)
      console.log("Search",search)
      const response = await axiosInstance.get(
        `http://localhost:2222/admin/category/getCategory/?page=${page}&limit=5&search=${search}`,
      );

      if (response.data?.success == true) {
        setCategories(response.data?.data)
        setTotalCategories(response.data?.totalCategories)
        setTotalPages(response.data?.totalPages)
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteCategory = async()=>{
    setNewError("")
    try{
      const response=await axiosInstance.patch(`http://localhost:2222/admin/category/deleteCategory/${deleteId}`)
      
    }catch(error){
      console.log(error.response?.data?.message||"Something went wrong")
    }finally{
      setDeleteId(null)
    }
  }

  useEffect(() => {
    getCategories();
  }, [search,page,deleteId,isAddModalOpen,isEditModalOpen]);

  const toggleStatus=async(id)=>{
    try{
      const response=await axiosInstance.patch(`http://localhost:2222/admin/category/toggleStatus/${id}`)
      if (response.data?.success === true) {
        getCategories()
        
      }
    }catch(error){
      console.log(error.response?.message||"Something went wrong")
    }
  }

 const handleSearch = (searchTerm) => {
    setSearch(searchTerm);
    setPage(1); 
  };

  const changePage=(type)=>{
     if(type=="next" && page<totalPages){
      setPage(t=>t+1)
     }
     else if(type=="prev" && page>1){
      setPage(t=>t-1)
     }
  }


  return (
    <>
      <AdminSidebar />

      <div className="category-management-container">
        {/* Top Header Section */}
        <div className="content-header">
          <div>
            <h2>CATEGORY MANAGEMENT</h2>
            <p>Organize and manage your product categories.</p>
          </div>
          <button
            className="add-category-main-btn"
            onClick={() => openModal("add")}
          >
            + ADD CATEGORY
          </button>
        </div>
    

       <div className="category-search-container">
 <SearchBar
    value={search}
    onChange={(e) => handleSearch(e.target.value)}
    onClear={() => handleSearch("")}
    placeholder="Search categories..."
  />
</div>

        {/* Categories Table Card */}
        <div className="table-card">
          <table className="category-table">
            <thead>
              <tr>
                <th>CATEGORY NAME</th>
                <th>NO. OF PRODUCTS</th>
                <th style={{ textAlign: "center" }}>OFFER</th>
                <th style={{ textAlign: "center" }}>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id || cat.id}>
                  <td>{cat.name}</td>
                  <td>{cat.totalProducts ?? 0}</td>
                  <td style={{ textAlign: "center" }}>
                    {cat.offer ? (
                      <span className="offer-badge">{cat.offer}%</span>
                    ) : (
                      <span className="offer-plus">-</span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status-badge ${cat.status?.toLowerCase()}`}>
                      {cat.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                      <label className="custom-toggle" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={cat.status === "Active"}
                          onChange={() => toggleStatus(cat._id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <button
                        className="action-btn"
                        onClick={() => openModal("edit", cat)}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="action-btn delete-action"
                        onClick={() => setDeleteId(cat._id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="table-footer">
            <span>
              Showing page {page} of {totalPages || 1} ({totalCategories} total entries)
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

        {/* ADD CATEGORY MODAL */}
        {isAddModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsAddModalOpen(false)}
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Category</h3>
                <p>Create a new product category</p>
              </div>
              {newError && <p className="form-error">{newError}</p>}
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter category name"
                    maxLength={24}
                    {...register("name", {
                      required: "Name is required",
                      validate: {
                        minLetters: (value) =>
                          (value.match(/[a-zA-Z]/g) || []).length >= 4 ||
                          "Name must contain at least 4 charecters",
                        onlyLetters: (value) =>
                          /^[a-zA-Z ]+$/.test(value) ||
                          "Name must contains only letters",
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
                    name="description"
                    maxLength={200}
                    placeholder="Enter category description"
                    {...register("description")}
                  ></textarea>
                  {errors.description && (
                    <p className="error-message">
                      {errors?.description?.message}
                    </p>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label>Status</label>
              <select
  name="status"
  defaultValue="Active"
  {...register("status", {
    required: "Status is required",
  })}
>
  <option value="Active">Active</option>
  <option value="InActive">InActive</option>
</select>
                    {errors.status && (
                      <p className="error-message">{errors?.status?.message}</p>
                    )}
                  </div>
                  <div className="form-group half">
                    <label>Offer</label>
                    <input
                      type="text"
                      name="offers"
                      maxLength={2}
                      placeholder="Enter offer percentage"
                      {...register("offer", {
                        validate: (value) => {
                          if (!value || value.trim() === "") {
                            return true;
                          }

                          if (isNaN(value)) {
                            return "enter a number";
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
                    <p className="error-message">
                      {errors?.offerExpiry?.message}
                    </p>
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
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}




        {/* EDIT CATEGORY MODAL */}
        {isEditModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsEditModalOpen(false)}
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Category</h3>
                <p>Update category details</p>
              </div>
                            {newError && <p className="form-error">{newError}</p>}
              <form onSubmit={handleSubmit(editCategory)}>
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    {...register("name", {
                      required: "Name is required",
                      validate: {
                        minLetters: (value) =>
                          (value.match(/[a-zA-Z]/g) || []).length >= 4 ||
                          "Name must contain at least 4 charecters",
                        onlyLetters: (value) =>
                          /^[a-zA-Z ]+$/.test(value) ||
                          "Name must contains only letters",
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
                    name="description"
                    {...register("description")}
                  ></textarea>
                    {errors.description && (
                      <p className="error-message">{errors?.description?.message}</p>
                    )}
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label>Status</label>
                    <select
  name="status"
  {...register("status", {
    required: "Status is required",
  })}
>
  <option value="Active">Active</option>
  <option value="InActive">InActive</option> 
</select>
                      {errors.status && (
                      <p className="error-message">{errors?.status?.message}</p>
                    )}
                  </div>
                  <div className="form-group half">
                    <label>Offer</label>
                    <input
                      type="text"
                      name="offers"
                      maxLength={2}
                      placeholder="Enter offer percentage"
                     {...register("offer", {
  validate: (value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return true;
    }

    const trimmedValue = String(value).trim();

    if (isNaN(trimmedValue)) {
      return "enter a number";
    }

    const num = Number(trimmedValue);
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
                    Update Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Categories Table Card */}
        <div className="table-card">
          {/* ... table and pagination code ... */}
        </div>

        {/* Page Footer */}
        <div className="page-admin-footer">
          <p>© 2024 Urban Sole Admin Panel. Internal Use Only.</p>
        </div>
      </div>

      {/* DELETE MODAL */}
        {deleteId &&(
          <div className="modal-overlay">
            <div className="delete-modal">
              <div className="delete-icon">!</div>
              <h2>REMOVE ADDRESS?</h2>
              <p>Are you sure you want to delete this category?</p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={()=>setDeleteId(null)}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  className="delete-confirm-btn"
                  onClick={deleteCategory}
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

export default CategoryManagement;
