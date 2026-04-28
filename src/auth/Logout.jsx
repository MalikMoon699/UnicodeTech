import React, { useState } from "react";
import "../assets/style/Logout.css";
import { CircleX, LogOut, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

const Logout = ({ onClose }) => {
  const { logout } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to logout. Try again.");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div
      aria-disabled={logoutLoading}
      onClick={onClose}
      className="model-overlay"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{ position: "relative" }}
        className="model-content-container logout-modal"
      >
        {logoutLoading ? (
          <Loader style={{ height: "230px" }} />
        ) : (
          <>
            <div className="logout-icon">
              <TriangleAlert size={48} />
            </div>

            <h2 className="logout-title">Confirm Logout!!!</h2>

            <p className="logout-text">
              Are you sure you want to log out from the dashboard?
            </p>

            <div className="logout-actions">
              <button
                className="logout-action-btn logout-action-primary"
                onClick={onClose}
                disabled={logoutLoading}
              >
                <span className="icon">
                  <CircleX />
                </span>
                Cancel
              </button>
              <button
                disabled={logoutLoading}
                onClick={handleLogout}
                className="logout-action-btn logout-action-secondary"
              >
                <span className="icon">
                  <LogOut />
                </span>
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Logout;
