import { Routes, Route, Navigate } from "react-router-dom";
import "./assets/style/Style.css";
import { ProtectedRoute, PublicRoute } from "./routes/RouteGuards.jsx";
import AppLayout from "./layout/AppLayout.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import NotFound from "./pages/NotFound.jsx";
import Auth from "./auth/Auth.jsx";
import Setting from "./pages/Settings.jsx";

// ================= Admin Pages =================
import AdminDashBoard from "./pages/admin/DashBoard.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import AdminAttendance from "./pages/admin/Attendance.jsx";
import AdminLeaves from "./pages/admin/Leaves.jsx";
import AdminDayEndStatus from "./pages/admin/DayEndStatus.jsx";
import AdminChats from "./pages/admin/Chats.jsx";

// ================= Manager Pages =================
import ManagerDashBoard from "./pages/manager/DashBoard.jsx";
import ManagerAttendance from "./pages/manager/Attendance.jsx";
import ManagerLeaves from "./pages/manager/Leaves.jsx";
import ManagerDayEndStatus from "./pages/manager/DayEndStatus.jsx";
import ManagerChats from "./pages/manager/Chats.jsx";

// ================= User Pages =================
import UserDashBoard from "./pages/user/DashBoard.jsx";
import UserAttendance from "./pages/user/Attendance.jsx";
import UserLeaves from "./pages/user/Leaves.jsx";
import UserDayEndStatus from "./pages/user/DayEndStatus.jsx";
import UserChats from "./pages/user/Chats.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { usePresence } from "./utils/hooks/usePresence.js";

const App = () => {
const {currentUser}=useAuth();
 usePresence(currentUser);

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />

      <Route element={<AppLayout />}>
        {/* ========== ADMIN ROUTES ========== */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role={["admin"]}>
              <AdminDashBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute role={["admin"]}>
              <AdminAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leaves"
          element={
            <ProtectedRoute role={["admin"]}>
              <AdminLeaves />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/day-end-status"
          element={
            <ProtectedRoute role={["admin"]}>
              <AdminDayEndStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/chats"
          element={
            <ProtectedRoute role={["admin"]}>
              <AdminChats />
            </ProtectedRoute>
          }
        />

        {/* ========== MANAGER ROUTES ========== */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute role={["manager"]}>
              <ManagerDashBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/attendance"
          element={
            <ProtectedRoute role={["manager"]}>
              <ManagerAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/leaves"
          element={
            <ProtectedRoute role={["manager"]}>
              <ManagerLeaves />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/day-end-status"
          element={
            <ProtectedRoute role={["manager"]}>
              <ManagerDayEndStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/chats"
          element={
            <ProtectedRoute role={["manager"]}>
              <ManagerChats />
            </ProtectedRoute>
          }
        />

        {/* ========== USER ROUTES ========== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role={["user"]}>
              <UserDashBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute role={["user"]}>
              <UserAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaves"
          element={
            <ProtectedRoute role={["user"]}>
              <UserLeaves />
            </ProtectedRoute>
          }
        />
        <Route
          path="/day-end-status"
          element={
            <ProtectedRoute role={["user"]}>
              <UserDayEndStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chats"
          element={
            <ProtectedRoute role={["user"]}>
              <UserChats />
            </ProtectedRoute>
          }
        />

        {/* ========== COMMON ROUTES ========== */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Setting />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<LandingPage />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
