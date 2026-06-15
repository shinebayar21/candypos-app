import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, type ThemeColors } from "../../../src/styles/theme";
import { TextStyles } from "../../../src/styles/text";
import { Icon } from "../../../src/components/icon";
import { Button } from "../../../src/components/button";
import { CountItemRow } from "../../../src/components/count-item-row";
import { EmptyState } from "../../../src/components/empty-state";
import { OnlineBadge } from "../../../src/components/online-badge";
import { formatNumber } from "../../../src/utils/format";
import { exportCountCsv } from "../../../src/utils/export-csv";
import { useAppDispatch, useAppSelector } from "../../../setup/store/hooks";
import { removeItem, setCounted } from "../../../setup/store/count-slice";
import { finishCount } from "../../../setup/store/thunks";
import type { RootStackParamList } from "../../../setup/navigation/root-stack";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const CountListScreen = () => {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const s = useMemo(() => makeStyles(c), [c]);
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Nav>();
  const items = useAppSelector(st => st.count.items);
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);

  const list = useMemo(() => {
    const arr = Object.values(items).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    const q = query.trim().toLowerCase();
    if (!q) return arr;
    return arr.filter(
      i => i.name.toLowerCase().includes(q) || i.barcode.includes(q),
    );
  }, [items, query]);

  const totalCounted = useMemo(
    () => Object.values(items).reduce((a, b) => a + b.countedQuantity, 0),
    [items],
  );
  const count = Object.keys(items).length;

  const onExport = async () => {
    try {
      setExporting(true);
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
      await exportCountCsv(Object.values(items), `candypos-toollogo-${stamp}`);
    } catch (e) {
      Alert.alert("Экспорт амжилтгүй", e instanceof Error ? e.message : "Алдаа");
    } finally {
      setExporting(false);
    }
  };

  const onFinish = () => {
    Alert.alert(
      "⚠️ Сервер рүү илгээх үү?",
      "Илгээсний дараа засах боломжгүй болно.\n\nБүх тоо болон зөрүүгээ сайтар нягталж үзсэний дараа илгээнэ үү.",
      [
        { text: "Буцах", style: "cancel" },
        {
          text: "Илгээх",
          style: "destructive",
          onPress: () => {
            const session = dispatch(finishCount());
            if (session) {
              navigation.navigate("SessionDetail", { sessionId: session.id });
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 12 }]}>
      <View style={s.header}>
        <Text style={s.title}>Жагсаалт</Text>
        <OnlineBadge />
      </View>

      <View style={s.search}>
        <Icon symbol="magnifyingglass" size={18} color={c.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Нэр эсвэл баркодоор хайх"
          placeholderTextColor={c.textMuted}
          style={s.searchInput}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={i => i.barcode}
        renderItem={({ item }) => (
          <CountItemRow
            item={item}
            onChangeCounted={(bc, q) =>
              dispatch(setCounted({ barcode: bc, countedQuantity: q }))
            }
            onRemove={bc => dispatch(removeItem(bc))}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{
          paddingBottom: count > 0 ? 150 : insets.bottom + 24,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            symbol="list.bullet"
            title="Тооллого хоосон"
            subtitle="Скан хийсэн бараа энд харагдана."
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {count > 0 ? (
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={s.footerTop}>
            <Text style={s.footerLabel}>Нийт тоологдсон</Text>
            <Text style={s.footerValue}>{formatNumber(totalCounted)}</Text>
          </View>
          <View style={s.footerBtns}>
            <Button
              title="CSV экспорт"
              type="secondary"
              onPress={onExport}
              loading={exporting}
              style={{ flex: 1 }}
            />
            <Button title="Илгээх" onPress={onFinish} style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 16, gap: 12 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: { ...TextStyles.boldExtraLarge, color: c.text },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 46,
    },
    searchInput: {
      flex: 1,
      ...TextStyles.regularMedium,
      color: c.text,
      padding: 0,
    },
    footer: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 0,
      backgroundColor: c.bg,
      gap: 10,
      paddingTop: 8,
    },
    footerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.brand,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    footerLabel: { ...TextStyles.semiMedium, color: c.white },
    footerValue: { ...TextStyles.boldLarge, color: c.white },
    footerBtns: { flexDirection: "row", gap: 10 },
  });
