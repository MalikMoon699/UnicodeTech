import { configureStore } from "@reduxjs/toolkit";
import adminDashboardReducer from "./features/AdminDashboard.reducer";
import adminUsersReducer from "./features/AdminUsers.reducer";
import managerDashboardReducer from "./features/ManagerDashboard.reducer";
import userDashboardReducer from "./features/UserDashboard.reducer";

export const store = configureStore({
  reducer: {
    adminDashboard: adminDashboardReducer,
    managerDashboard: managerDashboardReducer,
    userDashboard: userDashboardReducer,
    adminUsers: adminUsersReducer,
  },
});
