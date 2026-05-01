import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { FontSize, Spacing, Radius } from "@/constants/typography";
import { useScanStore } from "@/store/scanStore";
import { logoutUser, auth } from "@/services/firebase.service";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useTheme } from "@/hooks/useTheme";
import { ThemeType } from "@/constants/colors";

function SectionHeader({ title, Theme }: { title: string; Theme: ThemeType }) {
  return (
    <Text
      style={{
        fontSize: FontSize.badge,
        fontWeight: "bold",
        color: Theme.accent,
        letterSpacing: 1,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
      }}
    >
      {title}
    </Text>
  );
}

function SettingsRow({
  label,
  value,
  onPress,
  danger,
  Theme,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  Theme: ThemeType;
}) {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: Theme.surface,
        borderRadius: Radius.card,
        padding: Spacing.lg,
        marginBottom: 2,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Theme.border,
      }}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text
        style={{
          fontSize: FontSize.body,
          color: danger ? Theme.error : Theme.textPrimary,
        }}
      >
        {label}
      </Text>
      {value && (
        <Text style={{ fontSize: FontSize.body, color: Theme.textSecondary }}>
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const Theme = useTheme();
  const { clearAllScans, scans, themeMode, setThemeMode } = useScanStore();
  const { isOnline, pendingCount } = useOfflineSync();

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logoutUser();
          router.replace("/login");
        },
      },
    ]);
  }

  function handleClearHistory() {
    Alert.alert(
      "Clear All History",
      `This will permanently delete all ${scans.length} scans.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => clearAllScans(),
        },
      ],
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Theme.background }}
      contentContainerStyle={{ padding: Spacing.lg }}
    >
      <SectionHeader title="STATUS" Theme={Theme} />
      <View
        style={{
          backgroundColor: Theme.surface,
          borderRadius: Radius.card,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: Theme.border,
          gap: Spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: FontSize.body, color: Theme.textSecondary }}>
            Connection
          </Text>
          <View
            style={{
              borderRadius: Radius.badge,
              paddingHorizontal: Spacing.sm,
              paddingVertical: 2,
              backgroundColor: isOnline ? Theme.success : Theme.error,
            }}
          >
            <Text
              style={{
                fontSize: FontSize.badge,
                fontWeight: "bold",
                color: "#FFFFFF",
              }}
            >
              {isOnline ? "● Online" : "● Offline"}
            </Text>
          </View>
        </View>

        {pendingCount > 0 && (
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={{ fontSize: FontSize.body, color: Theme.textSecondary }}
            >
              Pending sync
            </Text>
            <Text style={{ fontSize: FontSize.body, color: Theme.textPrimary }}>
              {pendingCount} scans
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: FontSize.body, color: Theme.textSecondary }}>
            Total scans
          </Text>
          <Text style={{ fontSize: FontSize.body, color: Theme.textPrimary }}>
            {scans.length}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: FontSize.body, color: Theme.textSecondary }}>
            Account
          </Text>
          <Text
            style={{ fontSize: FontSize.body, color: Theme.textPrimary }}
            numberOfLines={1}
          >
            {auth.currentUser?.email ?? "Not signed in"}
          </Text>
        </View>
      </View>

      <SectionHeader title="APPEARANCE" Theme={Theme} />
      <View
        style={{
          backgroundColor: Theme.surface,
          borderRadius: Radius.card,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: Theme.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: FontSize.body, color: Theme.textPrimary }}>
          Dark Mode
        </Text>
        <TouchableOpacity
          style={{
            width: 48,
            height: 28,
            borderRadius: 14,
            backgroundColor: themeMode === "dark" ? Theme.accent : Theme.border,
            justifyContent: "center",
            padding: 2,
          }}
          onPress={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              alignSelf: themeMode === "dark" ? "flex-end" : "flex-start",
            }}
          />
        </TouchableOpacity>
      </View>

      <SectionHeader title="OCR LANGUAGE" Theme={Theme} />
      <SettingsRow label="Language" value="Auto Detect" Theme={Theme} />

      <SectionHeader title="EXPORT" Theme={Theme} />
      <SettingsRow label="Default Format" value="TXT" Theme={Theme} />

      <SectionHeader title="ACCOUNT" Theme={Theme} />
      <SettingsRow
        label="Sign Out"
        onPress={handleLogout}
        danger
        Theme={Theme}
      />

      <SectionHeader title="DANGER ZONE" Theme={Theme} />
      <SettingsRow
        label="Clear All History"
        onPress={handleClearHistory}
        danger
        Theme={Theme}
      />

      <Text
        style={{
          fontSize: FontSize.caption,
          color: Theme.textSecondary,
          textAlign: "center",
          marginTop: Spacing.xl3,
        }}
      >
        v1.0.0 · Smart OCR
      </Text>
    </ScrollView>
  );
}
