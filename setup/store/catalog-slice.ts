import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "../../src/types";

// Барааны каталог (сервер /sync/products, delta paging).
type CatalogState = {
  byBarcode: Record<string, Product>;
  productsSince: number | null; // дараагийн sync-д ашиглах nextSince
};

const initialState: CatalogState = {
  byBarcode: {},
  productsSince: null,
};

type RawProduct = Product & { deletedAt?: string | null };

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    // Delta: deletedAt-тай бол хасна, бусдыг upsert хийнэ.
    applyProducts(state, action: PayloadAction<RawProduct[]>) {
      for (const raw of action.payload) {
        if (!raw.barcode) continue;
        if (raw.deletedAt) {
          delete state.byBarcode[raw.barcode];
        } else {
          const { deletedAt, ...p } = raw;
          state.byBarcode[raw.barcode] = p;
        }
      }
    },
    setProductsSince(state, action: PayloadAction<number | null>) {
      state.productsSince = action.payload;
    },
    clearCatalog(state) {
      state.byBarcode = {};
      state.productsSince = null;
    },
  },
});

export const { applyProducts, setProductsSince, clearCatalog } =
  catalogSlice.actions;
export const catalogReducer = catalogSlice.reducer;
