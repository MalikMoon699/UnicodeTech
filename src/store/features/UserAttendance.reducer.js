// userAttendance.reducer.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  monthlyData: {}, // { "YYYY-MM-DD": record }
  lastPending: null,
  loading: false,
  error: null,
};

const userAttendanceSlice = createSlice({
  name: "userAttendance",
  initialState,
  reducers: {
    setMonthlyData(state, action) {
      state.monthlyData = action.payload;
    },
    updateRecord(state, action) {
      const { date, record } = action.payload;
      state.monthlyData[date] = record;
    },
    setLastPending(state, action) {
      state.lastPending = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  setMonthlyData,
  updateRecord,
  setLastPending,
  setLoading,
  setError,
} = userAttendanceSlice.actions;
export default userAttendanceSlice.reducer;
