import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../styles/theme";
import { TextStyles } from "../styles/text";
import { useAppSelector } from "../../setup/store/hooks";

// Online / Offline / Sync төлвийг харуулах жижиг pill.
export const OnlineBadge = () => {
  const c = useTheme();
  const isOnline = useAppSelector(s => s.sync.isOnline);
  const status = useAppSelector(s => s.sync.status);

  const syncing = status === "syncing";
  const label = syncing ? "Sync…" : isOnline ? "Online" : "Offline";
  const dot = syncing ? c.brand : isOnline ? "#22C55E" : c.textMuted;

  return (
    <View style={[styles.pill, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.label, { color: c.textSubtle }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { ...TextStyles.mediumSmall },
});
