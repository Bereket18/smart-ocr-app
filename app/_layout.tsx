import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/colors";
import { auth } from "@/services/firebase.service";
import { useScanStore } from "@/store/scanStore";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { themeMode } = useScanStore();
  const Theme = Colors[themeMode];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      setIsReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) router.replace("/login");
  }, [isReady, isLoggedIn]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Theme.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={Theme.accent} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Theme.background },
          headerTintColor: Theme.textPrimary,
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: Theme.background },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="camera"
          options={{ presentation: "fullScreenModal", headerShown: false }}
        />
        <Stack.Screen name="results" options={{ title: "Results" }} />
      </Stack>
    </>
  );
}
