import React from "react";
import "../assets/style/Logout.css";
import { CircleX, LogOut, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const Logout = ({ onClose }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to logout. Try again.");
    }
  };

  return (
    <div onClick={onClose} className="model-overlay">
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="model-content logout-modal"
      >
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
          >
            <span className="icon">
              <CircleX />
            </span>
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="logout-action-btn logout-action-secondary"
          >
            <span className="icon">
              <LogOut />
            </span>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout;
