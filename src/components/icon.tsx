import React from "react";
import { Platform, type ColorValue } from "react-native";
import { SymbolView, type SymbolWeight } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import type { SFSymbol } from "sf-symbols-typescript";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

// SF Symbol → Ionicons (Android/fallback) тааруулга.
const MAP: Partial<Record<SFSymbol, IoniconName>> = {
  house: "home-outline",
  "house.fill": "home",
  message: "chatbubble-outline",
  "message.fill": "chatbubble",
  person: "person-outline",
  "person.fill": "person",
  heart: "heart-outline",
  "heart.fill": "heart",
  "bubble.left": "chatbubble-outline",
  ellipsis: "ellipsis-horizontal",
  "line.3.horizontal": "menu-outline",
  magnifyingglass: "search-outline",
  "square.and.pencil": "create-outline",
  gearshape: "settings-outline",
  bell: "notifications-outline",
  "chevron.left": "chevron-back",
  xmark: "close",
  plus: "add",
  eye: "eye-outline",
  "eye.slash": "eye-off-outline",
  touchid: "finger-print",
  "wallet.pass": "wallet-outline",
  "arrow.right": "arrow-forward",
  checkmark: "checkmark",
  "moon.fill": "moon",
  "sun.max.fill": "sunny",
  "doc.text": "document-text-outline",
  "doc.text.fill": "document-text",
  car: "car-outline",
  "car.fill": "car",
  trash: "trash-outline",
  clock: "time-outline",
  calendar: "calendar-outline",
  "chevron.right": "chevron-forward",
  "chevron.down": "chevron-down",
  "info.circle": "information-circle-outline",
  "exclamationmark.triangle.fill": "warning",
  "hand.thumbsup": "thumbs-up-outline",
  "plus.app": "add-circle-outline",
  creditcard: "card-outline",
  "phone.fill": "call",
  "envelope.fill": "mail",
  "paperplane.fill": "send",
  "arrow.up": "arrow-up",
  barcode: "barcode-outline",
  "barcode.viewfinder": "scan-outline",
  "qrcode.viewfinder": "scan-outline",
  "list.bullet": "list-outline",
  "list.bullet.rectangle": "list-outline",
  "arrow.clockwise": "refresh-outline",
  "arrow.triangle.2.circlepath": "sync-outline",
  wifi: "wifi-outline",
  "wifi.slash": "cloud-offline-outline",
  minus: "remove",
  "minus.circle": "remove-circle-outline",
  "plus.circle": "add-circle-outline",
  "checkmark.circle.fill": "checkmark-circle",
  "cube.box": "cube-outline",
  "cube.box.fill": "cube",
  cart: "cart-outline",
  "cart.fill": "cart",
  "icloud.and.arrow.up": "cloud-upload-outline",
  "exclamationmark.circle": "alert-circle-outline",
};

type Props = {
  symbol: SFSymbol;
  size?: number;
  color?: ColorValue;
  weight?: SymbolWeight;
};

// iOS дээр SF Symbol (Liquid Glass-тэй зохицсон), Android дээр Ionicons.
export const Icon = ({ symbol, size = 24, color, weight }: Props) => {
  const ionicon = MAP[symbol] ?? "ellipse-outline";
  const fallback = (
    <Ionicons name={ionicon} size={size} color={color as string} />
  );

  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={symbol}
        size={size}
        tintColor={color}
        weight={weight}
        fallback={fallback}
      />
    );
  }
  return fallback;
};
