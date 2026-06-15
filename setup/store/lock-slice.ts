import { createSlice } from "@reduxjs/toolkit";

// App-ийн нэг session-д л хадгалагдана (persist хийгдэхгүй).
// Апп дахин эхлэхэд unlocked = false → PIN дэлгэц харуулна.
const lockSlice = createSlice({
  name: "lock",
  initialState: { unlocked: false },
  reducers: {
    unlockSession: s => { s.unlocked = true; },
    lockSession: s => { s.unlocked = false; },
  },
});

export const { unlockSession, lockSession } = lockSlice.actions;
export const lockReducer = lockSlice.reducer;
