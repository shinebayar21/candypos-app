import React from "react";
import {
  NavigationContainer as RNNavigationContainer,
  createNavigationContainerRef,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { RootStackNavigator } from "./root-stack";
import { useTheme } from "../../src/styles/theme";
import { useAppSelector } from "../store/hooks";
import { LoginScreen, PinScreen } from "../../features/auth";

export const navigationRef = createNavigationContainerRef<any>();

const NavigationContainer = () => {
  const c = useTheme();
  const token = useAppSelector(s => s.auth.token);
  const offlinePin = useAppSelector(s => s.auth.offlinePin);
  const sessionUnlocked = useAppSelector(s => s.lock.unlocked);

  const base = c.scheme === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: c.bg, card: c.bg },
  };

  const MainApp = (
    <RNNavigationContainer ref={navigationRef} theme={navTheme}>
      <RootStackNavigator />
    </RNNavigationContainer>
  );

  // Session нээгдсэн → үндсэн апп (offline PIN-ээр нэвтэрсэн ч, онлайн нэвтэрсэн ч)
  if (sessionUnlocked) return MainApp;

  // Token байхгүй → нэвтрэх дэлгэц (offline PIN flow LoginScreen дотор шийдэгдэнэ)
  if (!token) return <LoginScreen />;

  // Token байгаа боловч PIN тохируулсан + нээгдээгүй → PIN дэлгэц (апп дахин эхэлсэн үед)
  if (offlinePin) return <PinScreen />;

  return MainApp;
};

export { NavigationContainer };
