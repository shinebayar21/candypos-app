import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "../../../src/styles/theme";
import { TextStyles } from "../../../src/styles/text";
import { Icon } from "../../../src/components/icon";
import { useAppDispatch } from "../../../setup/store/hooks";
import { setPin, clearPin } from "../../../setup/store/auth-slice";

const PIN_LEN = 4;

const PAD: (string | null)[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [null, "0", "⌫"],
];

type Step = "enter" | "confirm";

type Props = {
  visible: boolean;
  currentPin: string | null;
  onClose: () => void;
  onSuccess?: () => void; // PIN амжилттай тохируулсны дараа дуудагдана
};

export const PinSetupSheet = ({ visible, currentPin, onClose, onSuccess }: Props) => {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<Step>("enter");
  const [first, setFirst] = useState("");
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const reset = useCallback(() => {
    setStep("enter");
    setFirst("");
    setDigits([]);
    setError(false);
  }, []);

  useEffect(() => { if (visible) reset(); }, [visible, reset]);

  const doShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shake]);

  useEffect(() => {
    if (digits.length < PIN_LEN) return;
    const entered = digits.join("");
    if (step === "enter") {
      setFirst(entered);
      setDigits([]);
      setStep("confirm");
    } else {
      if (entered === first) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        dispatch(setPin(entered));
        onClose();
        onSuccess?.();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setError(true);
        doShake();
        setTimeout(() => {
          setStep("enter");
          setFirst("");
          setDigits([]);
          setError(false);
        }, 700);
      }
    }
  }, [digits, step, first, dispatch, doShake, onClose]);

  const press = (d: string) => {
    if (digits.length >= PIN_LEN) return;
    Haptics.selectionAsync().catch(() => {});
    setDigits(p => [...p, d]);
  };

  const del = () => {
    Haptics.selectionAsync().catch(() => {});
    setDigits(p => p.slice(0, -1));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: c.bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.header}>
          <Text style={[TextStyles.boldLarge, { color: c.text }]}>
            {step === "enter" ? "Шинэ PIN оруулна уу" : "PIN баталгаажуулна уу"}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Icon symbol="xmark" size={22} color={c.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[TextStyles.regularSmall, { color: c.textMuted, textAlign: "center", paddingHorizontal: 24 }]}>
          {step === "enter"
            ? "4 оронтой PIN тохируулна. Internet байхгүй үед нэвтрэхэд ашиглагдана."
            : "Баталгаажуулахын тулд PIN-ээ дахин оруулна уу."}
        </Text>

        <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]}>
          {Array.from({ length: PIN_LEN }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i < digits.length
                    ? (error ? c.brand : c.text)
                    : "transparent",
                  borderColor: error ? c.brand : c.border,
                },
              ]}
            />
          ))}
        </Animated.View>

        {error
          ? <Text style={[TextStyles.regularSmall, { color: c.brand }]}>PIN таарахгүй байна. Дахин оролдоно уу.</Text>
          : <View style={{ height: 20 }} />
        }

        <View style={styles.pad}>
          {PAD.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((key, ki) => {
                if (!key) return <View key={ki} style={styles.keyPlaceholder} />;
                const isDelete = key === "⌫";
                return (
                  <TouchableOpacity
                    key={ki}
                    style={[styles.key, { backgroundColor: c.surface, borderColor: c.border }]}
                    onPress={() => isDelete ? del() : press(key)}
                    activeOpacity={0.7}>
                    {isDelete
                      ? <Icon symbol="delete.left" size={22} color={c.text} />
                      : <Text style={[TextStyles.boldLarge, { color: c.text }]}>{key}</Text>
                    }
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {currentPin ? (
          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => { dispatch(clearPin()); onClose(); }}>
            <Text style={[TextStyles.regularSmall, { color: c.brand }]}>PIN устгах</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  dots: { flexDirection: "row", gap: 16, marginTop: 24, marginBottom: 4 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  pad: { marginTop: 8, gap: 12, width: 280 },
  row: { flexDirection: "row", gap: 12 },
  key: {
    flex: 1,
    height: 72,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keyPlaceholder: { flex: 1, height: 72 },
});
