import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SyncStatus } from "../../src/types";

// Сүлжээ / sync-ийн ажиллах төлөв. Энэ нь runtime төлөв тул persist хийхгүй
// (апп нээх бүрт offline-оос эхэлж, NetInfo бодит төлвийг өгнө).
type SyncState = {
  isOnline: boolean;
  status: SyncStatus;
  lastSyncAt: string | null;
  error: string | null;
};

const initialState: SyncState = {
  isOnline: false,
  status: "idle",
  lastSyncAt: null,
  error: null,
};

const syncSlice = createSlice({
  name: "sync",
  initialState,
  reducers: {
    setOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    syncStarted(state) {
      state.status = "syncing";
      state.error = null;
    },
    syncSucceeded(state) {
      state.status = "success";
      state.lastSyncAt = new Date().toISOString();
      state.error = null;
    },
    syncFailed(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
  },
});

export const { setOnline, syncStarted, syncSucceeded, syncFailed } =
  syncSlice.actions;
export const syncReducer = syncSlice.reducer;
