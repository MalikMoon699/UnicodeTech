// userDashBoard.js
import { createSlice } from "@reduxjs/toolkit";

const userDashBoardSlice = createSlice({
  name: "userDashBoard",
  initialState: {
    statesLocal: null,
    weeklyHourLocal: [],
    leaveDistributionLocal: [],
    attendanceTrendLocal: [],
    lastFetchedLocal: null,
  },
  reducers: {
    setUserDashBoardData: (state, action) => {
      state.statesLocal = action.payload.statesLocal;
      state.weeklyHourLocal = action.payload.weeklyHourLocal;
      state.leaveDistributionLocal = action.payload.leaveDistributionLocal;
      state.attendanceTrendLocal = action.payload.attendanceTrendLocal;
      state.lastFetchedLocal = action.payload.lastFetchedLocal;
    },
  },
});

export const { setUserDashBoardData } = userDashBoardSlice.actions;
export default userDashBoardSlice.reducer;
