import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { SFSymbol } from "sf-symbols-typescript";
import { useTheme } from "../../src/styles/theme";
import { Icon } from "../../src/components/icon";
import { ScanHomeScreen } from "../../features/scan";
import { CountListScreen } from "../../features/list";
import { HistoryListScreen } from "../../features/history";
import { SettingsScreen } from "../../features/settings";

export type TabParamList = {
  ScanTab: undefined;
  ListTab: undefined;
  HistoryTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const iconFor = (route: keyof TabParamList, focused: boolean): SFSymbol => {
  switch (route) {
    case "ScanTab":
      return focused ? "cube.box.fill" : "cube.box";
    case "ListTab":
      return "list.bullet";
    case "HistoryTab":
      return "clock";
    case "SettingsTab":
      return "gearshape";
  }
};

export const TabNavigator = () => {
  const c = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.border },
        tabBarIcon: ({ color, focused }) => (
          <Icon
            symbol={iconFor(route.name as keyof TabParamList, focused)}
            size={24}
            color={color}
          />
        ),
      })}>
      <Tab.Screen
        name="ScanTab"
        component={ScanHomeScreen}
        options={{ title: "Тооллого" }}
      />
      <Tab.Screen
        name="ListTab"
        component={CountListScreen}
        options={{ title: "Жагсаалт" }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryListScreen}
        options={{ title: "Түүх" }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: "Тохиргоо" }}
      />
    </Tab.Navigator>
  );
};
