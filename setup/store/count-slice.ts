import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CountItem } from "../../src/types";
import { countNumber as makeCountNumber, uuid } from "../../src/utils/uid";

// Идэвхтэй тооллого (локал). redux-persist-ээр offline хадгална.
type CountState = {
  items: Record<string, CountItem>; // barcode → мөр
  sessionId: string | null; // тооллогын локал UUID
  countNumber: string | null; // CNT<ts>
  sessionStartedAt: string | null;
};

const initialState: CountState = {
  items: {},
  sessionId: null,
  countNumber: null,
  sessionStartedAt: null,
};

type ScanPayload = {
  barcode: string;
  sku?: string;
  name: string;
  systemQuantity: number;
  costPrice?: number;
  known: boolean;
  amount?: number; // тоологдсон тоонд нэмэх (default 1)
};

const ensureSession = (state: CountState, now: string) => {
  if (!state.sessionId) {
    const ts = Date.now();
    state.sessionId = uuid();
    state.countNumber = makeCountNumber(ts);
    state.sessionStartedAt = now;
  }
};

const countSlice = createSlice({
  name: "count",
  initialState,
  reducers: {
    // Баркод скан: countedQuantity-д amount нэмнэ. systemQuantity-г үүсгэх үед бичнэ.
    scan(state, action: PayloadAction<ScanPayload>) {
      const now = new Date().toISOString();
      ensureSession(state, now);
      const amount = Math.max(1, Math.floor(action.payload.amount ?? 1));
      const { barcode } = action.payload;
      const existing = state.items[barcode];
      if (existing) {
        existing.countedQuantity += amount;
        existing.updatedAt = now;
      } else {
        state.items[barcode] = {
          barcode,
          sku: action.payload.sku,
          name: action.payload.name,
          systemQuantity: action.payload.systemQuantity,
          countedQuantity: amount,
          costPrice: action.payload.costPrice,
          known: action.payload.known,
          countedAt: now,
          updatedAt: now,
        };
      }
    },
    // Тоологдсон тоог яг тохируулах (0 → мөрийг хасна).
    setCounted(state, action: PayloadAction<{ barcode: string; countedQuantity: number }>) {
      const it = state.items[action.payload.barcode];
      if (!it) return;
      const q = Math.max(0, Math.floor(action.payload.countedQuantity));
      if (q === 0) {
        delete state.items[action.payload.barcode];
        return;
      }
      it.countedQuantity = q;
      it.updatedAt = new Date().toISOString();
    },
    renameItem(state, action: PayloadAction<{ barcode: string; name: string }>) {
      const it = state.items[action.payload.barcode];
      if (it) it.name = action.payload.name;
    },
    removeItem(state, action: PayloadAction<string>) {
      delete state.items[action.payload];
    },
    clearSession() {
      return initialState;
    },
  },
});

export const { scan, setCounted, renameItem, removeItem, clearSession } =
  countSlice.actions;
export const countReducer = countSlice.reducer;
