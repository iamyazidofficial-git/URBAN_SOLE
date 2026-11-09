import { useState } from "react"
import "./ChangeEmail.css"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import Navbar from "../../../partials/navbar/navbar"
import axiosInstance from "../../../utils/axiosInstance"
import { useForm } from "react-hook-form"
import Loader from "../../../partials/Loader/Loader"

const ChangeEmail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const currentEmail = location.state?.currentEmail || ""
  const [newError, setNewError] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()


  const newEmailValue = watch("newEmail", "")

  const onSubmit = async (data) => {
    try {
      const response = await axiosInstance.put(
        "http://localhost:2222/user/profile/editUser",
        {
          email: currentEmail,
          newEmail: data.newEmail,
          type: "changeEmail",
        },
      )

      if (response.data.success === true) {
        await axios.post("http://localhost:2222/user/generateOTP", {
          email: data.newEmail,
        })

        navigate("/user/verifyOTP", {
          replace: true,
          state: {
            email: currentEmail,
            newEmail: data.newEmail,
            type: "changeEmail",
          },
        })
      }
    } catch (error) {
      setNewError(error.response?.data?.message || "something went wrong")
      console.error(error)
    }
  }

  return (
    <>
      <Navbar />

      {isSubmitting && <Loader />}

      <div className="change-email-container">
        <form
          className="change-email-card"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <h1 className="title">CHANGE EMAIL</h1>

          {newError && <p className="form-error">{newError}</p>}

          <div className="form-group">
            <label htmlFor="current-email">CURRENT EMAIL</label>
            <input
              type="email"
              id="current-email"
              defaultValue={currentEmail}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-email">NEW EMAIL ADDRESS</label>
            <input
              type="email"
              id="new-email"
              placeholder="Enter new email"
              {...register("newEmail", {
                required: "Email is required",
                setValueAs: (value) => value.trim(),
                pattern: {
                  value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                  message: "Enter a valid Email",
                },
              })}
            />
            {errors.newEmail && (
              <span className="error-message">{errors.newEmail.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirm-email">CONFIRM NEW EMAIL</label>
            <input
              type="email"
              id="confirm-email"
              placeholder="Confirm new email"
              {...register("confirmEmail", {
                required: "Please confirm your email",
                setValueAs: (value) => value.trim(),
                validate: (value) =>
                  value.trim().toLowerCase() ===
                    newEmailValue.trim().toLowerCase() ||
                  "Both are not matching",
              })}
            />
            {errors.confirmEmail && (
              <span className="error-message">
                {errors.confirmEmail.message}
              </span>
            )}
          </div>

          <button type="submit" className="update-btn" disabled={isSubmitting}>
            UPDATE EMAIL
          </button>

          <button
            type="button"
            className="cancel-link"
            onClick={() => navigate("/user/profile", { replace: true })}
          >
            CANCEL
          </button>
        </form>
      </div>
    </>
  );
};

export default ChangeEmail;
