import React, { useState } from "react";
import { LogOut, X, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import "../assets/style/SideBar.css";
import {
  IMAGES,
  AdminSidebarMenu,
  ManagerSidebarMenu,
  UserSidebarMenu,
} from "../utils/constants";
import { useLocation, useNavigate } from "react-router";
import Logout from "../auth/Logout";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const SideBar = ({ isHalfSideBar, setIsHalfSideBar }) => {
  const { currentUser, authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSideBar, setIsSideBar] = useState(false);
  const [isLogout, setIsLogout] = useState(false);

  const SidebarMenuItems =
    currentUser && currentUser?.role === "admin"
      ? AdminSidebarMenu
      : currentUser?.role === "manager"
        ? ManagerSidebarMenu
        : UserSidebarMenu;

  return (
    <>
      <div className="mobile-topbar-container">
        <img
          onClick={() => {
            navigate("/");
          }}
          src={theme === "dark" ? IMAGES.SiteLogoWhite : IMAGES.SiteLogo}
          alt="Unicode Logo"
          className="sidebar-logo"
        />
        <button
          onClick={() => {
            setIsSideBar(!isSideBar);
          }}
        >
          <Menu />
        </button>
      </div>
      <aside
        className={`sidebar-container desktop-sidebar-container ${
          isHalfSideBar ? "sidebar-desktop-closed" : ""
        }`}
      >
        <div
          style={{
            justifyContent: isHalfSideBar ? "center" : "",
            padding: isHalfSideBar ? "30px 10px" : "",
          }}
          className="sidebar-header"
        >
          {!isHalfSideBar && (
            <div>
              <img
                src={theme === "dark" ? IMAGES.SiteLogoWhite : IMAGES.SiteLogo}
                alt="Unicode Logo"
                className="sidebar-logo"
              />
            </div>
          )}
          <button
            className="sidebar-close-btn"
            onClick={() => {
              setIsHalfSideBar(!isHalfSideBar);
            }}
          >
            <span className={isHalfSideBar ? "right-arrow" : "left-arrow"}>
              {isHalfSideBar ? (
                <LucideIcons.PanelLeftOpen size={30} />
              ) : (
                <LucideIcons.PanelLeftClose size={30} />
              )}
            </span>
          </button>
        </div>

        <div className="sidebar-divider" />

        <nav
          style={{ padding: isHalfSideBar ? "12px 8px" : "" }}
          className="sidebar-menu"
        >
          {authLoading ? (
            <SidebarSkeleton isHalfSideBar={isHalfSideBar} />
          ) : (
            SidebarMenuItems.map((item, index) => {
              const Icon = LucideIcons[item.icon];
              return (
                <div
                  key={index}
                  onClick={() => {
                    navigate(item.route);
                    setIsSideBar(false);
                  }}
                  className={`sidebar-item ${
                    location.pathname === item.activeAt ||
                    (item.startsWith &&
                      item.startsWith.some((path) =>
                        location.pathname.startsWith(path),
                      ))
                      ? "sidebar-item-active"
                      : ""
                  }`}
                >
                  <Icon className="sidebar-icon" />
                  {!isHalfSideBar && (
                    <span className="sidebar-label">{item.name}</span>
                  )}
                </div>
              );
            })
          )}
        </nav>
        <div
          style={{ padding: isHalfSideBar ? "12px 8px" : "" }}
          className="sidebar-footer"
        >
          <button
            onClick={() => {
              setIsLogout(true);
            }}
            className="sidebar-logout-btn"
            style={{ justifyContent: isHalfSideBar ? "center" : "" }}
          >
            <span className="icon">
              <LogOut />
            </span>
            {!isHalfSideBar && "Logout"}
          </button>
        </div>
        {isLogout && <Logout onClose={() => setIsLogout(false)} />}
      </aside>
      <aside
        className={`sidebar-container mobile-sidebar-container ${
          !isSideBar ? "sidebar-closed" : ""
        }`}
      >
        <div className="sidebar-header">
          <div>
            <img
              src={theme === "dark" ? IMAGES.SiteLogoWhite : IMAGES.SiteLogo}
              alt="Unicode Logo"
              className="sidebar-logo"
            />
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => {
              setIsSideBar(!isSideBar);
            }}
          >
            <span>
              <X size={26} />
            </span>
          </button>
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-menu">
          {authLoading ? (
            <SidebarSkeleton isHalfSideBar={isHalfSideBar} />
          ) : (
            SidebarMenuItems.map((item, index) => {
              const Icon = LucideIcons[item.icon];
              return (
                <div
                  key={index}
                  onClick={() => {
                    navigate(item.route);
                    setIsSideBar(false);
                  }}
                  className={`sidebar-item ${
                    location.pathname === item.activeAt ||
                    (item.startsWith &&
                      item.startsWith.some((path) =>
                        location.pathname.startsWith(path),
                      ))
                      ? "sidebar-item-active"
                      : ""
                  }`}
                >
                  <Icon className="sidebar-icon" />
                  <span className="sidebar-label">{item.name}</span>
                </div>
              );
            })
          )}
        </nav>
        <div className="sidebar-footer">
          <button
            onClick={() => {
              setIsLogout(true);
            }}
            className="sidebar-logout-btn"
          >
            <span className="icon">
              <LogOut />
            </span>
            Logout
          </button>
        </div>
        {isLogout && <Logout onClose={() => setIsLogout(false)} />}
      </aside>
    </>
  );
};

export default SideBar;

const SidebarSkeleton = ({ isHalfSideBar }) => {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-icon" />
          {!isHalfSideBar && <div className="skeleton-text" />}
        </div>
      ))}
    </>
  );
};
