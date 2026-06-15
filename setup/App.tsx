import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import { persistor, store } from "./store";
import { NavigationContainer } from "./navigation/navigator-container";
import { AnimatedSplash } from "./animated-splash";
import { OnlineProvider } from "./net/online-provider";
import { ThemeProvider, ThemedStatusBar } from "../src/styles/theme-provider";

// Native splash-ийг барьж байгаад AnimatedSplash бэлэн болоход нуунаа.
SplashScreen.preventAutoHideAsync().catch(() => {});

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ThemeProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <OnlineProvider>
                <NavigationContainer />
              </OnlineProvider>
              <AnimatedSplash />
              <ThemedStatusBar />
            </GestureHandlerRootView>
          </ThemeProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
