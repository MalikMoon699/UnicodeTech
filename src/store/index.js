import { configureStore } from "@reduxjs/toolkit";
import adminDashboardReducer from "./features/AdminDashboard.reducer";
import managerDashboardReducer from "./features/ManagerDashboard.reducer";
import userDashboardReducer from "./features/UserDashboard.reducer";
import userAttendanceReducer from "./features/UserAttendance.reducer";

export const store = configureStore({
  reducer: {
    adminDashboard: adminDashboardReducer,
    managerDashboard: managerDashboardReducer,
    userDashboard: userDashboardReducer,
    userAttendance: userAttendanceReducer,
  },
});
