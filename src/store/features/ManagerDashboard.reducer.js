// managerDashBoard.js
import { createSlice } from "@reduxjs/toolkit";

const managerDashBoardSlice = createSlice({
  name: "managerDashBoard",
  initialState: {
    statesLocal: null,
    weeklyHourLocal: [],
    leaveDistributionLocal: [],
    attendanceTrendLocal: [],
    lastFetchedLocal: null,

    teamStatesLocal: null,
    teamLeaveDistributionLocal: [],
    teamAttendanceLocal: [],
    teamReportLocal: [],
    teamLastFetchedLocal: null,
  },
  reducers: {
    setManagerDashBoardData: (state, action) => {
      state.statesLocal = action.payload.statesLocal;
      state.weeklyHourLocal = action.payload.weeklyHourLocal;
      state.leaveDistributionLocal = action.payload.leaveDistributionLocal;
      state.attendanceTrendLocal = action.payload.attendanceTrendLocal;
      state.lastFetchedLocal = action.payload.lastFetchedLocal;
    },
    setManagerTeamDashBoardData: (state, action) => {
      state.teamStatesLocal = action.payload.teamStatesLocal;
      state.teamLeaveDistributionLocal =
        action.payload.teamLeaveDistributionLocal;
      state.teamAttendanceLocal = action.payload.teamAttendanceLocal;
      state.teamReportLocal = action.payload.teamReportLocal;
      state.teamLastFetchedLocal = action.payload.teamLastFetchedLocal;
    },
  },
});

export const {
  setManagerDashBoardData,
  setManagerTeamDashBoardData,
} = managerDashBoardSlice.actions;
export default managerDashBoardSlice.reducer;
