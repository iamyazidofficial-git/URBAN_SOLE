//*****************************IMPORTS***********************************/

import { useEffect, useState } from "react";
import "./Profile.css";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../partials/navbar/navbar";
import axiosInstance from "../../../utils/axiosInstance";
import Loader from "../../../partials/Loader/Loader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//*****************************MAIN***********************************/

const Profile = () => {

  const {register,handleSubmit,reset,formState: { errors },} = useForm()
  const navigate = useNavigate()

  //-------------------STATES-------------------

  const [user, setUser] = useState(null)
  const [loading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newError, setNewError] = useState("")
  const [showRemoveModal, setShowRemoveModal] = useState(false)

  //-------------------GET USER-------------------

  const getUser = async () => {
    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        return console.log("token not found")
      }
      const response = await axiosInstance.get(
        "http://localhost:2222/user/profile/getUser",
      )
   
      const findUser = response?.data.data

      setUser(findUser)
      reset({
        name: findUser.name || "",
        email: findUser.email || "",
        gender: findUser.gender || "",
        profileImage: findUser.profileImage || "",
        password: "",
      })

    } catch (error) {
      console.log(error.response?.data?.message)
      console.log("PROFILE ERROR:", error)
    } finally {
      setIsLoading(false)
    }
  }

  //-------------------FETCH-------------------

  useEffect(() => {
    getUser()
  }, [])

  //-------------------ONSUBMIT-------------------

  const onSubmit = async (data) => {
    setSaving(true)
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")

      const response = await axiosInstance.put(
        "http://localhost:2222/user/profile/editUser",
        {
          name: data.name,
          email: data.email,
          gender: data.gender,
          type: "editProfile",
        },
      )

      if (response.data.success == true) {
        await getUser()
        setIsEditing(false)
      }
    } catch (error) {
      return setNewError(error.response?.data?.message)
    } finally {
      setIsLoading(false)
      setSaving(false)
    }
  }

  //-------------------CANCEL-------------------

  const cancelEdit = () => {
    reset({
      name: user.name || "",
      email: user.email || "",
      gender: user.gender || "",
      profileImage: user.profileImage || "",
    })

    setIsEditing(false)
  }

  //-------------------ADD PHOTO-------------------

  const addPhoto = () => {
    document.getElementById("profile-photo-input").click();
  };

  //-------------------ADD PHOTO-------------------

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG, or WEBP image formats are allowed!", {
        position: "top-right",
        autoClose: 3000,
      });
      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB!", {
        position: "top-right",
        autoClose: 3000,
      });
      e.target.value = "";
      return;
    }

    const formData = new FormData();

    formData.append("type", "uploadPhoto");
    formData.append("profileImage", file);

    try {
      setIsLoading(true);

      const response = await axiosInstance.put(
        "/user/profile/editUser",
        formData,
      );

      if (response.data.success) {
        toast.success("Profile photo updated successfully!");
        await getUser();
      }
    } catch (error) {
      console.log("PHOTO UPLOAD ERROR:", error);
      console.log("BACKEND ERROR:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to upload photo.");
    } finally {
      setIsLoading(false);
      e.target.value = "";
    }
  };

  //-------------------REMOVE PHOTO-------------------

  const handleRemovePhoto = async () => {
    try {
      const response = await axiosInstance.put("/user/profile/editUser", {
        type: "removePhoto",
      });

      console.log("REMOVE PHOTO RESPONSE:", response.data);

      if (response.data.success) {
        setShowRemoveModal(false);
        await getUser();
      }
    } catch (error) {
      console.log("REMOVE PHOTO ERROR:", error);
      console.log("BACKEND ERROR:", error.response?.data);
    }
  };

  const changeEmail=async ()=>{
    setIsLoading(true)
    try{
      await axiosInstance.post("http://localhost:2222/user/generateOTP", {
      email: user.email
    })

      navigate("/user/verifyOTP", {
      state: {
        email:user.email,
        type: "verifyCurrentEmailForChange"
      },
    });

    }catch(error){
      console.log(error)
    }finally{
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Navbar */}

      <Navbar />

      {loading && <Loader />}

<ToastContainer position="top-right" autoClose={3000} />

      <div className="profile-container">
        {/* Header Section */}

        <div className="profile-header">
          <h1>MY PROFILE</h1>

          <p>Manage your personal information and account details.</p>
        </div>

        {/* Main Card */}

        <div className="profile-card">
          {/* PROFILE PHOTO SECTION */}

          <div className="avatar-section">
            <div className="avatar-image-wrapper">
             <img
  src={
    user?.profileImage
      ? user.profileImage.replace(/=s\d+-c$/, "=s256-c")
      : "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
  }
  alt={user?.name || "User"}
  className="avatar-image"
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src =
      "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
  }}
/>
            </div>

            <div className="avatar-details">
              <h2>{user?.name}</h2>

              <p className="email">{user?.email}</p>

              <div className="avatar-actions">
                <button type="button" className="btn-upload" onClick={addPhoto}>
                  {user?.profileImage ? "CHANGE PHOTO" : "UPLOAD NEW PHOTO"}
                </button>

                {user?.profileImage && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => {
                      setShowRemoveModal(true);
                    }}
                  >
                    REMOVE
                  </button>
                )}
              </div>

              <input
                id="profile-photo-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
            </div>
          </div>

          <hr className="divider" />

          {/* EDIT FORM */}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Personal Information */}

            <div className="section">
              <h3 className="section-title">PERSONAL INFORMATION</h3>

              {newError && <p className="form-error">{newError}</p>}

              {/* NAME */}

              <div className="form-group">
                <label>FULL NAME</label>

                <input
                  type="text"
                  className="form-input"
                  readOnly={!isEditing}
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

                {errors.name && <p className="error">{errors.name.message}</p>}
              </div>

              {/* EMAIL */}

              <div className="form-group">
                <label>EMAIL</label>

                <input
                  type="email"
                  className="form-input"
                  readOnly
                  {...register("email")}
                />

                {errors.email && (
                  <p className="error">{errors.email.message}</p>
                )}
              </div>

              {/* GENDER */}

              <div className="form-group flex-1">
                <label>GENDER</label>

                <div className="select-wrapper">
                  <select
                    className="form-select"
                    disabled={!isEditing}
                    {...register("gender", {
                      required: "Please select your gender",
                    })}
                  >
                    <option value="">Select Gender</option>

                    <option value="male">Male</option>

                    <option value="female">Female</option>

                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="error"> {errors.gender.message}</p>
                  )}
                </div>
              </div>
            </div>

            <hr className="divider" />

            {/* Security Section */}

            {user?.googleId == null && (
              <div className="section">
                <h3 className="section-title">SECURITY</h3>

                <div className="security-buttons">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() =>
                      navigate("/user/changePassword", {
                        state: { email: user.email },
                      })
                    }
                  >
                    CHANGE PASSWORD
                  </button>

                  <button
                    type="button"
                    className="btn-outline"
                    onClick={changeEmail}
                  >
                    CHANGE EMAIL
                  </button>
                </div>
              </div>
            )}

            {/* Action Footer */}

            <div className="card-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="btn-save"
                  onClick={() => setIsEditing(true)}
                >
                  EDIT PROFILE
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    CANCEL
                  </button>

                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? "SAVING..." : "SAVE CHANGES"}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      {showRemoveModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Remove Profile Photo?</h3>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to remove your profile photo?</p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn cancel-btn"
                onClick={() => setShowRemoveModal(false)}
              >
                CANCEL
              </button>

              <button
                type="button"
                className="modal-btn confirm-btn"
                onClick={handleRemovePhoto}
              >
                YES, REMOVE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
