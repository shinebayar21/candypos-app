export default {
  expo: {
    name: "CandyPOS",
    slug: "candypos",
    version: "0.1.0",
    jsEngine: "hermes",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    runtimeVersion: "1.0.0",
    icon: "./assets/icon.png",
    splash: {
      image: "./src/assets/images/logo-manduul.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.candypos.app",
      icon: "./assets/icon.png",
      infoPlist: {
        NSCameraUsageDescription:
          "CandyPOS барааны баркод уншихын тулд камер ашиглана.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.candypos.app",
      permissions: ["android.permission.CAMERA"],
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission:
            "CandyPOS барааны баркод уншихын тулд камер ашиглана.",
          recordAudioAndroid: false,
        },
      ],
      [
        "expo-font",
        {
          fonts: [
            "./src/assets/fonts/Manrope-ExtraLight.ttf",
            "./src/assets/fonts/Manrope-Light.ttf",
            "./src/assets/fonts/Manrope-Regular.ttf",
            "./src/assets/fonts/Manrope-Medium.ttf",
            "./src/assets/fonts/Manrope-SemiBold.ttf",
            "./src/assets/fonts/Manrope-Bold.ttf",
            "./src/assets/fonts/Manrope-ExtraBold.ttf",
          ],
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./src/assets/images/logo-manduul.png",
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
        },
      ],
    ],
  },
};
