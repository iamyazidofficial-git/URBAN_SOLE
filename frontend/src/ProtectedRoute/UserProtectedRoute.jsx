import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

const UserProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      if (!toast.isActive("session-expired")) {
        toast.error("Session expired Please login", {
          toastId: "session-expired",
          autoClose: 3000
        });
      }
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/user/login" replace />;
  }

  return children;
};

export default UserProtectedRoute;
