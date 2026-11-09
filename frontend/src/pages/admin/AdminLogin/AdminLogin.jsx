import React, { useEffect, useState } from "react"
import "./AdminLogin.css"
import { useNavigate } from "react-router-dom"
import axiosInstance from "../../../utils/axiosInstance"
import { useDispatch } from "react-redux"
import { signIn } from "../../../redux/slices/authSlice"
import { useForm } from "react-hook-form"

const AdminLogin = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("adminToken")

    if (token) {
      navigate("/admin/customerManagement", { replace: true })
    }
  }, [navigate])

  const dispatch = useDispatch()
  const [showPassword, setShowPassword] = useState(false)
  const [newError, setNewError] = useState("")

  const onSubmit = async (data) => {
    setNewError("")

    try {
      const response = await axiosInstance.post("/admin/login", {
        email: data.email.trim(),
        password: data.password,
      })

      if (response.data.success === true) {

        const token = response.data.token

        dispatch(
          signIn({
            token,
            role: response.data.role,
          }),
        )

        navigate("/admin/customerManagement", {
          replace: true,
        })
      }
    } catch (error) {
      console.log("BACKEND ERROR:", error.response?.data)

      setNewError(error.response?.data?.message || "Something went wrong")
    }
  }

  return (
    <div className="admin-login-container">
      {/* Left Banner Section */}
      <div className="admin-login-banner">
        <div className="banner-overlay">
          {/* Logo Top Left */}
          <div className="banner-logo">URBAN SOLE</div>

          {/* Center Info Text */}
          <div className="banner-center-content">
            <div className="banner-title-wrapper">
              <span className="banner-bar"></span>
              <h2 className="banner-title">ADMIN PANEL</h2>
            </div>
            <p className="banner-description">
              Manage your Urban Sole store, products, orders, customers and more
              from one place.
            </p>
          </div>

          {/* Bottom Secure Tag */}
          <div className="banner-footer">
            <span className="material-symbols-outlined secure-icon">
              verified_user
            </span>
            <span className="secure-text">SECURE ENVIRONMENT</span>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="admin-login-form-wrapper">
        <div className="admin-login-content">
          <h1 className="admin-title">ADMIN LOGIN</h1>
          <p className="admin-subtitle">
            Welcome back, Admin. Sign in to access the Urban Sole administration
            panel.
          </p>

          {newError && <p className="form-error">{newError}</p>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="admin-form">
            {/* Email Field */}
            <div className="input-group">
              <span className="material-symbols-outlined input-icon">mail</span>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
            </div>
            {errors.email && <p className="error">{errors.email.message}</p>}

            {/* Password Field */}
            <div className="input-group">
              <span className="material-symbols-outlined input-icon">key</span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                {...register("password", {
                  required: "Password is required",
                minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                    validate: (value) =>
                      value.trim().length > 0 ||
                      "Password cannot be empty spaces",
                  })}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {errors.password && (
              <p className="error">{errors.password.message}</p>
            )}

            {/* Submit Button */}
            <button type="submit" className="admin-submit-btn">
              LOGIN TO ADMIN PANEL
            </button>
          </form>

          {/* Secure Admin Access Box */}
          <div className="security-notice-box">
            <span className="material-symbols-outlined lock-icon">lock</span>
            <div className="security-text-content">
              <h4>Secure Admin Access</h4>
              <p>
                Only authorized Urban Sole administrators can access this panel.
                All login attempts are recorded.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="admin-login-footer">
          © 2026 URBAN SOLE | ADMIN PORTAL
        </footer>
      </div>
    </div>
  );
};

export default AdminLogin;


