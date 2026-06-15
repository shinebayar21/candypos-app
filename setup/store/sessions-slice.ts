import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CountSession } from "../../src/types";

// Энэ төхөөрөмж дээр дуусгасан тооллогууд (локал түүх). synced нь stock_count
// event сервер дээр acked болсон эсэхийг заана.
type SessionsState = {
  history: CountSession[]; // шинэ нь эхэндээ
};

const initialState: SessionsState = { history: [] };

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    saveSession(state, action: PayloadAction<CountSession>) {
      state.history.unshift(action.payload);
    },
    markSessionSynced(state, action: PayloadAction<string>) {
      const s = state.history.find(x => x.id === action.payload);
      if (s) s.synced = true;
    },
    removeSession(state, action: PayloadAction<string>) {
      state.history = state.history.filter(s => s.id !== action.payload);
    },
  },
});

export const { saveSession, markSessionSynced, removeSession } =
  sessionsSlice.actions;
export const sessionsReducer = sessionsSlice.reducer;
