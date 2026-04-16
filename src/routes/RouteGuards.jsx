import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

export const ProtectedRoute = ({ children, role = [] }) => {
  const { authAllow, currentUser, authLoading } = useAuth();
  if (authLoading) {
    return (
      <Loader
        loading={true}
        size="50"
        style={{ height: "85vh", width: "100%" }}
      />
    );
  }

  if (!authAllow) return <Navigate to="/auth" replace />;

  if (
    currentUser?.role === "admin" &&
    window.location.pathname === "/dashboard"
  ) {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (
    currentUser?.role === "manager" &&
    window.location.pathname === "/dashboard"
  ) {
    return <Navigate to="/manager/dashboard" replace />;
  }

  if (role.length && !role.includes(currentUser.role)) {
    return <Navigate to="/404" replace />;
  }
  return children;
};

export const PublicRoute = ({ children }) => {
  const { authAllow, currentUser, authLoading } = useAuth();
  if (authLoading) {
    return (
      <Loader
        loading={true}
        size="50"
        style={{ height: "85vh", width: "100%" }}
      />
    );
  }

  if (authAllow && currentUser) {
    if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (currentUser.role === "manager") {
      return <Navigate to="/manager/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
