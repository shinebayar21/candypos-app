import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "../../../src/styles/theme";
import { TextStyles } from "../../../src/styles/text";
import { Button } from "../../../src/components/button";
import { Icon } from "../../../src/components/icon";
import { useAppDispatch, useAppSelector } from "../../../setup/store/hooks";
import { loginThunk } from "../../../setup/store/thunks";
import { unlockSession } from "../../../setup/store/lock-slice";
import { setPin } from "../../../setup/store/auth-slice";

const PIN_LEN = 4;
const PAD: (string | null)[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [null, "0", "⌫"],
];

type PinStep = "none" | "create-enter" | "create-confirm" | "verify";

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const s = makeStyles(c);
  const dispatch = useAppDispatch();
  const status = useAppSelector(st => st.auth.status);
  const error = useAppSelector(st => st.auth.error);
  const isOnline = useAppSelector(st => st.sync.isOnline);
  const offlinePin = useAppSelector(st => st.auth.offlinePin);
  const savedMerchantCode = useAppSelector(st => st.auth.savedMerchantCode);
  const savedUsername = useAppSelector(st => st.auth.savedUsername);
  const employee = useAppSelector(st => st.auth.employee);

  const [merchantCode, setMerchantCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // PIN дэлгэц
  const [pinStep, setPinStep] = useState<PinStep>("none");
  const [digits, setDigits] = useState<string[]>([]);
  const [firstPin, setFirstPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const loading = status === "authenticating";
  const canSubmit = !!merchantCode.trim() && !!username.trim() &&
    (isOnline ? password.length > 0 : true);

  const doShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shake]);

  const [credError, setCredError] = useState<string | null>(null);

  const submitCredentials = () => {
    if (!canSubmit || loading) return;
    if (isOnline) {
      setCredError(null);
      dispatch(loginThunk({ merchantCode, username, password } as any));
    } else {
      // Offline — хадгалсан merchantCode + username-тэй харьцуулна
      // savedMerchantCode байхгүй бол (хуучин persist) шалгалтыг алгасаж PIN рүү
      if (savedMerchantCode && savedUsername) {
        const mc = merchantCode.trim().toLowerCase();
        const un = username.trim().toLowerCase();
        const savedMc = savedMerchantCode.toLowerCase();
        const savedUn = savedUsername.toLowerCase();
        if (mc !== savedMc || un !== savedUn) {
          setCredError("Байгууллагын нэр эсвэл ажилтаны нэр буруу байна");
          return;
        }
      }
      setCredError(null);
      setDigits([]);
      setPinError(false);
      setPinStep(offlinePin ? "verify" : "create-enter");
    }
  };

  // PIN товч дарах
  const pressDigit = (d: string) => {
    if (digits.length >= PIN_LEN) return;
    Haptics.selectionAsync().catch(() => {});
    setDigits(p => [...p, d]);
  };
  const delDigit = () => {
    Haptics.selectionAsync().catch(() => {});
    setDigits(p => p.slice(0, -1));
  };

  // PIN бүрэн оруулсан үед
  useEffect(() => {
    if (digits.length < PIN_LEN) return;
    const entered = digits.join("");

    if (pinStep === "create-enter") {
      setFirstPin(entered);
      setDigits([]);
      setPinStep("create-confirm");
      return;
    }

    if (pinStep === "create-confirm") {
      if (entered === firstPin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        dispatch(setPin(entered));
        dispatch(unlockSession());
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setPinError(true);
        doShake();
        setTimeout(() => {
          setFirstPin("");
          setDigits([]);
          setPinStep("create-enter");
          setPinError(false);
        }, 700);
      }
      return;
    }

    if (pinStep === "verify") {
      if (entered === offlinePin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        dispatch(unlockSession());
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setPinError(true);
        doShake();
        setTimeout(() => {
          setDigits([]);
          setPinError(false);
        }, 600);
      }
    }
  }, [digits, pinStep, firstPin, offlinePin, dispatch, doShake]);

  const pinTitle =
    pinStep === "create-enter" ? "Шинэ PIN оруулна уу" :
    pinStep === "create-confirm" ? "PIN баталгаажуулна уу" :
    "PIN оруулна уу";

  const pinSubtitle =
    pinStep === "create-enter" ? "4 оронтой PIN тохируулна уу" :
    pinStep === "create-confirm" ? "Дахин оруулж баталгаажуулна уу" :
    `${username} · Offline горим`;

  // PIN дэлгэц
  if (pinStep !== "none") {
    return (
      <View style={[s.pinContainer, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24, backgroundColor: c.bg }]}>
        <Icon symbol="lock.fill" size={34} color={c.brand} />
        <Text style={[TextStyles.boldExtraLarge, { color: c.text, marginTop: 12 }]}>{pinTitle}</Text>
        <Text style={[TextStyles.regularSmall, { color: c.textMuted, marginTop: 4, textAlign: "center" }]}>{pinSubtitle}</Text>

        <Animated.View style={[s.dots, { transform: [{ translateX: shake }] }]}>
          {Array.from({ length: PIN_LEN }).map((_, i) => (
            <View key={i} style={[s.dot, {
              backgroundColor: i < digits.length ? (pinError ? c.brand : c.text) : "transparent",
              borderColor: pinError ? c.brand : c.border,
            }]} />
          ))}
        </Animated.View>

        {pinError
          ? <Text style={[TextStyles.regularSmall, { color: c.brand }]}>
              {pinStep === "create-confirm" ? "PIN таарахгүй байна" : "Буруу PIN"}
            </Text>
          : <View style={{ height: 20 }} />}

        <View style={s.pad}>
          {PAD.map((row, ri) => (
            <View key={ri} style={s.padRow}>
              {row.map((key, ki) => {
                if (!key) return <View key={ki} style={s.keyPlaceholder} />;
                const isDel = key === "⌫";
                return (
                  <TouchableOpacity
                    key={ki}
                    style={[s.key, { backgroundColor: c.surface, borderColor: c.border }]}
                    onPress={() => isDel ? delDigit() : pressDigit(key)}
                    activeOpacity={0.7}>
                    {isDel
                      ? <Icon symbol="delete.left" size={22} color={c.text} />
                      : <Text style={[TextStyles.boldLarge, { color: c.text }]}>{key}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => {
          setPinStep("none");
          setDigits([]);
          setFirstPin("");
          setPinError(false);
        }}>
          <Text style={[TextStyles.regularSmall, { color: c.textMuted }]}>← Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Нэвтрэх дэлгэц
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={[s.container, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Image
          source={require("../../../src/assets/images/logo-manduul.png")}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.title}>CandyPOS</Text>
        <Text style={s.subtitle}>Барааны тооллого — нэвтрэх</Text>

        {!isOnline && (
          <View style={[s.offlineBanner, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Icon symbol="wifi.slash" size={14} color={c.textMuted} />
            <Text style={[TextStyles.regularSmall, { color: c.textMuted }]}>
              Offline горим — PIN-ээр нэвтэрнэ
            </Text>
          </View>
        )}

        <View style={{ gap: 6 }}>
          <Text style={s.label}>Байгууллагын нэвтрэх нэр</Text>
          <TextInput
            value={merchantCode}
            onChangeText={setMerchantCode}
            placeholder="shop01"
            placeholderTextColor={c.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={s.input}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={s.label}>Ажилтаны нэр</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="bataa"
            placeholderTextColor={c.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={s.input}
          />
        </View>

        {isOnline && (
          <View style={{ gap: 6 }}>
            <Text style={s.label}>Нууц үг</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              placeholderTextColor={c.textMuted}
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={submitCredentials}
              style={s.input}
            />
          </View>
        )}

        {(error || credError) ? (
          <Text style={s.error}>{credError ?? error}</Text>
        ) : null}

        <Button
          title={isOnline ? "Нэвтрэх" : "Үргэлжлүүлэх →"}
          onPress={submitCredentials}
          loading={loading}
          disabled={!canSubmit}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { paddingHorizontal: 24, gap: 16 },
    logo: { width: 88, height: 88, alignSelf: "center" },
    title: { ...TextStyles.boldExtraLarge, color: c.text, textAlign: "center", marginTop: 4 },
    subtitle: { ...TextStyles.regularMedium, color: c.textMuted, textAlign: "center", marginBottom: 4 },
    offlineBanner: {
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 12, borderWidth: 1,
    },
    label: { ...TextStyles.mediumSmall, color: c.textSubtle },
    input: {
      height: 52, borderRadius: 14, borderWidth: 1,
      borderColor: c.border, backgroundColor: c.surface,
      paddingHorizontal: 16, ...TextStyles.regularMedium, color: c.text,
    },
    error: { ...TextStyles.regularSmall, color: c.brand, textAlign: "center" },
    // PIN дэлгэц
    pinContainer: { flex: 1, alignItems: "center" },
    dots: { flexDirection: "row", gap: 16, marginTop: 40, marginBottom: 8 },
    dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
    pad: { marginTop: 24, gap: 12, width: 280 },
    padRow: { flexDirection: "row", gap: 12 },
    key: {
      flex: 1, height: 72, borderRadius: 18, borderWidth: 1,
      alignItems: "center", justifyContent: "center",
    },
    keyPlaceholder: { flex: 1, height: 72 },
  });
