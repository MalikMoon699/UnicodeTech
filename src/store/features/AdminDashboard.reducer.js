// adminDashBoard.js
import { createSlice } from "@reduxjs/toolkit";

const adminDashBoardSlice = createSlice({
  name: "adminDashBoard",
  initialState: {
    statesLocal: null,
    leaveDistributionLocal: [],
    attendanceLocal: [],
    reportLocal: [],
    lastFetchedLocal: null,

    states30DayLocal: null,
    leave30DayDistributionLocal: [],
    attendance30DayLocal: [],
    report30DayLocal: [],
    lastFetched30DayLocal: null,
  },
  reducers: {
    setAdminDashBoardData: (state, action) => {
      state.statesLocal = action.payload.statesLocal;
      state.leaveDistributionLocal = action.payload.leaveDistributionLocal;
      state.attendanceLocal = action.payload.attendanceLocal;
      state.reportLocal = action.payload.reportLocal;
      state.lastFetchedLocal = action.payload.lastFetchedLocal;
    },
    setAdmin30DayDashBoardData: (state, action) => {
      state.states30DayLocal = action.payload.states30DayLocal;
      state.leave30DayDistributionLocal =
        action.payload.leave30DayDistributionLocal;
      state.attendance30DayLocal = action.payload.attendance30DayLocal;
      state.report30DayLocal = action.payload.report30DayLocal;
      state.lastFetched30DayLocal = action.payload.lastFetched30DayLocal;
    },
  },
});

export const {
  setAdminDashBoardData,
  setAdmin30DayDashBoardData,
} = adminDashBoardSlice.actions;
export default adminDashBoardSlice.reducer;
