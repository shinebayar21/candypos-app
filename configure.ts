// Сервер / API-ийн тохиргоо.
//
// Серверийн үндсэн хаягийг (ApiHost) нэвтрэх дэлгэцэд хэрэглэгч оруулна
// (auth.serverUrl). Base URL = `${serverUrl}${ApiPath}`.
export const Configure = {
  ApiPath: "/api/v1",
  TimeoutMs: 20000,

  // ⚠️ Жинхэнэ серверийн хаягаа ЭНД тавь (нэвтрэх дэлгэцэд харагдахгүй).
  ServerUrl: "https://candypos-admin.zto.mn",
  // ⚠️ Дэлгүүрийн (merchant) кодоо ЭНД тавь (нэвтрэх дэлгэцэд харагдахгүй).
  MerchantCode: "shop01",

  // Outbox push: нэг batch-ийн дээд хэмжээ.
  PushBatchSize: 500,

  // Автомат push давтамж (мс).
  AutoPushIntervalMs: 3 * 60 * 1000,

  Endpoints: {
    login: "/merchant/employee-login",
    products: "/sync/products",
    inventory: "/sync/inventory",
    stockCounts: "/sync/stock-counts",
    productBarcode: "/sync/product-barcode",
    push: "/sync/push",
  },
};
