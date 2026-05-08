import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  statesLocal: null,
  usersLocal: [],
  lastDocLocal: null,
  lastFetchedLocal: null,
};

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState,

  reducers: {
    setAdminUsersData: (state, action) => {
      if (action.payload.statesLocal !== undefined) {
        state.statesLocal = action.payload.statesLocal;
      }
      if (action.payload.usersLocal !== undefined) {
        state.usersLocal = action.payload.usersLocal;
      }
      if (action.payload.lastDocLocal !== undefined) {
        state.lastDocLocal = action.payload.lastDocLocal;
      }
      if (action.payload.lastFetchedLocal !== undefined) {
        state.lastFetchedLocal = action.payload.lastFetchedLocal;
      }
    },

    clearAdminUsersData: (state) => {
      state.statesLocal = null;
      state.usersLocal = [];
      state.lastDocLocal = null;
      state.lastFetchedLocal = null;
    },
  },
});

export const { setAdminUsersData, clearAdminUsersData } =
  adminUsersSlice.actions;

export default adminUsersSlice.reducer;
