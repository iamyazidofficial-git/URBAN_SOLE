import axios from "axios"
import { useDispatch } from "react-redux"
import React, { useState } from "react"
import "./signup.css"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import Navbar from "../../../partials/navbar/navbar"
import axiosInstance from "../../../utils/axiosInstance"
import Loader from "../../../partials/Loader/Loader"

const Signup = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()
  const [newError, setNewError] = useState("")
  const [loading, setIsLoading] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const password = watch("password")

  const onSubmit = async (data) => {
    setIsLoading(true)
    setNewError("")

    try {
      const { confirmPassword, ...signupData } = data

      const response = await axiosInstance.post("/user/signup", signupData)

      if (response.data.success === true) {
        await axiosInstance.post("/user/generateOTP", {
          email: response.data.email,
        })

        navigate("/user/verifyOTP", {
          replace:true,
          state: {
            type: "signIn",
            email: response.data.email,
          },
        })
      }
    } catch (error) {
      setNewError(error.response?.data?.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/*Navbar*/}

      <Navbar />

      {loading && <Loader />}

      <div className="signup-page">
        <div className="signup-container">
          <h1>JOIN US</h1>

          <p className="signup-description">
            Create your Urban Sole account for exclusive
            <br />
            access to drops and member benefits.
          </p>

          {newError && <p className="form-error">{newError}</p>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label>FULL NAME</label>
              <input
                type="text"
                placeholder="Enter your full name"
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
                <p className="error-message">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label>EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="Enter your email"
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

            {/* Gender */}
            <div className="form-group">
              <label>GENDER</label>

              <div className="select-wrapper">
                <select
                  {...register("gender", {
                    required: "Gender is required",
                  })}
                >
                  <option value="">Select...</option>

                  <option value="male">Male</option>

                  <option value="female">Female</option>

                  <option value="other">Other</option>
                </select>
              </div>

              {errors.gender && (
                <p className="error-message">{errors.gender.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label>PASSWORD</label>

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                    pattern: {
                      value: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                      message:
                        "Password must contain at least one letter and one number",
                    },
                  })}
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  👁
                </button>
              </div>

              {errors.password && (
                <p className="error-message">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label>CONFIRM PASSWORD</label>

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  {...register("confirmPassword", {
                    required: "Confirm password is required",

                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                />
              </div>

              {errors.confirmPassword && (
                <p className="error-message">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Referral */}
            <div className="form-group">
              <label>REFERRAL CODE (OPTIONAL)</label>

              <input
                type="text"
                placeholder="Enter code (optional)"
                {...register("referralCode")}
              />
            </div>
            {/* Submit */}
            <button type="submit" className="create-account-btn">
              CREATE ACCOUNT
            </button>
          </form>

          <a href="/user/login" className="login-text">
            Already have an account? <span>Login</span>
          </a>
        </div>
      </div>
    </>
  )
}

export default Signup
