import {
  ApiError,
  getInventory,
  getProductByBarcode,
  getProducts,
  getStockCounts,
  login,
  pushEvents,
  type AuthCtx,
} from "../../src/api";
import { Configure } from "../../configure";
import { countNumber as makeCountNumber, uuid } from "../../src/utils/uid";
import type {
  CountSession,
  CountSessionItem,
  OutboxEvent,
} from "../../src/types";
import {
  authFailure,
  authStart,
  authSuccess,
  setPin,
  logout,
} from "./auth-slice";
import { unlockSession, lockSession } from "./lock-slice";
import { applyProducts, clearCatalog, setProductsSince } from "./catalog-slice";
import {
  applyInventory,
  clearInventory,
  setInventorySince,
} from "./inventory-slice";
import {
  applyStockCounts,
  clearRemoteCounts,
  setStockCountsSince,
} from "./remote-counts-slice";
import { clearSession } from "./count-slice";
import { markSessionSynced, saveSession } from "./sessions-slice";
import { enqueue, markFailed, removeAcked } from "./outbox-slice";
import { syncFailed, syncStarted, syncSucceeded } from "./sync-slice";
import type { AppDispatch, RootState } from "./index";

const authCtx = (s: RootState): AuthCtx => ({
  serverUrl: Configure.ServerUrl,
  token: s.auth.token,
  branchId: s.auth.branchId,
});

// 401/403 → logout. true буцаавал auth алдаа байсан.
const isAuthError = (dispatch: AppDispatch, e: unknown): boolean => {
  if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
    dispatch(logout());
    return true;
  }
  return false;
};

// ── Нэвтрэх + анхны татах ────────────────────────────────────────────────────
export const loginThunk =
  (input: { merchantCode: string; username: string; password: string }) =>
  async (dispatch: AppDispatch): Promise<boolean> => {
    dispatch(authStart());
    try {
      const res = await login({
        merchantCode: input.merchantCode.trim(),
        username: input.username.trim(),
        password: input.password,
      });
      dispatch(
        authSuccess({
          serverUrl: Configure.ServerUrl,
          token: res.token,
          employee: res.employee,
          merchant: res.merchant ?? null,
          branchId: res.employee?.branchId ?? res.branch?._id ?? null,
          branchName: res.branch?.name ?? res.employee?.branchName ?? null,
          role: res.employee?.role ?? null,
          licenseExpiresAt: res.licenseExpiresAt ?? null,
          merchantCode: input.merchantCode.trim(),
          username: input.username.trim(),
        }),
      );
      // Серверийн буцаадаг PIN-ийг хадгалах (employee.pin эсвэл res.pin)
      const serverPin = res.employee?.pin ?? res.pin ?? null;
      if (serverPin) dispatch(setPin(serverPin));
      dispatch(unlockSession()); // online нэвтрэлт → session нээгдэнэ
      dispatch(pullAll());
      return true;
    } catch (e) {
      dispatch(authFailure(e instanceof Error ? e.message : "Нэвтрэх амжилтгүй"));
      return false;
    }
  };

export const logoutThunk =
  () =>
  (dispatch: AppDispatch): void => {
    dispatch(lockSession()); // session-ийг түгжинэ
    dispatch(logout());
    dispatch(clearCatalog());
    dispatch(clearInventory());
    dispatch(clearRemoteCounts());
  };

// ── Татах (delta paging) ────────────────────────────────────────────────────
export const pullProducts =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!getState().auth.token) return;
    let cursor: number | null | undefined = getState().catalog.productsSince;
    // hasMore дуустал nextSince-ийг since болгож давтан дуудна.
    for (let guard = 0; guard < 1000; guard++) {
      const res = await getProducts(authCtx(getState()), cursor ?? undefined);
      dispatch(applyProducts(res.data));
      if (res.nextSince != null) dispatch(setProductsSince(res.nextSince));
      if (!res.hasMore || res.nextSince == null) break;
      cursor = res.nextSince;
    }
  };

export const pullInventory =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!getState().auth.token) return;
    let cursor: number | null | undefined = getState().inventory.inventorySince;
    for (let guard = 0; guard < 1000; guard++) {
      const res = await getInventory(authCtx(getState()), cursor ?? undefined);
      dispatch(applyInventory(res.data));
      if (res.nextSince != null) dispatch(setInventorySince(res.nextSince));
      if (!res.hasMore || res.nextSince == null) break;
      cursor = res.nextSince;
    }
  };

export const pullStockCounts =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!getState().auth.token) return;
    let cursor: number | null | undefined = getState().remoteCounts.since;
    for (let guard = 0; guard < 1000; guard++) {
      const res = await getStockCounts(authCtx(getState()), cursor ?? undefined);
      dispatch(applyStockCounts(res.data));
      if (res.nextSince != null) dispatch(setStockCountsSince(res.nextSince));
      if (!res.hasMore || res.nextSince == null) break;
      cursor = res.nextSince;
    }
  };

