import React, { useEffect, useRef } from "react";
import { toast } from "sonner";
import { WifiOff } from "lucide-react";
import "../assets/style/Offline.css";
import { useNavigate } from "react-router-dom";

const Offline = () => {
  const navigate = useNavigate();
  const toastShown = useRef(false);

  useEffect(() => {
    if (!toastShown.current) {
      toast.error("You are offline. Please check your internet connection.", {
        duration: 5000,
      });
      toastShown.current = true;
    }
  }, []);

  return (
    <div className="offline-and-content">
      <div className="offline-and-icon">
        <WifiOff size={60} />
      </div>

      <h1 className="offline-and-title">No Internet Connection</h1>

      <p className="offline-and-message">
        It seems you're currently offline. Please check your network and try
        again.
      </p>

      <button
        className="offline-and-retry-btn"
        onClick={() => {
          if (navigator.onLine) {
            navigate("/", { replace: true });
          } else {
            toast.warning("Still offline. Please check your connection.");
          }
        }}
      >
        Retry Connection
      </button>
    </div>
  );
};

export default Offline;
