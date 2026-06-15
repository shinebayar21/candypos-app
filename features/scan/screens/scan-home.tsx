import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, type ThemeColors } from "../../../src/styles/theme";
import { TextStyles } from "../../../src/styles/text";
import { Icon } from "../../../src/components/icon";
import { OnlineBadge } from "../../../src/components/online-badge";
import { EmptyState } from "../../../src/components/empty-state";
import { formatNumber } from "../../../src/utils/format";
import { useAppSelector } from "../../../setup/store/hooks";
import type { RootStackParamList } from "../../../setup/navigation/root-stack";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ScanHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const s = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation<Nav>();

  const items = useAppSelector(st => st.count.items);
  const employee = useAppSelector(st => st.auth.employee);
  const list = useMemo(() => Object.values(items), [items]);

  const totalTypes = list.length;
  const totalCounted = useMemo(
    () => list.reduce((a, b) => a + b.countedQuantity, 0),
    [list],
  );
  const varianceTypes = useMemo(
    () => list.filter(i => i.countedQuantity !== i.systemQuantity).length,
    [list],
  );
  const recent = useMemo(
    () =>
      [...list]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6),
    [list],
  );

  return (
    <View style={[s.container, { paddingTop: insets.top + 12 }]}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>CandyPOS</Text>
          <Text style={s.sub} numberOfLines={1}>
            {employee?.name ? `${employee.name} · ` : ""}Барааны тооллого
          </Text>
        </View>
        <OnlineBadge />
      </View>

      <View style={s.stats}>
        <Stat c={c} label="Төрөл" value={formatNumber(totalTypes)} />
        <Stat c={c} label="Тоологдсон" value={formatNumber(totalCounted)} accent />
        <Stat c={c} label="Зөрүүтэй" value={formatNumber(varianceTypes)} />
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        style={s.scanBtn}
        onPress={() => navigation.navigate("Scanner")}>
        <Icon symbol="barcode.viewfinder" size={26} color={c.white} />
        <Text style={s.scanBtnText}>Баркод скан хийх</Text>
      </TouchableOpacity>

      <Text style={s.sectionTitle}>Сүүлд тоологдсон</Text>
      {recent.length === 0 ? (
        <EmptyState
          symbol="cube.box"
          title="Хоосон байна"
          subtitle="“Баркод скан хийх” товчийг дарж тооллого эхлүүлээрэй."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: insets.bottom + 16 }}>
          {recent.map(it => {
            const v = it.countedQuantity - it.systemQuantity;
            return (
              <View key={it.barcode} style={s.recentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.recentName} numberOfLines={1}>
                    {it.name}
                  </Text>
                  <Text style={s.recentMeta} numberOfLines={1}>
                    {it.barcode} · систем {it.systemQuantity}
                  </Text>
                </View>
                <Text style={s.recentQty}>×{it.countedQuantity}</Text>
                {v !== 0 ? (
                  <Text
                    style={[
                      s.recentVar,
                      { color: v < 0 ? c.brand : "#22C55E" },
                    ]}>
                    {v > 0 ? `+${v}` : v}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const Stat = ({
  c,
  label,
  value,
  accent,
}: {
  c: ThemeColors;
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <View
    style={{
      flex: 1,
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 4,
    }}>
    <Text style={{ ...TextStyles.boldLarge, color: accent ? c.brand : c.text }}>
      {value}
    </Text>
    <Text style={{ ...TextStyles.regularExtraSmall, color: c.textMuted }}>
      {label}
    </Text>
  </View>
);

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 16, gap: 16 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    brand: { ...TextStyles.boldExtraLarge, color: c.text },
    sub: { ...TextStyles.regularSmall, color: c.textMuted },
    stats: { flexDirection: "row", gap: 10 },
    scanBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      height: 64,
      borderRadius: 18,
      backgroundColor: c.brand,
    },
    scanBtnText: { ...TextStyles.boldMedium, color: c.white },
    sectionTitle: { ...TextStyles.semiMedium, color: c.text },
    recentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
    },
    recentName: { ...TextStyles.semiSmall, color: c.text },
    recentMeta: { ...TextStyles.regularExtraSmall, color: c.textMuted },
    recentQty: { ...TextStyles.boldMedium, color: c.brand },
    recentVar: { ...TextStyles.mediumSmall, minWidth: 32, textAlign: "right" },
  });