// Бүгдийг татаад outbox-оо илгээх.
export const pullAll =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!getState().auth.token) return;
    if (getState().sync.status === "syncing") return;
    dispatch(syncStarted());
    try {
      await dispatch(pullProducts());
      await dispatch(pullInventory());
      await dispatch(pullStockCounts());
      await dispatch(pushOutbox());
      dispatch(syncSucceeded());
    } catch (e) {
      if (isAuthError(dispatch, e)) {
        dispatch(syncFailed("Токен хүчингүй — дахин нэвтэрнэ үү"));
      } else {
        dispatch(syncFailed(e instanceof Error ? e.message : "Sync алдаа"));
      }
    }
  };

// ── Online barcode lookup (локалд олдоогүй үед) ─────────────────────────────
export const lookupBarcode =
  (barcode: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const s = getState();
    if (!s.auth.token || !s.sync.isOnline) return null;
    try {
      const r = await getProductByBarcode(authCtx(s), barcode);
      if (r?.product) {
        // Олдсон барааг локал каталогт хадгалж, дараагийн scan-д offline байсан ч олдоно
        dispatch(applyProducts([r.product]));
        if (r.quantity != null) {
          dispatch(applyInventory([{
            productKey: `bc:${barcode}`,
            barcode,
            name: r.product.name,
            sku: r.product.sku,
            quantity: r.quantity,
          }]));
        }
      }
      return r;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      isAuthError(dispatch, e);
      return null;
    }
  };

// ── Тооллого дуусгах → events үүсгэж outbox-д бичих ──────────────────────────
export const finishCount =
  (notes?: string) =>
  (dispatch: AppDispatch, getState: () => RootState): CountSession | null => {
    const s = getState();
    const active = s.count;
    const itemsArr = Object.values(active.items);
    if (itemsArr.length === 0 || !active.sessionId) return null;

    const branchId = s.auth.branchId;
    const now = Date.now();

    const sessionItems: CountSessionItem[] = itemsArr.map(i => {
      const variance = i.countedQuantity - i.systemQuantity;
      const lossAmount =
        variance < 0 ? Math.abs(variance) * (i.costPrice ?? 0) : 0;
      return {
        barcode: i.barcode,
        sku: i.sku,
        name: i.name,
        systemQuantity: i.systemQuantity,
        countedQuantity: i.countedQuantity,
        variance,
        lossAmount,
      };
    });
    const varianceItems = sessionItems.filter(i => i.variance !== 0);
    const varianceValue = sessionItems.reduce((a, b) => a + b.lossAmount, 0);

    const session: CountSession = {
      id: active.sessionId,
      countNumber: active.countNumber ?? makeCountNumber(now),
      branchId,
      startedAt: active.sessionStartedAt,
      finishedAt: new Date(now).toISOString(),
      notes,
      items: sessionItems,
      totalItems: sessionItems.length,
      varianceCount: varianceItems.length,
      varianceValue,
      synced: false,
    };

    const events: OutboxEvent[] = [];

    // stock_count — тайлан (eventId = session id)
    events.push({
      eventId: session.id,
      type: "stock_count",
      occurredAt: now,
      sessionId: session.id,
      status: "pending",
      payload: {
        localId: session.id,
        branchId,
        countNumber: session.countNumber,
        countType: "full",
        status: "completed",
        countDate: now,
        totalItems: session.totalItems,
        varianceCount: session.varianceCount,
        varianceValue: session.varianceValue,
        userId: s.auth.employee?._id ?? s.auth.employee?.name ?? "",
        notes: notes ?? "",
        items: sessionItems,
      },
    });

    // adjustment — зөрүүтэй бараа бүрд signed delta (eventId = шинэ uuid)
    if (varianceItems.length > 0) {
      events.push({
        eventId: uuid(),
        type: "adjustment",
        occurredAt: now,
        sessionId: session.id,
        status: "pending",
        payload: {
          branchId,
          items: varianceItems.map(i => ({
            barcode: i.barcode,
            sku: i.sku,
            name: i.name,
            quantity: i.variance,
          })),
          reason: "Тооллогын залруулга",
          occurredAt: now,
        },
      });
    }

    dispatch(saveSession(session));
    dispatch(enqueue(events));
    dispatch(clearSession());
    dispatch(pushOutbox());
    return session;
  };

// ── Outbox илгээх ───────────────────────────────────────────────────────────
export const pushOutbox =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    const s = getState();
    if (!s.auth.token || !s.sync.isOnline) return;
    const all = s.outbox.events;
    if (all.length === 0) return;

    const batch = all.slice(0, Configure.PushBatchSize);
    try {
      const res = await pushEvents(authCtx(s), batch);
      if (res.acked?.length) {
        dispatch(removeAcked(res.acked));
        const ackedSet = new Set(res.acked);
        for (const ev of batch) {
          if (
            ev.type === "stock_count" &&
            ev.sessionId &&
            ackedSet.has(ev.eventId)
          ) {
            dispatch(markSessionSynced(ev.sessionId));
          }
        }
      }
      if (res.failed?.length) dispatch(markFailed(res.failed));
    } catch (e) {
      // Сүлжээний алдаа → outbox хэвээр, дараа дахин оролдоно.
      isAuthError(dispatch, e);
    }
  };
