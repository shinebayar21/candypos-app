import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../styles/theme";
import { TextStyles } from "../styles/text";
import { Button } from "./button";
import { Icon } from "./icon";

type Props = {
  visible: boolean;
  name: string;
  barcode: string;
  known: boolean;
  systemQuantity: number;
  currentCounted: number; // тооллогод одоо бичигдсэн тоо
  onConfirm: (amount: number) => void;
  onClose: () => void;
};

// Скан хийсний дараа нэмэх тоог гар оруулах доод хуудас.
export const QtyInputSheet = ({
  visible,
  name,
  barcode,
  known,
  systemQuantity,
  currentCounted,
  onConfirm,
  onClose,
}: Props) => {
  const c = useTheme();
  const [text, setText] = useState("1");

  useEffect(() => {
    if (visible) setText("1");
  }, [visible, barcode]);

  const amount = Math.max(0, parseInt(text || "0", 10) || 0);
  const bump = (d: number) => setText(String(Math.max(1, amount + d)));
  const confirm = () => {
    if (amount >= 1) onConfirm(amount);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}>
        <View style={[styles.sheet, { backgroundColor: c.bg, borderColor: c.border }]}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: c.text }]} numberOfLines={2}>
                {name}
              </Text>
              <Text style={[styles.meta, { color: c.textMuted }]}>
                {barcode}
                {!known ? "  ·  тодорхойгүй" : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Icon symbol="xmark" size={22} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.info, { color: c.textSubtle }]}>
              Систем: {systemQuantity}
            </Text>
            {currentCounted > 0 ? (
              <Text style={[styles.info, { color: c.textSubtle }]}>
                Одоо тоологдсон: {currentCounted}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.label, { color: c.textSubtle }]}>
            Нэмэх тоо ширхэг
          </Text>

          <View style={styles.inputRow}>
            <TouchableOpacity
              onPress={() => bump(-1)}
              style={[styles.stepBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Icon symbol="minus" size={22} color={c.text} />
            </TouchableOpacity>

            <TextInput
              value={text}
              onChangeText={t => setText(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              selectTextOnFocus
              autoFocus
              style={[
                styles.input,
                { color: c.text, backgroundColor: c.surface, borderColor: c.border },
              ]}
            />

            <TouchableOpacity
              onPress={() => bump(1)}
              style={[styles.stepBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Icon symbol="plus" size={22} color={c.brand} />
            </TouchableOpacity>
          </View>

          <Button
            title={`Нэмэх (+${amount})`}
            onPress={confirm}
            disabled={amount < 1}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  kav: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
    gap: 14,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  name: { ...TextStyles.boldMedium },
  meta: { ...TextStyles.regularSmall, marginTop: 2 },
  infoRow: { flexDirection: "row", gap: 16 },
  info: { ...TextStyles.mediumSmall },
  label: { ...TextStyles.mediumSmall },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    textAlign: "center",
    ...TextStyles.boldLarge,
  },
});
