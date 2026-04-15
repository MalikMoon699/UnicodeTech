import React from "react";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
        width: "100vw",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <h1
          style={{
            color: "var(--primary)",
            fontSize: "8rem",
            fontWeight: "700",
          }}
        >
          404
        </h1>
        <h3 style={{ fontSize: "1.5rem" }}>Page Not Found</h3>
        <p style={{ color: "var(--muted-foreground)", fontSize: "1rem" }}>
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "9px 18px",
              borderRadius: "5px",
              border: "1px solid var(--border)",
              background: "#fff",
              cursor: "pointer",
            }}
            onClick={() => navigate(-1)}
          >
            <span className="icon">
              <ArrowLeft size={16} />
            </span>
            Go Back
          </button>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "9px 18px",
              borderRadius: "5px",
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <span className="icon">
              <Home size={16} />
            </span>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
