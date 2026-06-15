import React, { memo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Colors } from "../styles/colors";
import { TextStyles } from "../styles/text";

type Props = {
  title: string;
  onPress?: () => void;
  type?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

const Button = memo(
  ({
    title,
    onPress,
    type = "primary",
    disabled = false,
    loading = false,
    style,
  }: Props) => {
    const containerStyle: ViewStyle[] = [styles.base];
    const textStyle: TextStyle[] = [styles.text];

    if (type === "primary") {
      containerStyle.push(styles.primary);
      textStyle.push(styles.primaryText);
    } else if (type === "secondary") {
      containerStyle.push(styles.secondary);
      textStyle.push(styles.secondaryText);
    } else {
      containerStyle.push(styles.ghost);
      textStyle.push(styles.ghostText);
    }

    if (disabled || loading) {
      containerStyle.push(styles.disabled);
    }
    if (style) containerStyle.push(style);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled || loading}
        onPress={onPress}
        style={containerStyle}>
        {loading ? (
          <ActivityIndicator
            color={type === "primary" ? Colors.white : Colors.primary}
          />
        ) : (
          <Text style={textStyle}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: Colors.brand },
  secondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.black100,
  },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.45 },
  text: { ...TextStyles.semiMedium },
  primaryText: { color: Colors.white },
  secondaryText: { color: Colors.black950 },
  ghostText: { color: Colors.brand },
});

Button.displayName = "Button";
export { Button };
