import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
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
import { useAppDispatch, useAppSelector } from "../../../setup/store/hooks";
import { unlockSession } from "../../../setup/store/lock-slice";
import { logoutThunk } from "../../../setup/store/thunks";

const PIN_LEN = 4;

export const PinScreen = () => {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const dispatch = useAppDispatch();
  const offlinePin = useAppSelector(s => s.auth.offlinePin)!;
  const employee = useAppSelector(s => s.auth.employee);

  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

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
    if (entered === offlinePin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      dispatch(unlockSession());
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(true);
      doShake();
      setTimeout(() => {
        setDigits([]);
        setError(false);
      }, 600);
    }
  }, [digits, offlinePin, dispatch, doShake]);

  const press = (d: string) => {
    if (digits.length >= PIN_LEN) return;
    Haptics.selectionAsync().catch(() => {});
    setDigits(p => [...p, d]);
  };

  const del = () => {
    Haptics.selectionAsync().catch(() => {});
    setDigits(p => p.slice(0, -1));
  };

  const PAD: (string | null)[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [null, "0", "⌫"],
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.bg, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
      <Icon symbol="lock.fill" size={36} color={c.brand} />
      <Text style={[TextStyles.boldExtraLarge, { color: c.text, marginTop: 12 }]}>
        {employee?.name ?? "PIN оруулна уу"}
      </Text>
      <Text style={[TextStyles.regularSmall, { color: c.textMuted, marginTop: 4 }]}>
        Offline горим — PIN-ээ оруулна уу
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

      {error ? (
        <Text style={[TextStyles.regularSmall, { color: c.brand }]}>Буруу PIN</Text>
      ) : <View style={{ height: 20 }} />}

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

      <TouchableOpacity
        style={{ marginTop: 16 }}
        onPress={() => dispatch(logoutThunk())}>
        <Text style={[TextStyles.regularSmall, { color: c.textMuted }]}>
          PIN мартсан? Дахин нэвтрэх
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  dots: { flexDirection: "row", gap: 16, marginTop: 40, marginBottom: 8 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  pad: { marginTop: 24, gap: 12, width: 280 },
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
