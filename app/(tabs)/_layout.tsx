import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Text, TouchableOpacity } from "react-native";
import { Spacing } from "@/constants/typography";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  color,
  size,
}: {
  name: IconName;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} color={color} size={size} />;
}

export default function TabLayout() {
  const Theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Theme.surface,
          borderTopColor: Theme.border,
        },
        tabBarActiveTintColor: Theme.accent,
        tabBarInactiveTintColor: Theme.textSecondary,
        headerStyle: { backgroundColor: Theme.background },
        headerTintColor: Theme.textPrimary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Smart OCR",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="scan-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Scan History",
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="time-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
