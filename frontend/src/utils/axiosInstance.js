import axios from "axios"
import { toast } from "react-toastify"

const axiosInstance = axios.create({
  baseURL: "http://localhost:2222",
})

axiosInstance.interceptors.request.use(
  (config) => {
    console.log("AXIOS REQUEST:", config.method, config.url)
    const token = localStorage.getItem("token")
    console.log("AXIOS TOKEN:", token)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },

  (error) => {
    console.log("AXIOS INTERCEPTOR")
    console.log("STATUS:", error.response?.status)
    console.log("MESSAGE:", error.response?.data?.message)

    const errorMessage = error.response?.data?.message || "";

    // 1. Check if user is blocked
    if (
      error.response?.status === 403 &&
      errorMessage === "Your account has been blocked"
    ) {
      console.log("BLOCKED USER DETECTED")

      localStorage.removeItem("token")
      localStorage.removeItem("user") // യൂസർ ഡാറ്റ ഉണ്ടെങ്കിൽ അതും കളയാം

      if (!toast.isActive("blocked-user")) {
        toast.error(
          "You have been blocked. Please contact admin.",
          {
            toastId: "blocked-user",
            autoClose: 5000
          }
        )
      }

      setTimeout(() => {
        window.location.replace("/user/login")
      }, 5000)

      return Promise.reject(error)
    }

    // 2. Check if Token is Expired or Unauthorized (401)
    if (
      error.response?.status === 401 || 
      errorMessage.toLowerCase().includes("token expired") ||
      errorMessage.toLowerCase().includes("jwt expired") ||
      errorMessage.toLowerCase().includes("unauthorized")
    ) {
      console.log("TOKEN EXPIRED OR UNAUTHORIZED DETECTED")

      localStorage.removeItem("token")
      localStorage.removeItem("user")

      if (!toast.isActive("token-expired")) {
        toast.error(
          "Session expired. Please log in again.",
          {
            toastId: "token-expired",
            autoClose: 4000
          }
        )
      }

      setTimeout(() => {
        window.location.replace("/user/login")
      }, 4000)

      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default axiosInstance