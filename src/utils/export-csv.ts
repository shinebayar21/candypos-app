import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export type ExportRow = {
  barcode: string;
  sku?: string;
  name: string;
  systemQuantity: number;
  countedQuantity: number;
  costPrice?: number;
  variance?: number;
  lossAmount?: number;
};

const esc = (v: string | number | undefined | null): string => {
  const str = v == null ? "" : String(v);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

// Тоологдсон/тооллогын мөрүүдийг CSV болгож хадгалаад share dialog нээнэ.
// Excel дээр кирилл зөв харагдахын тулд UTF-8 BOM (﻿) нэмнэ.
export async function exportCountCsv(
  rows: ExportRow[],
  filenameBase: string,
): Promise<void> {
  const header = [
    "Баркод",
    "SKU",
    "Нэр",
    "Систем",
    "Тоологдсон",
    "Зөрүү",
    "Хорогдол",
  ];
  const body = rows.map(r => {
    const variance = r.variance ?? r.countedQuantity - r.systemQuantity;
    const loss =
      r.lossAmount ??
      (variance < 0 ? Math.abs(variance) * (r.costPrice ?? 0) : 0);
    return [
      r.barcode,
      r.sku ?? "",
      r.name,
      r.systemQuantity,
      r.countedQuantity,
      variance,
      loss,
    ];
  });

  const csv =
    "﻿" + [header, ...body].map(r => r.map(esc).join(",")).join("\r\n");

  const safe = filenameBase.replace(/[^a-z0-9-_]+/gi, "_") || "export";
  const uri = `${FileSystem.cacheDirectory}${safe}.csv`;

  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "text/csv",
      dialogTitle: "CandyPOS тооллого экспорт",
      UTI: "public.comma-separated-values-text",
    });
  }
}
