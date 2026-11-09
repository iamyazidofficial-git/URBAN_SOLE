import "./ForgottPassword.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import Navbar from "../../../partials/navbar/navbar"
import axiosInstance from "../../../utils/axiosInstance"
import Loader from "../../../partials/Loader/Loader"

const ForgottPassword = () => {
  const [email, setEmail] = useState("")
  const [newError, setNewError] = useState("")
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e) => {
    setIsSubmitting(true)
    try {
      e.preventDefault()

      if (!email || email.trim() == "") {
        return setNewError("Email is required")
      }

      const response = await axiosInstance.post(
        "http://localhost:2222/user/forgottPassword",
        { email: email },
      )

      if (response.data.success == true) {
        await axiosInstance.post("http://localhost:2222/user/generateOTP", {
          email: response.data.email,
        })
        navigate("/user/verifyOTP", {
          replace:true,
          state: { email: response.data.email, type: "forgottPassword" },
        })
      }
    } catch (error) {
      return setNewError(
        error.response?.data?.message || "Something went wrong",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {isSubmitting && <Loader />}

      <div className="reset-password-container">
        <div className="reset-password-card">
          {/* Title matches the "Change Email" size */}
          <h1 className="title">FORGOT PASSWORD</h1>

          {/* Added a short instruction text for UX */}
          <p className="description">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          {newError && <p className="form-error">{newError}</p>}

          <form className="reset-form" noValidate onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="user-email">EMAIL ADDRESS</label>
              <input
                type="email"
                id="user-email"
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="submit-btn">
              CONTINUE
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ForgottPassword;
