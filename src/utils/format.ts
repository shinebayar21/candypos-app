// Мянгатын тусгаарлагчтай тоо (Hermes дээр Intl-ээс хамаарахгүй).
export const formatNumber = (n: number): string =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Үнэ ₮ хэлбэрээр.
export const formatMoney = (n?: number): string =>
  n == null ? "—" : `${formatNumber(n)}₮`;

// "5 минутын өмнө" маягийн харьцангуй цаг.
export const timeAgo = (iso?: string | null): string => {
  if (!iso) return "хэзээ ч";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "дөнгөж сая";
  if (m < 60) return `${m} мин өмнө`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цагийн өмнө`;
  const d = Math.floor(h / 24);
  return `${d} өдрийн өмнө`;
};

// "2026.06.12 14:30" хэлбэрийн огноо-цаг.
export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
};
