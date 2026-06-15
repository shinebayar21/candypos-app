import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Employee, Merchant } from "../../src/types";

type AuthStatus = "idle" | "authenticating" | "error";

type AuthState = {
  serverUrl: string;
  token: string | null;
  employee: Employee | null;
  merchant: Merchant | null;
  branchId: string | null;
  branchName: string | null;       // серверээс авсан нэр
  customBranchName: string | null; // хэрэглэгч гараар тохируулсан нэр
  role: string | null;
  licenseExpiresAt: string | null;
  status: AuthStatus;
  error: string | null;
  offlinePin: string | null;
  savedMerchantCode: string | null;
  savedUsername: string | null;
};

const initialState: AuthState = {
  serverUrl: "",
  token: null,
  employee: null,
  merchant: null,
  branchId: null,
  branchName: null,
  customBranchName: null,
  role: null,
  licenseExpiresAt: null,
  status: "idle",
  error: null,
  offlinePin: null,
  savedMerchantCode: null,
  savedUsername: null,
};

type AuthSuccess = {
  serverUrl: string;
  token: string;
  employee: Employee;
  merchant: Merchant | null;
  branchId: string | null;
  branchName: string | null;
  role: string | null;
  licenseExpiresAt: string | null;
  merchantCode: string;
  username: string;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authStart(state) {
      state.status = "authenticating";
      state.error = null;
    },
    authSuccess(state, action: PayloadAction<AuthSuccess>) {
      const p = action.payload;
      const prev = state.customBranchName; // login-д устгахгүй
      state.serverUrl = p.serverUrl;
      state.token = p.token;
      state.employee = p.employee;
      state.merchant = p.merchant;
      state.branchId = p.branchId;
      state.branchName = p.branchName;
      state.customBranchName = prev;
      state.role = p.role;
      state.licenseExpiresAt = p.licenseExpiresAt;
      state.savedMerchantCode = p.merchantCode;
      state.savedUsername = p.username;
      state.status = "idle";
      state.error = null;
    },
    authFailure(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
    setServerUrl(state, action: PayloadAction<string>) {
      state.serverUrl = action.payload;
    },
    setBranchId(state, action: PayloadAction<string | null>) {
      state.branchId = action.payload;
    },
    setCustomBranchName(state, action: PayloadAction<string>) {
      state.customBranchName = action.payload.trim() || null;
    },
    setPin(state, action: PayloadAction<string>) {
      state.offlinePin = action.payload;
    },
    clearPin(state) {
      state.offlinePin = null;
    },
    logout(state) {
      const url = state.serverUrl;
      const pin = state.offlinePin;
      const customBranch = state.customBranchName; // салбарын нэрийг logout-д хадгална
      Object.assign(state, initialState, { serverUrl: url, offlinePin: pin, customBranchName: customBranch });
    },
  },
});

export const {
  authStart,
  authSuccess,
  authFailure,
  setServerUrl,
  setBranchId,
  setCustomBranchName,
  setPin,
  clearPin,
  logout,
} = authSlice.actions;
export const authReducer = authSlice.reducer;
