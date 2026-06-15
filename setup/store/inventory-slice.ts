import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { InventoryRow } from "../../src/types";

// Системийн үлдэгдэл (сервер /sync/inventory) — barcode-оор индекслэнэ.
type InventoryState = {
  byBarcode: Record<string, InventoryRow>;
  inventorySince: number | null;
};

const initialState: InventoryState = {
  byBarcode: {},
  inventorySince: null,
};

type RawInventory = InventoryRow & { deletedAt?: string | null };

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    applyInventory(state, action: PayloadAction<RawInventory[]>) {
      for (const raw of action.payload) {
        if (!raw.barcode) continue;
        if (raw.deletedAt) {
          delete state.byBarcode[raw.barcode];
        } else {
          const { deletedAt, ...row } = raw;
          state.byBarcode[raw.barcode] = row;
        }
      }
    },
    setInventorySince(state, action: PayloadAction<number | null>) {
      state.inventorySince = action.payload;
    },
    clearInventory(state) {
      state.byBarcode = {};
      state.inventorySince = null;
    },
  },
});

export const { applyInventory, setInventorySince, clearInventory } =
  inventorySlice.actions;
export const inventoryReducer = inventorySlice.reducer;
