import React, { useEffect, useMemo, useRef, useState } from "react";
import "../assets/style/CustomComponents.css";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeClosed,
  Search,
  X,
} from "lucide-react";
import { IMAGES } from "../utils/constants";
import Loader from "./Loader";

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

export const LoadMore = ({
  loading = false,
  disabled = false,
  show = false,
  onLoad,
  style = {},
}) => {
  return (
    show && (
      <div style={style} className="custom-loadMore-container">
        {loading ? (
          <Loader stroke="3" size="30" />
        ) : (
          <button
            disabled={disabled}
            onClick={onLoad}
            className="custom-load-more-btn"
          >
            Load More
          </button>
        )}
      </div>
    )
  );
};

export const StorageSearch = ({
  disabled = false,
  setValue,
  placeholder = "Search...",
  margin = "",
  width = "",
  storage = "searchHistory",
}) => {
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const boxRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(storage)) || [];
    setHistory(stored);
  }, [storage]);

  const handleSearch = () => {
    if (!search.trim()) return;
    setValue(search);
    let updatedHistory = [search, ...history.filter((item) => item !== search)];
    localStorage.setItem(storage, JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearch("");
    setValue("");
    setShowSuggestions(false);
  };

  const filteredHistory = history?.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRemoveItem = (itemToRemove) => {
    const updated = history.filter((item) => item !== itemToRemove);

    setHistory(updated);
    localStorage.setItem(storage, JSON.stringify(updated));
  };

  const handleClearstorage = () => {
    setHistory([]);
    localStorage.removeItem(storage);
  };

  return (
    <div className="customs-search-box" ref={boxRef} style={{ margin, width }}>
      <Search className="customs-search-icon" />
      <input
        disabled={disabled}
        value={search}
        onChange={(e) => {
          const value = e.target.value;
          if (!value.trim()) {
            handleClearSearch();
          } else {
            setSearch(value);
            setShowSuggestions(true);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="customs-search-input"
      />
      {search.trim() && (
        <X
          className="customs-search-icon icon custom-suggestion-item-remove-btn"
          size={15}
          onClick={handleClearSearch}
        />
      )}
      {showSuggestions && (
        <div className="custom-search-suggestions">
          {filteredHistory.length > 0 ? (
            <>
              <div className="custom-suggestion-items-container">
                {filteredHistory.map((item, index) => (
                  <div
                    key={index}
                    className="custom-suggestion-item"
                    onClick={() => {
                      setSearch(item);
                      setValue(item);
                      setShowSuggestions(false);
                    }}
                  >
                    <p className="elepsis">{item}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item);
                      }}
                      className="icon custom-suggestion-item-remove-btn"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div
                className="custom-suggestion-item"
                style={{
                  justifyContent: "center",
                  borderTop: "1px solid var(--border)",
                  padding: "10px 3px",
                }}
                onClick={handleClearstorage}
              >
                Clear All
              </div>
            </>
          ) : (
            <div
              className="custom-suggestion-item"
              style={{
                justifyContent: "center",
                padding: "15px 6px",
                cursor: "default",
              }}
            >
              No history found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SearchInput = ({
  disabled = false,
  setValue,
  value,
  placeholder = "Search...",
  margin = "",
  width = "",
}) => {
  return (
    <div className="customs-search-box" style={{ margin, width }}>
      <Search className="customs-search-icon" />
      <input
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="customs-search-input"
      />
    </div>
  );
};

export const Selector = ({
  disabled = false,
  filter,
  setFilter,
  options,
  position = "right",
  width = "100%",
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const selectorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sortedOptions = useMemo(() => {
    if (!options || !filter) return options;

    const selected = options.find((opt) => opt.filter === filter);
    const others = options.filter((opt) => opt.filter !== filter);

    return selected ? [selected, ...others] : options;
  }, [options, filter]);

  const selectedOption = options?.find((option) => option.filter === filter);

  return (
    <div
      ref={selectorRef}
      onClick={() => setIsFilterOpen(!isFilterOpen)}
      disabled={disabled}
      style={{ width }}
      className={`customers-filter-container ${disabled ? "disabled" : ""}`}
    >
      <div className="customers-filter-selector">
        <span className="elepsis">{selectedOption?.label || filter}</span>
        <span className="icon">
          {isFilterOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </span>
      </div>
      {isFilterOpen && (
        <div
          className={`customers-filter-selection-container ${
            position === "left"
              ? "customers-filter-selection-container-left"
              : ""
          }`}
        >
          {sortedOptions &&
            sortedOptions.map((option, index) => {
              const isActive = option?.filter === filter;
              return (
                <button
                  key={index}
                  disabled={isActive}
                  onClick={() => {
                    setFilter(option?.filter);
                    setIsFilterOpen(false);
                  }}
                  className={`customers-filter-item ${
                    isActive ? "active" : ""
                  }`}
                >
                  {isActive && (
                    <span>
                      <Check size={13} />
                    </span>
                  )}
                  {option?.label}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};

export const StatesCard = ({
  icon: Icon,
  iColor = "var(--primary)",
  title = "",
  value = "",
  loading = false,
}) => {
  return (
    <div className="custom-dashboard-stat-card">
      <div className="custom-dashboard-stat-card-content">
        <p className="custom-dashboard-stat-title">{title}</p>
        <h3 className="custom-dashboard-stat-value">
          {loading ? <Loader size="25" stroke="2" /> : <>{value}</>}
        </h3>
      </div>
      <div className="custom-dashboard-stat-icon">
        <Icon color={iColor} />
      </div>
    </div>
  );
};

export const Header = ({
  title = "",
  desc = "",
  context = null,
  isTab = false,
  tabDisabled = false,
  tabState,
  setTabState,
  tabOptions,
  tabOuterWidth = "100%",
  tabInnerWidth = "fit-content",
}) => {
  return (
    <div className="custom-header-container">
      <div className="custom-header-content">
        <h1 className="custom-header-title">{title}</h1>
        <p className="custom-header-desc">{desc}</p>
      </div>
      {context}
      {isTab && (
        <Tabs
          disabled={tabDisabled}
          tab={tabState}
          setTab={setTabState}
          options={tabOptions}
          outerWidth={tabOuterWidth}
          innerWidth={tabInnerWidth}
        />
      )}
    </div>
  );
};

export const Tabs = ({
  disabled = false,
  tab,
  setTab,
  options,
  outerWidth = "100%",
  innerWidth = "fit-content",
}) => {
  return (
    <div style={{ width: outerWidth }} className="custom-tab-outer-container">
      <div style={{ width: innerWidth }} className="custom-tab-inner-container">
        {options?.map((item, index) => {
          const isActive = item?.value === tab;
          const Icon = item?.icon;
          return (
            <button
              className={`custom-tab-item ${isActive ? "active" : ""}`}
              disabled={disabled}
              key={index}
              onClick={() => setTab(item?.value)}
            >
              <span className="icon">
                <Icon size={20} />
              </span>
              {item?.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
