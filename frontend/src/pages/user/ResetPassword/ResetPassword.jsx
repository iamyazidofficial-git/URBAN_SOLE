import "./ResetPassword.css"
import { useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import Navbar from "../../../partials/navbar/navbar"
import axiosInstance from "../../../utils/axiosInstance"
import Loader from "../../../partials/Loader/Loader"

const ResetPassword = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newError, setNewError] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e) => {
    setIsSubmitting(true)
    try {
      e.preventDefault()

      if (!password || password.trim() == "") {
        return setNewError("Password is required")
      }
      if (!confirmPassword || confirmPassword.trim() == "") {
        return setNewError("confrimPassword is required")
      }
      if (confirmPassword.trim() !== password.trim()) {
        return setNewError("Both are not matching")
      }

      const response = await axiosInstance.post(
        "http://localhost:2222/user/resetPassword",
        { email: email, password: password },
      )

      if (response.data.success == true) {
        navigate("/user/login", { replace: true })
      } else {
        return setNewError(response.data.message)
      }
    } catch (error) {
      console.log(error)
      setNewError(error.response?.data?.message || "Something went wrong")
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
          <h1 className="title">RESET PASSWORD</h1>

          {newError && <p className="form-error">{newError}</p>}

          <div className="form-group">
            <label htmlFor="new-password">NEW PASSWORD</label>
            <input
              type="password"
              id="new-password"
              placeholder="Enter new password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">CONFIRM NEW PASSWORD</label>
            <input
              type="password"
              id="confirm-password"
              placeholder="Re-enter new password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button className="update-btn" onClick={onSubmit}>
            UPDATE PASSWORD
          </button>

          <a href="#cancel" className="cancel-link">
            CANCEL
          </a>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
