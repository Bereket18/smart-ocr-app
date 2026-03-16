import { Theme } from "@/constants/colors";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Theme.background },
          headerTintColor: Theme.textPrimary,
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: Theme.background },
        }}
      >
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
