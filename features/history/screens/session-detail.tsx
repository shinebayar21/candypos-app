import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import { useTheme, type ThemeColors } from "../../../src/styles/theme";
import { TextStyles } from "../../../src/styles/text";
import { Icon } from "../../../src/components/icon";
import { Button } from "../../../src/components/button";
import { EmptyState } from "../../../src/components/empty-state";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
} from "../../../src/utils/format";
import { exportCountCsv } from "../../../src/utils/export-csv";
import { useAppDispatch, useAppSelector } from "../../../setup/store/hooks";
import { removeSession } from "../../../setup/store/sessions-slice";
import type { RootStackParamList } from "../../../setup/navigation/root-stack";

type R = RouteProp<RootStackParamList, "SessionDetail">;
const SUCCESS = "#22C55E";

export const SessionDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const s = useMemo(() => makeStyles(c), [c]);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const route = useRoute<R>();
  const session = useAppSelector(st =>
    st.sessions.history.find(x => x.id === route.params.sessionId),
  );
  const [exporting, setExporting] = useState(false);

  if (!session) {
    return (
      <View style={[s.container, { paddingTop: insets.top + 60 }]}>
        <EmptyState
          symbol="doc.text"
          title="Олдсонгүй"
          subtitle="Энэ тооллого устсан байж магадгүй."
        />
      </View>
    );
  }

  const onExport = async () => {
    try {
      setExporting(true);
      const stamp = session.finishedAt.slice(0, 16).replace(/[:T]/g, "-");
      await exportCountCsv(session.items, `${session.countNumber}-${stamp}`);
    } catch (e) {
      Alert.alert("Экспорт амжилтгүй", e instanceof Error ? e.message : "Алдаа");
    } finally {
      setExporting(false);
    }
  };

  const onDelete = () => {
    Alert.alert("Тооллого устгах", "Энэ тооллогыг локал түүхээс устгах уу?", [
      { text: "Болих", style: "cancel" },
      {
        text: "Устгах",
        style: "destructive",
        onPress: () => {
          dispatch(removeSession(session.id));
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 8 }]}>
      <View style={s.head}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Icon symbol="chevron.left" size={26} color={c.text} />
        </TouchableOpacity>
        <Text style={s.headTitle}>{session.countNumber}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={s.summary}>
        <Text style={s.date}>{formatDateTime(session.finishedAt)}</Text>
        <View style={s.summaryRow}>
          <Text style={s.summaryMeta}>
            {formatNumber(session.totalItems)} төрөл · зөрүү{" "}
            {formatNumber(session.varianceCount)} · хорогдол{" "}
            {formatMoney(session.varianceValue)}
          </Text>
          <View
            style={[
              s.badge,
              { backgroundColor: session.synced ? "rgba(34,197,94,0.15)" : c.surface2 },
            ]}>
            <Text
              style={[
                TextStyles.mediumExtraSmall,
                { color: session.synced ? SUCCESS : c.textMuted },
              ]}>
              {session.synced ? "Илгээсэн" : "Хүлээгдэж"}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={session.items}
        keyExtractor={i => i.barcode}
        renderItem={({ item }) => {
          const vColor =
            item.variance === 0
              ? c.textMuted
              : item.variance < 0
                ? c.brand
                : SUCCESS;
          return (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={s.rowMeta} numberOfLines={1}>
                  {item.barcode} · систем {item.systemQuantity} · тоологдсон{" "}
                  {item.countedQuantity}
                </Text>
              </View>
              <Text style={[s.variance, { color: vColor }]}>
                {item.variance > 0 ? `+${item.variance}` : item.variance}
              </Text>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      />

      <View style={[s.actions, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title="CSV экспорт"
          onPress={onExport}
          loading={exporting}
          style={{ flex: 1 }}
        />
        <Button
          title="Устгах"
          type="secondary"
          onPress={onDelete}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 16 },
    head: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 44,
    },
    headTitle: { ...TextStyles.semiMedium, color: c.text },
    summary: { paddingVertical: 10, gap: 6 },
    date: { ...TextStyles.boldLarge, color: c.text },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    summaryMeta: { ...TextStyles.regularSmall, color: c.textMuted, flex: 1 },
    badge: { paddingHorizontal: 8, height: 24, borderRadius: 12, justifyContent: "center" },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
    },
    name: { ...TextStyles.semiSmall, color: c.text },
    rowMeta: { ...TextStyles.regularExtraSmall, color: c.textMuted, marginTop: 2 },
    variance: { ...TextStyles.boldMedium, minWidth: 40, textAlign: "right" },
    actions: { flexDirection: "row", gap: 10, paddingTop: 8 },
  });
