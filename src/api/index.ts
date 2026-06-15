import { Configure } from "../../configure";
import type {
  Employee,
  InventoryRow,
  Merchant,
  OutboxEvent,
  Product,
  ServerStockCount,
} from "../types";

// ───────────────────────────────────────────────────────────────────────────
// API давхарга — MOBILE_COUNT_API.md-ийн дагуу.
// Base URL = `${auth.serverUrl}${Configure.ApiPath}`. Бүх endpoint Bearer token.
// ───────────────────────────────────────────────────────────────────────────

export type AuthCtx = {
  serverUrl: string;
  token: string | null;
  branchId: string | null;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type Paged<T> = {
  data: T[];
  hasMore: boolean;
  nextSince: number | null;
  serverTime?: string;
  branchId?: string;
};

type RawProduct = Product & { deletedAt?: string | null };
type RawInventory = InventoryRow & { deletedAt?: string | null };

const baseUrl = (serverUrl: string) =>
  `${serverUrl.replace(/\/+$/, "")}${Configure.ApiPath}`;

const safeParse = (t: string): any => {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
};

const qs = (params: Record<string, string | number | null | undefined>) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
};

async function request<T>(
  auth: AuthCtx,
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!auth.serverUrl) throw new ApiError(0, "Серверийн хаяг тохируулаагүй");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Configure.TimeoutMs);
  try {
    const res = await fetch(`${baseUrl(auth.serverUrl)}${path}`, {
      signal: controller.signal,
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    const json = text ? safeParse(text) : null;
    if (!res.ok) {
      const code = json?.code ?? json?.error;
      throw new ApiError(
        res.status,
        json?.message ?? code ?? `HTTP ${res.status}`,
        code,
      );
    }
    return json as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new ApiError(0, "Хүсэлт хугацаа хэтэрлээ");
    }
    throw new ApiError(0, e instanceof Error ? e.message : "Сүлжээний алдаа");
  } finally {
    clearTimeout(timer);
  }
}

// ── 1. Нэвтрэлт (токен шаардахгүй) ──────────────────────────────────────────
export type LoginInput = {
  merchantCode: string;
  username: string;
  password: string;
};
export type LoginResponse = {
  token: string;
  employee: Employee;
  merchant: Merchant | null;
  branch?: { _id?: string; name?: string; code?: string } | null;
  licenseExpiresAt?: string;
  licensePlan?: string;
  pin?: string;
};

export function login(input: LoginInput): Promise<LoginResponse> {
  const auth: AuthCtx = {
    serverUrl: Configure.ServerUrl,
    token: null,
    branchId: null,
  };
  return request<LoginResponse>(auth, Configure.Endpoints.login, {
    method: "POST",
    body: JSON.stringify({
      merchantCode: input.merchantCode,
      username: input.username,
      password: input.password,
    }),
  });
}

// ── 2. Анхны өгөгдөл (delta paging) ─────────────────────────────────────────
export function getProducts(auth: AuthCtx, since?: number | null, limit = 500) {
  return request<Paged<RawProduct>>(
    auth,
    `${Configure.Endpoints.products}${qs({ since, limit })}`,
  );
}

export function getInventory(auth: AuthCtx, since?: number | null, limit = 500) {
  return request<Paged<RawInventory>>(
    auth,
    `${Configure.Endpoints.inventory}${qs({ branchId: auth.branchId, since, limit })}`,
  );
}

export function getStockCounts(
  auth: AuthCtx,
  since?: number | null,
  limit = 200,
) {
  return request<Paged<ServerStockCount>>(
    auth,
    `${Configure.Endpoints.stockCounts}${qs({ branchId: auth.branchId, since, limit })}`,
  );
}

// ── 3. Barcode-оор хайх (online) ────────────────────────────────────────────
export function getProductByBarcode(auth: AuthCtx, barcode: string) {
  return request<{ product: Product; branchId: string | null; quantity: number | null }>(
    auth,
    `${Configure.Endpoints.productBarcode}${qs({ barcode, branchId: auth.branchId })}`,
  );
}

// ── 5. Push (outbox) ────────────────────────────────────────────────────────
export type PushResponse = {
  acked: string[];
  failed: { eventId: string; error: string }[];
  incomingTransfers?: unknown[];
  serverTime?: string;
};

export function pushEvents(
  auth: AuthCtx,
  events: OutboxEvent[],
): Promise<PushResponse> {
  return request<PushResponse>(auth, Configure.Endpoints.push, {
    method: "POST",
    body: JSON.stringify({
      events: events.map(({ eventId, type, occurredAt, payload }) => ({
        eventId,
        type,
        occurredAt,
        payload,
      })),
    }),
  });
}
