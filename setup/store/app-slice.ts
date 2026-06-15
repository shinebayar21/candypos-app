import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ScanMode } from "../../src/types";

export type ThemeMode = "system" | "light" | "dark";

type AppState = {
  launchedAt: string | null;
  themeMode: ThemeMode;
  scanMode: ScanMode;
};

const initialState: AppState = {
  launchedAt: null,
  themeMode: "system",
  scanMode: "manual", // скан дээр тоо гар оруулах нь анхдагч
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setLaunchedAt(state, action: PayloadAction<string>) {
      state.launchedAt = action.payload;
    },
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setScanMode(state, action: PayloadAction<ScanMode>) {
      state.scanMode = action.payload;
    },
  },
});

export const { setLaunchedAt, setThemeMode, setScanMode } = appSlice.actions;
export const appReducer = appSlice.reducer;
