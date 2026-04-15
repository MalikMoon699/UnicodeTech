import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../components/SideBar";
import { useAuth } from "../context/AuthContext";
import Offline from "../components/Offline";

const AppLayout = () => {
  const [isHalfSideBar, setIsHalfSideBar] = useState(true);
  const { isOnline } = useAuth();

  return (
    <>
      {isOnline ? (
        <div className="app-container">
          <SideBar
            isHalfSideBar={isHalfSideBar}
            setIsHalfSideBar={setIsHalfSideBar}
          />
          <div
            className={`main-content ${
              isHalfSideBar ? "main-content-half-sidebar" : ""
            }`}
          >
            <Outlet />
          </div>
        </div>
      ) : (
        <Offline />
      )}
    </>
  );
};

export default AppLayout;
