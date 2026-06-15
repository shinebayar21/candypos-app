// UUID v4 (Math.random суурьтай — outbox eventId / тооллогын localId-д хангалттай).
export const uuid = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, ch => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// CNT<timestamp> — тооллогын дугаар.
export const countNumber = (ts: number = Date.now()): string => `CNT${ts}`;
