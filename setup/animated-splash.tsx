import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import { Colors } from "../src/styles/colors";

// Цагаан дэвсгэр дээр Мандуул лого: fade+scale-ээр гарч ирээд, бага зэрэг
// томроод бүх splash бүдгэрч аппыг нээнэ.
export const AnimatedSplash = () => {
  const [done, setDone] = useState(false);
  const opacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    logoOpacity.value = withTiming(1, { duration: 360 });
    logoScale.value = withSequence(
      withTiming(1, { duration: 560, easing: Easing.out(Easing.back(1.4)) }),
      withDelay(
        320,
        withTiming(1.28, { duration: 320, easing: Easing.in(Easing.quad) }),
      ),
    );
    opacity.value = withDelay(
      980,
      withTiming(0, { duration: 320 }, fin => {
        if (fin) runOnJS(setDone)(true);
      }),
    );
  }, [opacity, logoOpacity, logoScale]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  if (done) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Animated.Image
        source={require("../src/assets/images/logo-manduul.png")}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  logo: { width: 124, height: 124 },
});
