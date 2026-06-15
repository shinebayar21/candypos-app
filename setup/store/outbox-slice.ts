import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OutboxEvent } from "../../src/types";

// Илгээгдэхээ хүлээж буй event-үүд. Сервер acked буцаатал хадгална
// (idempotent тул дахин илгээхэд асуудалгүй).
type OutboxState = {
  events: OutboxEvent[];
};

const initialState: OutboxState = { events: [] };

const outboxSlice = createSlice({
  name: "outbox",
  initialState,
  reducers: {
    enqueue(state, action: PayloadAction<OutboxEvent[]>) {
      state.events.push(...action.payload);
    },
    removeAcked(state, action: PayloadAction<string[]>) {
      const acked = new Set(action.payload);
      state.events = state.events.filter(e => !acked.has(e.eventId));
    },
    markFailed(state, action: PayloadAction<{ eventId: string; error: string }[]>) {
      const map = new Map(action.payload.map(f => [f.eventId, f.error]));
      for (const e of state.events) {
        const err = map.get(e.eventId);
        if (err != null) {
          e.status = "failed";
          e.error = err;
        }
      }
    },
    clearOutbox(state) {
      state.events = [];
    },
  },
});

export const { enqueue, removeAcked, markFailed, clearOutbox } =
  outboxSlice.actions;
export const outboxReducer = outboxSlice.reducer;
