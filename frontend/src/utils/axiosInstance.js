import axios from "axios"
import { toast } from "react-toastify"
import { STATUS_CODES } from "../constants/statusCodes"

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:2222",
})

let isRedirectingToLogin = false

const clearAuthAndRedirect = (toastId, message, delayMs) => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")

  if (!toast.isActive(toastId)) {
    toast.error(message, {
      toastId,
      autoClose: delayMs,
    })
  }

  if (!isRedirectingToLogin && window.location.pathname !== "/user/login") {
    isRedirectingToLogin = true
    setTimeout(() => {
      isRedirectingToLogin = false
      window.location.replace("/user/login")
    }, delayMs)
  }
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const errorMessage = (error.response?.data?.message || "").toLowerCase()
    const hadToken = Boolean(localStorage.getItem("token"))

    // 1. User blocked by admin (403)
    if (
      status === STATUS_CODES.FORBIDDEN &&
      errorMessage === "your account has been blocked"
    ) {
      clearAuthAndRedirect(
        "blocked-user",
        "You have been blocked. Please contact admin.",
        5000
      )
      return Promise.reject(error)
    }

    // 2. Token expired or unauthorized (401)
    const isAuthFailure =
      status === STATUS_CODES.UNAUTHORIZED ||
      errorMessage.includes("token expired") ||
      errorMessage.includes("jwt expired") ||
      errorMessage.includes("unauthorized")

    if (isAuthFailure && hadToken) {
      clearAuthAndRedirect(
        "token-expired",
        "Session expired. Please log in again.",
        4000
      )
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default axiosInstance