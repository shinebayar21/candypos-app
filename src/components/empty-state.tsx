import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";
import { useTheme } from "../styles/theme";
import { TextStyles } from "../styles/text";
import { Icon } from "./icon";

type Props = {
  symbol: SFSymbol;
  title: string;
  subtitle?: string;
};

export const EmptyState = ({ symbol, title, subtitle }: Props) => {
  const c = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: c.brandSoft }]}>
        <Icon symbol={symbol} size={34} color={c.brand} />
      </View>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", padding: 32, gap: 6 },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { ...TextStyles.semiMedium, textAlign: "center" },
  subtitle: { ...TextStyles.regularSmall, textAlign: "center" },
});
