import { useState, useEffect } from "react"
import "./Login.css"
import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { GoogleLogin } from "@react-oauth/google"
import Navbar from "../../../partials/navbar/navbar"
import { signIn } from "../../../redux/slices/authSlice"
import axiosInstance from "../../../utils/axiosInstance"
import { toast } from "react-toastify"
import Loader from "../../../partials/Loader/Loader"

const Login = () => {
  
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const [newError, setNewError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const loginData = {
        email: data.email,
        password: data.password,
      }

      const response = await axiosInstance.post(
        "http://localhost:2222/user/login",
        loginData,
      )

      if (response.data.success == true) {
        if (response.data.isVerified == false) {
          await axiosInstance.post("http://localhost:2222/user/generateOTP", {
            email: data.email,
          })
          return navigate("/user/verifyOTP", {state: { email: data.email, type: "signIn" },
          })
        } else if (response.data.isVerified == true) {
          dispatch(signIn({ token: response.data.token, role: "user" }))
          navigate("/user/home",{replace:true})
        }
      }
    } catch (error) {
      setNewError(error.response?.data?.message || "Something Went Wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {

    try {
      const response = await axiosInstance.post(
        "http://localhost:2222/user/google",
        {
          credential: credentialResponse.credential,
        },
      )

      dispatch(signIn({token:response?.data?.token,role:"user"}))
      localStorage.setItem("token", response.data.token)

      navigate("/user/home",{replace:true})
    } catch (error) {
      console.log("GOOGLE LOGIN ERROR:", error)
      console.log("BACKEND ERROR:", error.response?.data)
    }
  }

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {isSubmitting && <Loader />}

      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">URBAN SOLE</h1>
          <p className="login-subtitle">Sign in to your account</p>

          {newError && <p className="form-error">{newError}</p>}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="login-form"
            noValidate
          >
            {/* Email Field */}
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                    message: "Please enter a valid Email",
                  },
                })}
              />
              {errors.email && (
                <p className="error-message">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="input-group">
              <div className="label-row">
                <label className="input-label">Password</label>
                <div className="label-row">
                  <label className="input-label"></label>
                  <span
                    className="forgot-link"
                    onClick={() => navigate("/user/forgottPassword")}
                  >
                    Forgot password?
                  </span>
                </div>
              </div>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                    validate: (value) =>
                      value.trim().length > 0 ||
                      "Password must be at least 6 characters",
                  })}
                  className="input-field password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-button"
                  aria-label="Toggle password visibility"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#555"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p className="error-message">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" className="login-btn">
              LOGIN
            </button>
          </form>

          {/* OR Divider */}
          <div className="divider-container">
            <div className="divider-line" />
            <span className="divider-text">OR</span>
            <div className="divider-line" />
          </div>

          {/* Google Sign In */}
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log("Google Login Failed")
            }}
          />

          {/* Footer */}
          <p className="footer-text">
            Don't have an account?{" "}
            <a href="/user/signup" className="signup-link">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

export default Login
