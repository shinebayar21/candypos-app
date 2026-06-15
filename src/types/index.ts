// Аппын төв өгөгдлийн загвар (MOBILE_COUNT_API.md-ийн дагуу).

// Барааны каталог (сервер /sync/products).
export type Product = {
  _id?: string;
  sku?: string;
  barcode: string;
  name: string;
  trackInventory?: boolean;
  costPrice?: number; // байвал lossAmount бодоход ашиглана
  price?: number;
};

// Системийн үлдэгдэл (сервер /sync/inventory) — systemQuantity-ийн эх сурвалж.
export type InventoryRow = {
  productKey: string; // bc:<barcode>
  barcode: string;
  sku?: string;
  name: string;
  quantity: number; // systemQuantity
  updatedAt?: string;
};

// Идэвхтэй тооллогын мөр (локал).
export type CountItem = {
  barcode: string;
  sku?: string;
  name: string;
  systemQuantity: number;
  countedQuantity: number;
  costPrice?: number;
  known: boolean; // каталогт байсан эсэх
  countedAt: string;
  updatedAt: string;
};

// Дуусгасан тооллогын мөр (зөрүүтэй).
export type CountSessionItem = {
  barcode: string;
  sku?: string;
  name: string;
  systemQuantity: number;
  countedQuantity: number;
  variance: number; // counted - system
  lossAmount: number; // дутвал |variance| * costPrice
};

// Дуусгаж хадгалсан тооллого (локал түүх + outbox).
export type CountSession = {
  id: string; // локал UUID = stock_count eventId
  countNumber: string; // CNT<timestamp>
  branchId: string | null;
  startedAt: string | null;
  finishedAt: string;
  notes?: string;
  items: CountSessionItem[];
  totalItems: number;
  varianceCount: number;
  varianceValue: number;
  synced: boolean; // stock_count event acked эсэх
};

// Outbox дахь илгээгдэх event.
export type OutboxEvent = {
  eventId: string;
  type: "adjustment" | "stock_count";
  occurredAt: number;
  payload: Record<string, unknown>;
  status: "pending" | "failed";
  error?: string;
  sessionId?: string; // аль локал session-д хамаарах
};

// Нэвтрэлт.
export type Employee = {
  _id: string;
  name: string;
  role?: string;
  branchId?: string | null;
  branchName?: string | null; // салбарын нэр (сервер буцаана)
  pin?: string; // сервер буцаадаг offline PIN (4 орон)
};
export type Merchant = {
  _id: string;
  companyName?: string;
  loginCode?: string;
};

// Бусад төхөөрөмжийн тооллого (сервер /sync/stock-counts).
export type ServerStockCount = {
  eventId: string;
  localId?: string;
  countNumber?: string;
  status?: string;
  countDate?: string;
  totalItems?: number;
  varianceCount?: number;
  varianceValue?: number;
  branchName?: string;
};

export type SyncStatus = "idle" | "syncing" | "success" | "error";
export type ScanMode = "quick" | "manual";
