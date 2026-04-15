import { useState } from "react";
import { Eye, EyeClosed, X, Zap } from "lucide-react";
import "../assets/style/CustomComponents.css";
import { IMAGES } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

export const Input = ({
  label = "",
  value = "",
  readOnly = false,
  setValue = "",
  placeholder = "",
  type = "input",
  InputType = "text",
  margin = "6px 0px 8px 0px",
  style = {},
  Icon = "",
  onClick = () => {},
}) => {
  const [show, setShow] = useState(false);
  const isPassword = InputType === "password";
  return (
    <>
      {label && <label className="custom-input-label">{label}</label>}
      {type === "textArea" ? (
        <textarea
          className="custom-textarea"
          style={{ margin, ...style }}
          type={InputType}
          value={value}
          readOnly={readOnly}
          onClick={onClick}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
      ) : type === "inputIcon" ? (
        <div className="custom-input-icon">
          {Icon && <Icon size={16} />}
          <input
            style={{ margin, ...style, paddingRight: isPassword ? "30px" : "" }}
            className="custom-input"
            type={isPassword ? (show ? "text" : "password") : InputType}
            value={value}
            readOnly={readOnly}
            onClick={onClick}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
          {isPassword && (
            <button
              onClick={() => setShow(!show)}
              className="icon custom-password-toggel"
            >
              {show ? <Eye size={16} /> : <EyeClosed size={16} />}
            </button>
          )}
        </div>
      ) : (
        <input
          className="custom-input"
          style={{ margin, ...style }}
          type={InputType}
          value={value}
          onClick={onClick}
          readOnly={readOnly}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </>
  );
};

export const ProfileImage = ({
  Image = "",
  bg = "var(--primary-hover)",
  borderC = "var(--primary)",
  className = "",
  style = {},
}) => {
  const [loaded, setLoaded] = useState(false);
  const [imageModel, setImageModel] = useState(null);

  return (
    <>
      <div
        style={{ border: `2px solid ${borderC}`, ...style }}
        className={`profile-image-container ${className}`}
        onClick={() => Image && setImageModel(Image)}
      >
        <div
          className="profile-image-inner"
          style={{ background: Image ? "" : bg }}
        >
          {Image && !loaded && <div className="profile-image-loader" />}
          {Image && (
            <img
              src={Image}
              alt=""
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              className={loaded ? "loaded" : ""}
            />
          )}
        </div>
      </div>

      {imageModel && (
        <ImageViewModel
          Image={imageModel}
          onClose={() => setImageModel(null)}
        />
      )}
    </>
  );
};

export const ImageViewModel = ({ Image = "", onClose }) => {
  const [loaded, setLoaded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState("center center");

  const handleDoubleClick = () => {
    setZoomed((prev) => !prev);
  };

  const handleMouseMove = (e) => {
    if (!zoomed) return;

    const { left, top, width, height } = e.target.getBoundingClientRect();

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setTransformOrigin(`${x}% ${y}%`);
  };

  return (
    <div onClick={onClose} className="model-overlay">
      <div
        onClick={(e) => e.stopPropagation()}
        className="model-img-preview-content"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="image-model-close"
        >
          <X size={18} />
        </button>

        <div
          style={
            Image && !loaded
              ? {
                  height: "90vh",
                  width: "600px",
                  alignItems: "start",
                  justifyContent: "start",
                }
              : {}
          }
          className="profile-image-inner"
        >
          {Image && !loaded && <div className="profile-image-loader" />}
          {Image && (
            <img
              src={Image}
              alt=""
              onLoad={() => setLoaded(true)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = IMAGES.NotFound;
                setLoaded(true);
              }}
              onDoubleClick={handleDoubleClick}
              onMouseMove={handleMouseMove}
              style={{
                cursor: zoomed ? "zoom-out" : "zoom-in",
                transformOrigin: transformOrigin,
              }}
              className={`${loaded ? "loaded" : ""} ${zoomed ? "zoomed" : ""}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const TopBar = ({ title = "", updateCredits = null }) => {
  const { currentUser } = useAuth();
  const [isCreadit, setIsCreadit] = useState(false);
  const [isAddMore, setIsAddMore] = useState(false);
  const isPremium = currentUser?.accountType === "premiumUser";

  const creadit =
    updateCredits !== null ? updateCredits : currentUser?.credits || 0;

  const colorSuggestion = () => {
    if (creadit < 10) {
      return "var(--status-rejected)";
    } else if (creadit < 50) {
      return "var(--status-pending)";
    } else {
      return "var(--primary)";
    }
  };

  return (
    <>
      <div className="custom-topbar-container">
        <div className="custom-topbar-inner-container">
          <h2 className="custom-topbar-title">{title}</h2>
          <h4
            onClick={() => {
              if (!isPremium) {
                setIsCreadit(true);
              }
            }}
            className="custom-topbar-credit"
            style={{ color: isPremium ? "var(--primary)" : colorSuggestion() }}
          >
            <span className="icon">
              <Zap size={16} />
            </span>
            {isPremium ? "Unlimited" : creadit} credits
          </h4>
        </div>
      </div>
      {isCreadit && (
        <div className="model-overlay">
          <div className="model-content">
            <div className="model-header">
              <h2 className="model-header-title">
                {isAddMore ? "Add" : "Your"} Credits
              </h2>
              <button
                className="model-header-close-btn"
                onClick={() => {
                  setIsAddMore(false);
                  setIsCreadit(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="model-content-container">
              {isAddMore ? (
                <PrincingCard />
              ) : (
                <>
                  <h2 style={{ width: "100%", textAlign: "center" }}>
                    Credit Information
                  </h2>
                  <p style={{ width: "100%", textAlign: "center" }}>
                    You have{" "}
                    <span style={{ color: colorSuggestion() }}>
                      {creadit || 0}
                    </span>{" "}
                    credits available now for use.
                  </p>
                  <button
                    onClick={() => setIsAddMore(true)}
                    className="api-generate-btn"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "11px 14px",
                      marginTop: "20px",
                    }}
                  >
                    Add More Credits
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};