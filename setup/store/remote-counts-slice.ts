import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ServerStockCount } from "../../src/types";

// Бусад төхөөрөмж дээр хийгдсэн тооллого (сервер /sync/stock-counts).
type RemoteCountsState = {
  items: ServerStockCount[];
  since: number | null;
};

const initialState: RemoteCountsState = { items: [], since: null };

const remoteCountsSlice = createSlice({
  name: "remoteCounts",
  initialState,
  reducers: {
    // eventId-аар давхцлыг арилгаж нэгтгэнэ.
    applyStockCounts(state, action: PayloadAction<ServerStockCount[]>) {
      const byId = new Map(state.items.map(i => [i.eventId, i]));
      for (const sc of action.payload) {
        if (sc.eventId) byId.set(sc.eventId, sc);
      }
      state.items = Array.from(byId.values()).sort((a, b) =>
        (b.countDate ?? "").localeCompare(a.countDate ?? ""),
      );
    },
    setStockCountsSince(state, action: PayloadAction<number | null>) {
      state.since = action.payload;
    },
    clearRemoteCounts(state) {
      state.items = [];
      state.since = null;
    },
  },
});

export const { applyStockCounts, setStockCountsSince, clearRemoteCounts } =
  remoteCountsSlice.actions;
export const remoteCountsReducer = remoteCountsSlice.reducer;
