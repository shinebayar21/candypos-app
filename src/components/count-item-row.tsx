import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { CountItem } from "../types";
import { useTheme } from "../styles/theme";
import { TextStyles } from "../styles/text";
import { Icon } from "./icon";
import { QtyStepper } from "./qty-stepper";

type Props = {
  item: CountItem;
  onChangeCounted: (barcode: string, qty: number) => void;
  onRemove: (barcode: string) => void;
};

const SUCCESS = "#22C55E";

export const CountItemRow = ({ item, onChangeCounted, onRemove }: Props) => {
  const c = useTheme();
  const variance = item.countedQuantity - item.systemQuantity;
  const vColor = variance === 0 ? c.textMuted : variance < 0 ? c.brand : SUCCESS;
  const vText = variance > 0 ? `+${variance}` : `${variance}`;

  return (
    <View style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.info}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.meta, { color: c.textMuted }]} numberOfLines={1}>
          {item.barcode}
          {!item.known ? "  ·  тодорхойгүй" : ""}
        </Text>
        <View style={styles.tags}>
          <Text style={[styles.tag, { color: c.textSubtle }]}>
            Үлдэгдэл: {item.systemQuantity}
          </Text>
          <Text style={[styles.tag, { color: vColor }]}>Зөрүү: {vText}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <QtyStepper
          value={item.countedQuantity}
          onChange={q => onChangeCounted(item.barcode, q)}
        />
        <TouchableOpacity onPress={() => onRemove(item.barcode)} hitSlop={8}>
          <Icon symbol="trash" size={18} color={c.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  info: { flex: 1, gap: 3 },
  name: { ...TextStyles.semiSmall },
  meta: { ...TextStyles.regularExtraSmall },
  tags: { flexDirection: "row", gap: 12, marginTop: 2 },
  tag: { ...TextStyles.mediumExtraSmall },
  right: { alignItems: "center", gap: 8 },
});
