import React, { useState, useMemo } from "react";
import "../assets/style/AllowIosPush.css";
import { Settings } from "lucide-react";
import { toast } from "sonner";

const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isAtHome = window.matchMedia("(display-mode: standalone)").matches;
const isPermissionAllowed = Notification?.permission === "granted";

const AllowIosPush = () => {
  const [isPermissionWant, setIsPermissionWant] = useState(true);
  const [isInstruction, setIsInstruction] = useState(false);
  const showContent = "noAtHome";

  const onClose = () => {
    setIsPermissionWant(false);
  };

  //   const getContent = () => {
  //     if (isIOSDevice && !isSafari) {
  //       return {
  //         label: "Please open this app in Safari to continue.",
  //         buttonLabel: "Open Safari",
  //         buttonActions: () => {
  //           window.location.href = "x-web-search://";
  //         },
  //       };
  //     }

  //     if (isIOSDevice && isSafari && !isAtHome) {
  //       return {
  //         label: "Add this app to your Home Screen for better experience.",
  //         buttonLabel: "How to Add",
  //         buttonActions: () => {
  //           alert("Tap Share button → Add to Home Screen");
  //         },
  //       };
  //     }

  //     if (isAtHome && !isPermissionAllowed) {
  //       return {
  //         label: "Enable notifications to stay updated.",
  //         buttonLabel: "Enable",
  //         buttonActions: async () => {
  //           const permission = await Notification.requestPermission();
  //           console.log("Permission:", permission);
  //         },
  //       };
  //     }

  //     return null;
  //   };

  const getContent = () => {
    if (showContent === "noSafari") {
      return {
        label: "Please open this app in Safari to allow notification.",
        buttonLabel: "Copy Link",
        buttonActions: async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied!");
          } catch (err) {
            toast.error("Failed to copy link");
          }
        },
      };
    }

    if (showContent === "noAtHome") {
      return {
        label: "Add this app to your Home Screen for allow notification.",
        buttonLabel: "How to Add",
        buttonActions: () => {
          setIsInstruction(true);
          //   alert("Tap Share button → Add to Home Screen");
        },
      };
    }

    if (showContent === "noPermision") {
      return {
        label: "Enable notifications to stay updated.",
        buttonLabel: "Enable",
        buttonActions: async () => {
          const permission = await Notification.requestPermission();
          console.log("Permission:", permission);
        },
      };
    }

    return null;
  };

  const content = useMemo(() => getContent(), []);

  if (!isPermissionWant || !content) return null;

  return (
    <div className="allow-ios-push-container">
      <div className="allow-ios-push-content-container">
        <span className="icon">
          <Settings />
        </span>

        <p className="allow-ios-push-content">
          {content?.label}
          <span
            className="allow-ios-push-content-btn"
            onClick={content?.buttonActions}
          >
            {content?.buttonLabel}
          </span>
        </p>
      </div>

      <button className="model-header-close-btn" onClick={onClose}>
        &times;
      </button>
      {isInstruction && <Instruction onClose={() => setIsInstruction(false)} />}
    </div>
  );
};

export default AllowIosPush;

const Instruction = ({ onClose }) => {
  return (
    <div className="model-overlay">
      <div className="model-content">
        <div className="model-header">
          <h3 className="model-header-title">Instruction</h3>
          <button className="model-header-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="model-content-container"></div>
      </div>
    </div>
  );
};
