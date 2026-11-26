import axios from "axios"
import { toast } from "react-toastify"
import { STATUS_CODES } from "../constants/statusCodes"

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Local development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return import.meta.env.VITE_API_URL || "http://localhost:2222";
    }

    // Production / Global URL
    // If running on domain/subdomain or IP, ensure we match current origin to prevent mixed-content or CORS issues
    if (import.meta.env.VITE_API_URL) {
      try {
        const parsed = new URL(import.meta.env.VITE_API_URL);
        if (
          hostname === parsed.hostname ||
          hostname.includes("yazid.live") ||
          parsed.hostname.includes("yazid.live")
        ) {
          return `${window.location.origin}/api`;
        }
        return import.meta.env.VITE_API_URL;
      } catch {
        return import.meta.env.VITE_API_URL;
      }
    }
    return `${window.location.origin}/api`;
  }
  return import.meta.env.VITE_API_URL || "http://localhost:2222";
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
})

axiosInstance.interceptors.request.use(
  (config) => {
    // If config.url has hardcoded localhost:2222, strip it so it routes through baseURL
    if (config.url && typeof config.url === "string") {
      config.url = config.url.replace(/^https?:\/\/localhost:2222/i, "");
    }

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
    const requestUrl = error.config?.url || "";

    // Do not treat authentication/login endpoints as expired sessions
    if (
      requestUrl.includes("/user/login") ||
      requestUrl.includes("/user/google") ||
      requestUrl.includes("/admin/login")
    ) {
      return Promise.reject(error);
    }

    // 1. Check if user is blocked
    if (
      error.response?.status === STATUS_CODES.FORBIDDEN ||
      errorMessage.toLowerCase().includes("blocked")
    ) {
      console.log("BLOCKED USER DETECTED")

      localStorage.removeItem("token")
      localStorage.removeItem("user")

      if (!toast.isActive("session-expired")) {
        toast.error(
          "Session expired Please login",
          {
            toastId: "session-expired",
            autoClose: 3000
          }
        )
      }

      setTimeout(() => {
        window.location.replace("/user/login")
      }, 1000)

      return Promise.reject(error)
    }

    // 2. Check if Token is Expired or Unauthorized (401)
    if (
      error.response?.status === STATUS_CODES.UNAUTHORIZED || 
      errorMessage.toLowerCase().includes("token expired") ||
      errorMessage.toLowerCase().includes("jwt expired") ||
      errorMessage.toLowerCase().includes("unauthorized") ||
      errorMessage.toLowerCase().includes("invalid or expired token")
    ) {
      console.log("TOKEN EXPIRED OR UNAUTHORIZED DETECTED")

      localStorage.removeItem("token")
      localStorage.removeItem("user")

      if (!toast.isActive("session-expired")) {
        toast.error(
          "Session expired Please login",
          {
            toastId: "session-expired",
            autoClose: 3000
          }
        )
      }

      setTimeout(() => {
        window.location.replace("/user/login")
      }, 1000)

      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default axiosInstance