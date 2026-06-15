import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../styles/theme";
import { TextStyles } from "../styles/text";
import { Icon } from "./icon";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
};

// − [тоо] + хэлбэрийн тоо тохируулагч.
export const QtyStepper = ({ value, onChange, min = 0 }: Props) => {
  const c = useTheme();
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(value + 1);

  return (
    <View style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}>
      <TouchableOpacity onPress={dec} style={styles.btn} hitSlop={8}>
        <Icon symbol="minus" size={18} color={c.text} />
      </TouchableOpacity>
      <Text style={[styles.value, { color: c.text }]}>{value}</Text>
      <TouchableOpacity onPress={inc} style={styles.btn} hitSlop={8}>
        <Icon symbol="plus" size={18} color={c.brand} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  btn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  value: {
    ...TextStyles.semiMedium,
    minWidth: 34,
    textAlign: "center",
  },
});
