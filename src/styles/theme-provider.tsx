import React from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSelector } from "react-redux";
import { ThemeContext, darkColors, lightColors, useTheme } from "./theme";
import type { RootState } from "../../setup/store";

// themeMode === "system" бол системийн горимыг дагана, эс бөгөөс хэрэглэгчийн
// сонгосон light/dark-ийг ашиглана.
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const mode = useSelector((s: RootState) => s.app.themeMode);
  const effective = mode === "system" ? systemScheme : mode;
  const value = effective === "dark" ? darkColors : lightColors;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Statusbar-ийн өнгийг theme (дэвсгэр)-ээс хамааруулна: бараан дэвсгэр → цайвар
// текст, цайвар дэвсгэр → бараан текст. Гар toggle-ийг ч зөв дагана.
export const ThemedStatusBar = () => {
  const c = useTheme();
  return <StatusBar style={c.scheme === "dark" ? "light" : "dark"} />;
};
