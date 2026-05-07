// userAttendance.reducer.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  calendarData: {},
  todayRecord: null,
  lastPending: null,
  selectedDate: new Date().toISOString(),
};

const userAttendanceSlice = createSlice({
  name: "userAttendance",
  initialState,
  reducers: {
    setAttendanceData: (state, action) => {
      state.calendarData = action.payload;
      state.todayRecord = action.payload;
      state.lastPending = action.payload;
      state.selectedDate = action.payload;
    },

    resetAttendance: () => initialState,
  },
});

export const { setAttendanceData, resetAttendance } =
  userAttendanceSlice.actions;

export default userAttendanceSlice.reducer;
