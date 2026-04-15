import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  ChartColumn,
  Clock,
  Code2,
  Crown,
  Key,
  MessageCircle,
  Moon,
  Shield,
  Sparkles,
  Sun,
  User,
  Users,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import "../assets/style/LandingPage.css";
import { IMAGES } from "../utils/constants";

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="lading-page-container">
      <div className="landing-page-header">
        <div className="landing-page-header-inner">
          <div className="landing-page-logo">
            <div className="landing-page-logo-icon icon">
              <img
                src={theme === "dark" ? IMAGES.SiteLogoWhite : IMAGES.SiteLogo}
                alt=""
              />
            </div>
            <span className="landing-page-logo-text">UnicodeTech</span>
          </div>
          <div className="landing-page-header-actions">
            <button
              onClick={toggleTheme}
              className="landing-page-icon-btn icon"
            >
              {theme === "dark" ? (
                <Sun className="landing-page-icon" />
              ) : (
                <Moon className="landing-page-icon" />
              )}
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="landing-page-btn landing-page-btn-ghost"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/auth?formType=signUp")}
              className="landing-page-btn landing-page-btn-primary"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
      <section className="landing-page-hero">
        <div className="landing-page-hero-inner">
          <div className="landing-page-hero-badge">
            <Sparkles size={18} color="var(--primary)" />
            Fully secure & trusted
          </div>

          <h1 className="landing-page-hero-title">
            Smart Office Management{" "}
            <span className="landing-page-text-primary">
              {" "}
              for Modern Teams
            </span>{" "}
          </h1>
          <p className="landing-page-hero-subtitle">
            Streamline attendance, leave management, team communication, and
            daily reports — all in one beautiful platform.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="landing-page-btn landing-hero-btn landing-page-btn-primary"
          >
            Get Started
            <span className="icon">
              <ArrowRight />
            </span>
          </button>
        </div>
      </section>
      <div
        style={{
          position: "relative",
          zIndex: "1",
          background: "var(--background)",
        }}
      >
        <section className="landing-page-features">
          <div className="landing-page-section-header">
            <h1 className="landing-page-section-label">Features</h1>
            <h2 className="landing-page-section-title">
              Everything you need to run your office
            </h2>
            <p className="landing-page-section-subtitle">
              Powerful tools that simplify your day-to-day operations and boost
              team productivity.
            </p>
          </div>
          <div className="landing-page-features-inner">
            <div className="landing-page-features-grid">
              <div className="landing-page-feature-card">
                <div className="landing-page-feature-icon-wrapper">
                  <Clock className="landing-page-icon-feature icon" />
                </div>
                <h3 className="landing-page-feature-title">
                  Attendance Tracking
                </h3>
                <p className="landing-page-feature-desc">
                  Seamless check-in/check-out with real-time monitoring and
                  monthly calendars.
                </p>
              </div>
              <div className="landing-page-feature-card">
                <div className="landing-page-feature-icon-wrapper">
                  <CalendarDays className="landing-page-icon-feature icon" />
                </div>
                <h3 className="landing-page-feature-title">Leave Management</h3>
                <p className="landing-page-feature-desc">
                  Apply, approve, and track leaves with automated workflows.
                </p>
              </div>
              <div className="landing-page-feature-card">
                <div className="landing-page-feature-icon-wrapper">
                  <MessageCircle className="landing-page-icon-feature icon" />
                </div>
                <h3 className="landing-page-feature-title">Team Chat</h3>
                <p className="landing-page-feature-desc">
                  Real-time messaging with direct and group conversations.
                </p>
              </div>
              <div className="landing-page-feature-card">
                <div className="landing-page-feature-icon-wrapper">
                  <ChartColumn className="landing-page-icon-feature icon" />
                </div>
                <h3 className="landing-page-feature-title">
                  Reports & Analytics
                </h3>
                <p className="landing-page-feature-desc">
                  Daily status reports and comprehensive performance analytics.
                </p>
              </div>

              <div className="landing-page-feature-card">
                <div className="landing-page-feature-icon-wrapper">
                  <Shield className="landing-page-icon-feature icon" />
                </div>
                <h3 className="landing-page-feature-title">
                  Role-Based Access
                </h3>
                <p className="landing-page-feature-desc">
                  Granular permissions for Admin, Manager, and Employee roles.
                </p>
              </div>

              <div className="landing-page-feature-card">
                <div className="landing-page-feature-icon-wrapper">
                  <Users className="landing-page-icon-feature icon" />
                </div>
                <h3 className="landing-page-feature-title">Team Management</h3>
                <p className="landing-page-feature-desc">
                  Organize teams, track performance, and manage resources.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-page-features">
          <div className="landing-page-section-header">
            <h1 className="landing-page-section-label">Roles</h1>
            <h2 className="landing-page-section-title">
              Designed for every level
            </h2>
            <p className="landing-page-section-subtitle">
              Each role gets a tailored experience with exactly the tools they
              need.
            </p>
          </div>
          <div className="landing-page-features-inner">
            <div className="landing-page-role-grid">
              <div
                style={{ width: "fit-content", minWidth: "280px" }}
                className="landing-page-feature-card"
              >
                <div className="landing-page-role-card-icon-wrapper">
                  <span className="role-card-icon">
                    <Crown size={30} />
                  </span>
                </div>
                <h1 className="landing-page-role-title">Admin (Boss)</h1>
                <ul className="landing-page-role-list">
                  <li className="landing-page-role-list-item">
                    Full company analytics
                  </li>
                  <li className="landing-page-role-list-item">
                    View all attendance & leaves
                  </li>
                  <li className="landing-page-role-list-item">
                    Monitor all day-end reports
                  </li>
                  <li className="landing-page-role-list-item">
                    Manage all chats & groups
                  </li>
                </ul>
              </div>
              <div
                style={{ width: "fit-content", minWidth: "280px" }}
                className="landing-page-feature-card"
              >
                <div className="landing-page-role-card-icon-wrapper">
                  <span className="role-card-icon manager">
                    <Briefcase size={30} />
                  </span>
                </div>
                <h1 className="landing-page-role-title">Manager</h1>
                <ul className="landing-page-role-list">
                  <li className="landing-page-role-list-item">
                    Personal + team dashboards
                  </li>
                  <li className="landing-page-role-list-item">
                    Approve/reject team leaves
                  </li>
                  <li className="landing-page-role-list-item">
                    Review team submissions
                  </li>
                  <li className="landing-page-role-list-item">
                    Create & manage group chats
                  </li>
                </ul>
              </div>
              <div
                style={{ width: "fit-content", minWidth: "280px" }}
                className="landing-page-feature-card"
              >
                <div className="landing-page-role-card-icon-wrapper">
                  <span className="role-card-icon user">
                    <User size={30} />
                  </span>
                </div>
                <h1 className="landing-page-role-title">Employee</h1>
                <ul className="landing-page-role-list">
                  <li className="landing-page-role-list-item">
                    Personal performance stats
                  </li>
                  <li className="landing-page-role-list-item">
                    Mark daily attendance
                  </li>
                  <li className="landing-page-role-list-item">
                    Apply for leave
                  </li>
                  <li className="landing-page-role-list-item">
                    Submit day-end status
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <div className="landing-page-footer">
          © {new Date().getFullYear()} UnicodeTech. All rights reserved.
        </div>{" "}
      </div>
    </div>
  );
};

export default LandingPage;
