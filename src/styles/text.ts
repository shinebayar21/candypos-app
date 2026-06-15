import { StyleSheet } from "react-native";

// Зөвхөн фонт (хэмжээ/жин) — өнгийг theme-ээс (useTheme) өгнө.
// fontFamily байхгүй → iOS дээр SF Pro, Android дээр Roboto.
export const TextStyles = StyleSheet.create({
  regularExtraSmall: { fontSize: 12, fontWeight: "400" },
  regularSmall: { fontSize: 14, fontWeight: "400" },
  regularMedium: { fontSize: 16, fontWeight: "400" },
  mediumExtraSmall: { fontSize: 12, fontWeight: "500" },
  mediumSmall: { fontSize: 14, fontWeight: "500" },
  semiSmall: { fontSize: 14, fontWeight: "600" },
  semiMedium: { fontSize: 16, fontWeight: "600" },
  boldMedium: { fontSize: 16, fontWeight: "700" },
  boldLarge: { fontSize: 22, fontWeight: "700" },
  boldExtraLarge: { fontSize: 28, fontWeight: "800" },
});

export const ViewStyles = StyleSheet.create({
  flex: { flex: 1 },
});
