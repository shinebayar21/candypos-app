import { createContext, useContext } from "react";

// Семантик өнгөний токенууд — light/dark хоёрт хоёуланд утгатай.
export type ThemeColors = {
  scheme: "light" | "dark";
  bg: string; // дэлгэцийн дэвсгэр
  surface: string; // card, input, pill
  surface2: string; // хоёрдогч гадаргуу
  text: string; // үндсэн текст
  textMuted: string; // placeholder / идэвхгүй
  textSubtle: string; // гуравдагч текст
  border: string; // хүрээ/зураас
  brand: string; // accent (улаан)
  brandSoft: string; // улаан зөөлөн дэвсгэр (сонгогдсон/төлөгдөөгүй)
  glassFill: string; // tab highlight
  glassBorder: string; // glass bar-ийн ирмэг (цайвар зураг дээр ялгарах)
  backdrop: string; // hero ард дэвсгэр
  blurTint: "light" | "dark";
  white: string;
  black: string;
};

export const lightColors: ThemeColors = {
  scheme: "light",
  bg: "#FFFFFF",
  surface: "#F7F7F7",
  surface2: "#EFEFF2",
  text: "#0C0C0D",
  textMuted: "#8C8C99",
  textSubtle: "#5E5E68",
  border: "#E6E6EB",
  brand: "#F74541",
  brandSoft: "rgba(247,69,65,0.08)",
  glassFill: "rgba(118,118,128,0.32)",
  glassBorder: "rgba(0,0,0,0.06)",
  backdrop: "#000000",
  blurTint: "light",
  white: "#FFFFFF",
  black: "#000000",
};

export const darkColors: ThemeColors = {
  scheme: "dark",
  bg: "#000000",
  surface: "#1C1C1E",
  surface2: "#2C2C2E",
  text: "#FFFFFF",
  textMuted: "#8E8E93",
  textSubtle: "#AEAEB2",
  border: "#2E2E30",
  brand: "#FF5A52",
  brandSoft: "rgba(255,90,82,0.15)",
  glassFill: "rgba(235,235,245,0.26)",
  glassBorder: "rgba(255,255,255,0.14)",
  backdrop: "#000000",
  blurTint: "dark",
  white: "#FFFFFF",
  black: "#000000",
};

export const ThemeContext = createContext<ThemeColors>(lightColors);
export const useTheme = () => useContext(ThemeContext);
