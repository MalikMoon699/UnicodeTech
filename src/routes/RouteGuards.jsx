import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { getProperRoute } from "../utils/helper";

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

  const currentPath =
    window.location.pathname.replace(/^\/+/, "") + window.location.search;
  // const currentPath = window.location.pathname.replace(/^\/+/, "");

  const properRoute = getProperRoute({
    role: currentUser?.role,
    route: currentPath,
  });

  if (properRoute !== currentPath && `/${currentPath}` !== properRoute) {
    return <Navigate to={properRoute} replace />;
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
    const properRoute = getProperRoute({
      role: currentUser.role,
      route: "dashboard",
    });

    return <Navigate to={properRoute} replace />;
  }

  return children;
};
