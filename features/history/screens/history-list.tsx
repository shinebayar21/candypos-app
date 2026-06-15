import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, type ThemeColors } from "../../../src/styles/theme";
import { TextStyles } from "../../../src/styles/text";
import { Icon } from "../../../src/components/icon";
import { EmptyState } from "../../../src/components/empty-state";
import { formatDateTime, formatMoney, formatNumber } from "../../../src/utils/format";
import { useAppSelector } from "../../../setup/store/hooks";
import type { RootStackParamList } from "../../../setup/navigation/root-stack";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const SUCCESS = "#22C55E";

export const HistoryListScreen = () => {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const s = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation<Nav>();
  const history = useAppSelector(st => st.sessions.history);
  const remote = useAppSelector(st => st.remoteCounts.items);

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top + 12 }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 8 }}
      showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Түүх</Text>

      <Text style={s.section}>Энэ төхөөрөмж</Text>
      {history.length === 0 ? (
        <EmptyState
          symbol="clock"
          title="Түүх хоосон"
          subtitle="Дууссан тооллого энд хадгалагдана."
        />
      ) : (
        history.map(item => (
          <TouchableOpacity
            key={item.id}
            style={s.row}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("SessionDetail", { sessionId: item.id })
            }>
            <View style={[s.iconWrap, { backgroundColor: c.brandSoft }]}>
              <Icon symbol="doc.text" size={20} color={c.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{item.countNumber}</Text>
              <Text style={s.rowMeta} numberOfLines={1}>
                {formatDateTime(item.finishedAt)} · {formatNumber(item.totalItems)} төрөл · зөрүү {formatNumber(item.varianceCount)}
              </Text>
            </View>
            <View
              style={[
                s.badge,
                { backgroundColor: item.synced ? "rgba(34,197,94,0.15)" : c.surface2 },
              ]}>
              <Text style={[s.badgeText, { color: item.synced ? SUCCESS : c.textMuted }]}>
                {item.synced ? "Илгээсэн" : "Хүлээгдэж"}
              </Text>
            </View>
            <Icon symbol="chevron.right" size={18} color={c.textMuted} />
          </TouchableOpacity>
        ))
      )}

      {remote.length > 0 ? (
        <>
          <Text style={[s.section, { marginTop: 12 }]}>Бусад төхөөрөмж</Text>
          {remote.map(r => (
            <View key={r.eventId} style={s.row}>
              <View style={[s.iconWrap, { backgroundColor: c.surface2 }]}>
                <Icon symbol="doc.text" size={20} color={c.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{r.countNumber ?? "Тооллого"}</Text>
                <Text style={s.rowMeta} numberOfLines={1}>
                  {r.branchName ? `${r.branchName} · ` : ""}
                  {r.totalItems != null ? `${formatNumber(r.totalItems)} төрөл · ` : ""}
                  хорогдол {formatMoney(r.varianceValue)}
                </Text>
              </View>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 16 },
    title: { ...TextStyles.boldExtraLarge, color: c.text },
    section: { ...TextStyles.semiSmall, color: c.textMuted, marginTop: 4 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    rowTitle: { ...TextStyles.semiSmall, color: c.text },
    rowMeta: { ...TextStyles.regularExtraSmall, color: c.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: 8, height: 24, borderRadius: 12, justifyContent: "center" },
    badgeText: { ...TextStyles.mediumExtraSmall },
  });
