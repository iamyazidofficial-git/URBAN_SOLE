import { useState } from "react";
import "./ChangePassword.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Navbar from "../../../partials/navbar/navbar";
import axiosInstance from "../../../utils/axiosInstance";
import Loader from "../../../partials/Loader/Loader";

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="eye-icon"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="eye-icon"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function ChangePassword() {
  const location = useLocation()
  const email = location.state?.email
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  })

  const newPassword = watch("newPassword")

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [newError, setNewError] = useState("")

  const toggleVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const onSubmit = async (data) => {
    try {
      const response = await axiosInstance.put("/user/profile/editUser", {
        email,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        type: "changePassword",
      })

      if (response.data?.success === true) {
        await axiosInstance.post("/user/generateOTP", { email })

        navigate("/user/verifyOTP", {
          state: {
            email,
            newPassword: data.newPassword,
            type: "changePassword",
          },
        })
      }
    } catch (error) {
      setNewError(error.response?.data?.message || "Something went wrong")
    }
  }

  return (
    <>
      <Navbar />

      {isSubmitting && <Loader />}

      <div className="change-password-container">
        <h1 className="title">CHANGE PASSWORD</h1>
        {newError && <p className="form-error">{newError}</p>}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="password-form"
          noValidate
        >
          {/* CURRENT PASSWORD */}
          <div className="form-group">
            <label htmlFor="currentPassword">CURRENT PASSWORD</label>
            <div className="input-wrapper">
              <input
                type={showPassword.current ? "text" : "password"}
                id="currentPassword"
                placeholder="Enter current password"
                className={errors.currentPassword ? "input-error" : ""}
                {...register("currentPassword", {
                  required: "Current password is required",
                })}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => toggleVisibility("current")}
                aria-label="Toggle password visibility"
              >
                {showPassword.current ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.currentPassword && (
              <span className="error-message">
                {errors.currentPassword.message}
              </span>
            )}
          </div>

          {/* NEW PASSWORD */}
          <div className="form-group">
            <label htmlFor="newPassword">NEW PASSWORD</label>
            <div className="input-wrapper">
              <input
                type={showPassword.new ? "text" : "password"}
                id="newPassword"
                placeholder="Enter new password"
                className={errors.newPassword ? "input-error" : ""}
                {...register("newPassword", {
                  required: "New password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters long",
                  },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d)/,
                    message:
                      "Password must contain at least one letter and one number",
                  },
                })}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => toggleVisibility("new")}
                aria-label="Toggle password visibility"
              >
                {showPassword.new ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.newPassword && (
              <span className="error-message">
                {errors.newPassword.message}
              </span>
            )}
          </div>

          {/* CONFIRM NEW PASSWORD */}
          <div className="form-group">
            <label htmlFor="confirmPassword">CONFIRM NEW PASSWORD</label>
            <div className="input-wrapper">
              <input
                type={showPassword.confirm ? "text" : "password"}
                id="confirmPassword"
                placeholder="Re-enter new password"
                className={errors.confirmPassword ? "input-error" : ""}
                {...register("confirmPassword", {
                  required: "Please confirm your new password",
                  validate: (value) =>
                    value === newPassword || "Passwords do not match",
                })}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => toggleVisibility("confirm")}
                aria-label="Toggle password visibility"
              >
                {showPassword.confirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            UPDATE PASSWORD
          </button>

          <button
            type="button"
            className="forgot-link"
            onClick={() => navigate("/user/forgottPassword", { replace: true })}
          >
            Forgot Password?
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/user/profile", { replace: true })}
          >
            CANCEL
          </button>
        </form>
      </div>
    </>
  );
}
