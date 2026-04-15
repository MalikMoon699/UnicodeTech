import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { useEffect } from "react";

export const ProtectedRoute = ({ children, role = [] }) => {
  const navigate = useNavigate();
  const { authAllow, currentUser, loading } = useAuth();
  if (loading)
    return (
      <Loader
        loading={true}
        size="50"
        style={{ height: "85vh", width: "100%" }}
      />
    );

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
  const { authAllow, currentUser, loading } = useAuth();
  const navigate = useNavigate();

useEffect(() => {
  if (authAllow && currentUser) {
    if (currentUser.role === "admin") {
      navigate("/admin/dashboard");
    } else if (currentUser.role === "manager") {
      navigate("/manager/dashboard");
    } else {
      navigate("/dashboard");
    }
  }
}, [authAllow, currentUser, navigate]);

  if (loading) {
    return (
      <Loader
        loading={true}
        size="50"
        style={{ height: "85vh", width: "100%" }}
      />
    );
  }

  if (authAllow) return null;

  return children;
};
