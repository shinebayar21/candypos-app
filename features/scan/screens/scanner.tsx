import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../setup/navigation/root-stack";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../../src/styles/theme";
import { TextStyles } from "../../../src/styles/text";
import { Colors } from "../../../src/styles/colors";
import { Icon } from "../../../src/components/icon";
import { Button } from "../../../src/components/button";
import { QtyInputSheet } from "../../../src/components/qty-input-sheet";
import { useAppDispatch, useAppSelector } from "../../../setup/store/hooks";
import { scan } from "../../../setup/store/count-slice";
import { setScanMode } from "../../../setup/store/app-slice";
import { lookupBarcode } from "../../../setup/store/thunks";

const COOLDOWN_MS = 1400;
const SUCCESS = "#22C55E";

type Resolved = {
  name: string;
  systemQuantity: number;
  costPrice?: number;
  sku?: string;
  known: boolean;
};
type Pending = Resolved & { barcode: string; current: number };

export const ScannerScreen = () => {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const catalog = useAppSelector(s => s.catalog.byBarcode);
  const inventory = useAppSelector(s => s.inventory.byBarcode);
  const items = useAppSelector(s => s.count.items);
  const scanMode = useAppSelector(s => s.app.scanMode);
  const isOnline = useAppSelector(s => s.sync.isOnline);

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain === false) {
      requestPermission();
    }
  }, [permission, requestPermission]);
  const [last, setLast] = useState<{ name: string; qty: number; known: boolean } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [resolving, setResolving] = useState(false);
  const lastScan = useRef<{ code: string; t: number }>({ code: "", t: 0 });
  const manualInputRef = useRef<TextInput>(null);

  const sessionCount = Object.values(items).reduce((a, b) => a + b.countedQuantity, 0);

  // Олдоогүй бол баркодыг нэр болгоно (сервер бүх бараагаа баркодоор нэрлэсэн).
  const resolve = useCallback(
    async (code: string): Promise<Resolved> => {
      const product = catalog[code];
      const inv = inventory[code];
      let known = !!(product || inv);
      let name = product?.name ?? inv?.name;
      let systemQuantity = inv?.quantity ?? 0;
      let costPrice = product?.costPrice;
      let sku = product?.sku ?? inv?.sku;

      if (!known && isOnline) {
        const r = await dispatch(lookupBarcode(code));
        if (r && r.product) {
          known = true;
          name = r.product.name;
          systemQuantity = r.quantity ?? 0;
          costPrice = r.product.costPrice;
          sku = r.product.sku;
        }
      }
      return {
        name: name ?? "Тодорхойлогдоогүй бараа",
        systemQuantity,
        costPrice,
        sku,
        known,
      };
    },
    [catalog, inventory, isOnline, dispatch],
  );

  const handleCode = useCallback(
    async (code: string) => {
      if (pending || !code) return;
      const info = await resolve(code);
      const current = items[code]?.countedQuantity ?? 0;

      if (scanMode === "manual") {
        setPending({ ...info, barcode: code, current });
        Haptics.selectionAsync().catch(() => {});
        return;
      }

      dispatch(scan({
        barcode: code,
        sku: info.sku,
        name: info.name,
        systemQuantity: info.systemQuantity,
        costPrice: info.costPrice,
        known: info.known,
        amount: 1,
      }));
      Haptics.notificationAsync(
        info.known
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
      // Хурдан горим: scan хийгдмэгц жагсаалт руу шилжинэ
      navigation.navigate("Tabs", { screen: "ListTab" });
    },
    [pending, scanMode, items, resolve, dispatch, navigation],
  );

  const onScanned = useCallback(
    async (res: BarcodeScanningResult) => {
      if (pending) return;
      const code = res.data?.trim();
      if (!code) return;
      const now = Date.now();
      if (lastScan.current.code === code && now - lastScan.current.t < COOLDOWN_MS) return;
      lastScan.current = { code, t: now };
      await handleCode(code);
    },
    [pending, handleCode],
  );

  const submitManual = async () => {
    const code = manualCode.trim();
    if (!code || resolving) return;
    Keyboard.dismiss();
    setResolving(true);
    lastScan.current = { code, t: Date.now() };
    await handleCode(code);
    setManualCode("");
    setResolving(false);
    // manual mode → QtyInputSheet харуулна (confirmManual дотор navigate хийгдэнэ)
    // quick mode → жагсаалт руу шилжсэн тул focus хэрэггүй
  };

  const confirmManual = (amount: number) => {
    if (!pending) return;
    dispatch(scan({
      barcode: pending.barcode,
      sku: pending.sku,
      name: pending.name,
      systemQuantity: pending.systemQuantity,
      costPrice: pending.costPrice,
      known: pending.known,
      amount,
    }));
    lastScan.current = { code: pending.barcode, t: Date.now() };
    setPending(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // Тоо баталгаажуулсны дараа жагсаалт руу шилжинэ
    navigation.navigate("Tabs", { screen: "ListTab" });
  };

  const closeSheet = () => {
    if (pending) lastScan.current = { code: pending.barcode, t: Date.now() };
    setPending(null);
    if (keyboardMode) setTimeout(() => manualInputRef.current?.focus(), 200);
  };

  if (!permission || !permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg, padding: 24, gap: 14 }]}>
        <Icon symbol="barcode.viewfinder" size={48} color={c.brand} />
        <Text style={[TextStyles.boldLarge, { color: c.text, textAlign: "center" }]}>
          Камер хэрэгтэй
        </Text>
        <Text style={[TextStyles.regularMedium, { color: c.textMuted, textAlign: "center" }]}>
          {!permission
            ? "Камерын зөвшөөрлийг шалгаж байна…"
            : permission.canAskAgain
            ? "Баркод уншихын тулд камерын зөвшөөрөл өгнө үү."
            : "Тохиргооноос камерын зөвшөөрлийг асаана уу."}
        </Text>
        {permission?.canAskAgain && (
          <Button title="Зөвшөөрөл өгөх" onPress={requestPermission} style={{ alignSelf: "stretch" }} />
        )}
        <Button title="Буцах" type="ghost" onPress={() => navigation.goBack()} style={{ alignSelf: "stretch" }} />
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {/* Камер (keyboard горимд ч ар дэвсгэрт хэвээр байлгана) */}
      {!keyboardMode && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13", "ean8", "upc_a", "upc_e",
              "code128", "code39", "code93",
              "itf14", "codabar", "qr",
            ],
          }}
          onBarcodeScanned={pending ? undefined : onScanned}
        />
      )}

      {/* Keyboard горим — харанхуй дэвсгэр + оруулга */}
      {keyboardMode && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0a0a" }]} />
      )}

      {/* Дээд хэсэг */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={10}>
          <Icon symbol="xmark" size={22} color="#fff" />
        </Pressable>
        <View style={styles.counterPill}>
          <Text style={styles.counterText}>Тоологдсон: {sessionCount}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* Камер / гар оруулга toggle */}
          <Pressable
            onPress={() => {
              setKeyboardMode(k => {
                if (!k) setTimeout(() => manualInputRef.current?.focus(), 100);
                return !k;
              });
            }}
            style={styles.iconBtn}
            hitSlop={8}>
            <Icon symbol={keyboardMode ? "barcode.viewfinder" : "keyboard"} size={20} color="#fff" />
          </Pressable>
          {/* Scan горим toggle (камер горимд л харуулна) */}
          {!keyboardMode && (
            <Pressable
              onPress={() => dispatch(setScanMode(scanMode === "quick" ? "manual" : "quick"))}
              style={styles.modePill}
              hitSlop={8}>
              <Icon symbol={scanMode === "manual" ? "square.and.pencil" : "plus.app"} size={15} color="#fff" />
              <Text style={styles.modeText}>{scanMode === "manual" ? "Гар" : "Хурдан"}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Камер горим: хүрээ */}
      {!keyboardMode && (
        <View style={styles.frameWrap} pointerEvents="none">
          <View style={[styles.frame, { borderColor: Colors.brand }]} />
          <Text style={styles.frameHint}>Баркодыг хүрээн дотор байрлуул</Text>
        </View>
      )}

      {/* Keyboard горим: баркод оруулах */}
      {keyboardMode && (
        <View style={styles.keyboardWrap}>
          <Icon symbol="barcode" size={40} color="rgba(255,255,255,0.3)" />
          <Text style={styles.keyboardHint}>Баркодыг гараар оруулна уу</Text>
          <View style={styles.manualRow}>
            <TextInput
              ref={manualInputRef}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="0000000000000"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={submitManual}
              style={styles.manualInput}
              autoFocus
              editable={!resolving}
            />
            <TouchableOpacity
              onPress={submitManual}
              style={[styles.manualBtn, { backgroundColor: Colors.brand, opacity: resolving ? 0.5 : 1 }]}
              disabled={resolving || !manualCode.trim()}>
              <Icon symbol="arrow.right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Доод хэсэг: сүүлийн скан + дуусгах */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        {last ? (
          <View style={[styles.result, { borderColor: last.known ? SUCCESS : Colors.brand }]}>
            <Icon
              symbol={last.known ? "checkmark.circle.fill" : "exclamationmark.circle"}
              size={22}
              color={last.known ? SUCCESS : Colors.brand}
            />
            <Text style={styles.resultName} numberOfLines={1}>{last.name}</Text>
            <Text style={styles.resultQty}>×{last.qty}</Text>
          </View>
        ) : (
          <Text style={styles.scanningHint}>
            {keyboardMode ? "Баркод оруулаад ↵ товчийг дарна уу" : "Скан хийхэд бэлэн…"}
          </Text>
        )}
        <Button title="Дуусгах" onPress={() => navigation.goBack()} style={{ alignSelf: "stretch" }} />
      </View>

      <QtyInputSheet
        visible={!!pending}
        name={pending?.name ?? ""}
        barcode={pending?.barcode ?? ""}
        known={pending?.known ?? false}
        systemQuantity={pending?.systemQuantity ?? 0}
        currentCounted={pending?.current ?? 0}
        onConfirm={confirmManual}
        onClose={closeSheet}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  counterPill: {
    paddingHorizontal: 14, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  counterText: { ...TextStyles.semiSmall, color: "#fff" },
  modePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, height: 42, borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modeText: { ...TextStyles.semiSmall, color: "#fff" },
  frameWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center", gap: 16,
  },
  frame: {
    width: 250, height: 170,
    borderWidth: 3, borderRadius: 20,
    backgroundColor: "transparent",
  },
  frameHint: { ...TextStyles.mediumSmall, color: "rgba(255,255,255,0.85)" },
  keyboardWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center",
    gap: 16, paddingHorizontal: 24,
  },
  keyboardHint: { ...TextStyles.regularMedium, color: "rgba(255,255,255,0.6)" },
  manualRow: { flexDirection: "row", gap: 10, width: "100%" },
  manualInput: {
    flex: 1, height: 56, borderRadius: 16,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    ...TextStyles.boldMedium,
    color: "#fff",
    letterSpacing: 2,
  },
  manualBtn: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  bottom: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, gap: 12,
  },
  result: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(20,20,22,0.92)",
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  resultName: { ...TextStyles.semiMedium, color: "#fff", flex: 1 },
  resultQty: { ...TextStyles.boldMedium, color: "#fff" },
  scanningHint: {
    ...TextStyles.regularSmall,
    color: "rgba(255,255,255,0.7)", textAlign: "center",
  },
});
