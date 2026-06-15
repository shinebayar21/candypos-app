import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type ThemeColors } from "../../../src/styles/theme";
import { TextStyles } from "../../../src/styles/text";
import { Button } from "../../../src/components/button";
import { Icon } from "../../../src/components/icon";
import { formatNumber, timeAgo } from "../../../src/utils/format";
import { Configure } from "../../../configure";
import { useAppDispatch, useAppSelector } from "../../../setup/store/hooks";
import {
  setScanMode,
  setThemeMode,
  type ThemeMode,
} from "../../../setup/store/app-slice";
import { setCustomBranchName } from "../../../setup/store/auth-slice";
import { clearSession } from "../../../setup/store/count-slice";
import { logoutThunk, pullAll } from "../../../setup/store/thunks";
import type { ScanMode } from "../../../src/types";

const THEME_OPTS: { key: ThemeMode; label: string }[] = [
  { key: "system", label: "Систем" },
  { key: "light", label: "Цайвар" },
  { key: "dark", label: "Бараан" },
];
const SCAN_OPTS: { key: ScanMode; label: string }[] = [
  { key: "manual", label: "Гар оруулга" },
  { key: "quick", label: "Хурдан (+1)" },
];
const SUCCESS = "#22C55E";

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const s = useMemo(() => makeStyles(c), [c]);
  const dispatch = useAppDispatch();

  const employee = useAppSelector(st => st.auth.employee);
  const merchant = useAppSelector(st => st.auth.merchant);
  const branchId = useAppSelector(st => st.auth.branchId);
  const branchName = useAppSelector(st => st.auth.branchName);
  const customBranchName = useAppSelector(st => st.auth.customBranchName);
  const serverUrl = Configure.ServerUrl;

  const isOnline = useAppSelector(st => st.sync.isOnline);
  const status = useAppSelector(st => st.sync.status);
  const lastSyncAt = useAppSelector(st => st.sync.lastSyncAt);
  const error = useAppSelector(st => st.sync.error);

  const pending = useAppSelector(st => st.outbox.events.length);
  const catalogCount = useAppSelector(
    st => Object.keys(st.catalog.byBarcode).length,
  );
  const inventoryCount = useAppSelector(
    st => Object.keys(st.inventory.byBarcode).length,
  );
  const activeCount = useAppSelector(st => Object.keys(st.count.items).length);

  const themeMode = useAppSelector(st => st.app.themeMode);
  const scanMode = useAppSelector(st => st.app.scanMode);
  const offlinePin = useAppSelector(st => st.auth.offlinePin);

  const displayBranch = customBranchName ?? branchName ?? branchId ?? "—";
  const [editingBranch, setEditingBranch] = useState(false);
  const [branchInput, setBranchInput] = useState("");

  const confirmLogout = () => {
    Alert.alert("Гарах", "Системээс гарах уу?", [
      { text: "Болих", style: "cancel" },
      {
        text: "Гарах",
        style: "destructive",
        onPress: () => dispatch(logoutThunk()),
      },
    ]);
  };

  const confirmClear = () => {
    Alert.alert(
      "Идэвхтэй тооллого цэвэрлэх",
      "Одоогийн тоологдсон бараануудыг устгах уу?",
      [
        { text: "Болих", style: "cancel" },
        {
          text: "Устгах",
          style: "destructive",
          onPress: () => dispatch(clearSession()),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top + 12 }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 16 }}>
      <Text style={s.title}>Тохиргоо</Text>

      {/* Бүртгэл */}
      <View style={s.card}>
        <Text style={s.cardTitle}>{employee?.name ?? "Хэрэглэгч"}</Text>
        {merchant?.companyName ? (
          <Text style={s.muted}>{merchant.companyName}</Text>
        ) : null}
        <Text style={s.muted}>Эрх: {employee?.role ?? "—"}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {editingBranch ? (
            <>
              <TextInput
                value={branchInput}
                onChangeText={setBranchInput}
                placeholder="Салбарын нэр"
                placeholderTextColor={c.textMuted}
                autoFocus
                style={[s.branchInput, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => {
                dispatch(setCustomBranchName(branchInput));
                setEditingBranch(false);
              }}>
                <Text style={[TextStyles.semiSmall, { color: c.brand }]}>Хадгалах</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingBranch(false)}>
                <Text style={[TextStyles.semiSmall, { color: c.textMuted }]}>Болих</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.muted}>Салбар: {displayBranch}</Text>
              <TouchableOpacity onPress={() => {
                setBranchInput(customBranchName ?? "");
                setEditingBranch(true);
              }}>
                <Icon symbol="pencil" size={14} color={c.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </View>
        <Button
          title="Гарах"
          type="secondary"
          onPress={confirmLogout}
          style={{ marginTop: 8 }}
        />
      </View>

      {/* Offline PIN */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Icon symbol="lock.fill" size={18} color={offlinePin ? c.brand : c.textMuted} />
          <Text style={s.cardTitle}>Offline PIN</Text>
          <View style={{ marginLeft: "auto", backgroundColor: offlinePin ? "rgba(34,197,94,0.15)" : c.surface2, paddingHorizontal: 8, height: 22, borderRadius: 11, justifyContent: "center" }}>
            <Text style={[TextStyles.mediumExtraSmall, { color: offlinePin ? "#22C55E" : c.textMuted }]}>
              {offlinePin ? "Идэвхтэй" : "Байхгүй"}
            </Text>
          </View>
        </View>
        {offlinePin ? (
          <Text style={s.muted}>
            Таны offline PIN: <Text style={{ color: c.text, fontWeight: "600" }}>{offlinePin}</Text>
          </Text>
        ) : (
          <Text style={s.muted}>
            Сервер PIN олгоогүй. Дахин онлайн нэвтэрснээр PIN авна.
          </Text>
        )}
      </View>

      {/* Sync */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Icon
            symbol={isOnline ? "wifi" : "wifi.slash"}
            size={20}
            color={isOnline ? SUCCESS : c.textMuted}
          />
          <Text style={s.cardTitle}>{isOnline ? "Online" : "Offline"}</Text>
        </View>
        <Text style={s.muted}>Сүүлд sync: {timeAgo(lastSyncAt)}</Text>
        <Text style={s.muted}>Outbox хүлээгдэж буй: {formatNumber(pending)}</Text>
        {error ? (
          <Text style={[s.muted, { color: c.brand }]}>Алдаа: {error}</Text>
        ) : null}
        <Button
          title={status === "syncing" ? "Sync хийж байна…" : "Одоо sync хийх"}
          onPress={() => dispatch(pullAll())}
          loading={status === "syncing"}
          disabled={!isOnline || status === "syncing"}
          style={{ marginTop: 10 }}
        />
        {!isOnline ? (
          <Text style={[s.muted, { marginTop: 8 }]}>
            Интернэт холбогдоход автоматаар татаж, илгээнэ.
          </Text>
        ) : null}
      </View>

      {/* Скан горим */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Скан горим</Text>
        <Text style={s.muted}>
          Гар оруулга — скан бүрт тоо оруулна. Хурдан — шууд +1.
        </Text>
        <Chips
          opts={SCAN_OPTS}
          active={scanMode}
          onPick={k => dispatch(setScanMode(k))}
          c={c}
          s={s}
        />
      </View>

      {/* Загвар */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Загвар</Text>
        <Chips
          opts={THEME_OPTS}
          active={themeMode}
          onPick={k => dispatch(setThemeMode(k))}
          c={c}
          s={s}
        />
      </View>

      {/* Сервер / өгөгдөл */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Өгөгдөл</Text>
        <Text style={s.muted}>Каталог: {formatNumber(catalogCount)} бараа</Text>
        <Text style={s.muted}>Үлдэгдэл: {formatNumber(inventoryCount)} мөр</Text>
        <Text style={s.muted}>Сервер: {serverUrl || "—"}</Text>
      </View>

      {activeCount > 0 ? (
        <Button
          title="Идэвхтэй тооллого цэвэрлэх"
          type="secondary"
          onPress={confirmClear}
        />
      ) : null}
      <Text style={s.version}>CandyPOS · v0.1.0</Text>
    </ScrollView>
  );
};

type ChipsProps<T extends string> = {
  opts: { key: T; label: string }[];
  active: T;
  onPick: (k: T) => void;
  c: ThemeColors;
  s: ReturnType<typeof makeStyles>;
};
function Chips<T extends string>({ opts, active, onPick, c, s }: ChipsProps<T>) {
  return (
    <View style={s.optRow}>
      {opts.map(o => {
        const on = active === o.key;
        return (
          <TouchableOpacity
            key={o.key}
            onPress={() => onPick(o.key)}
            style={[
              s.chip,
              {
                borderColor: on ? c.brand : c.border,
                backgroundColor: on ? c.brandSoft : "transparent",
              },
            ]}>
            <Text
              style={[
                TextStyles.semiSmall,
                { color: on ? c.brand : c.textSubtle },
              ]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 16 },
    title: { ...TextStyles.boldExtraLarge, color: c.text, marginBottom: 2 },
    card: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 6,
    },
    cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
    cardTitle: { ...TextStyles.semiMedium, color: c.text },
    muted: { ...TextStyles.regularSmall, color: c.textMuted },
    optRow: { flexDirection: "row", gap: 8, marginTop: 8 },
    chip: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    branchInput: {
      height: 36, borderRadius: 10, borderWidth: 1,
      borderColor: c.border, backgroundColor: c.surface2,
      paddingHorizontal: 10, ...TextStyles.regularSmall, color: c.text,
    },
    version: {
      ...TextStyles.regularExtraSmall,
      color: c.textMuted,
      textAlign: "center",
      marginTop: 4,
    },
  });
