import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Theme } from "@/constants/colors";
import { FontSize, Spacing, Radius } from "@/constants/typography";
import { useScanStore } from "@/store/scanStore";
import { logoutUser } from "@/services/firebase.service";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { auth } from "@/services/firebase.service";

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingsRow({
  label,
  value,
  onPress,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
        {label}
      </Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { clearAllScans, scans } = useScanStore();
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
      `This will permanently delete all ${scans.length} scans. This cannot be undone.`,
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="STATUS" />
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Connection</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isOnline ? Theme.success : Theme.error },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {isOnline ? "● Online" : "● Offline"}
            </Text>
          </View>
        </View>
        {pendingCount > 0 && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending sync</Text>
            <Text style={styles.statusValue}>{pendingCount} scans</Text>
          </View>
        )}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Total scans</Text>
          <Text style={styles.statusValue}>{scans.length}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Account</Text>
          <Text style={styles.statusValue} numberOfLines={1}>
            {auth.currentUser?.email ?? "Not signed in"}
          </Text>
        </View>
      </View>

      <SectionHeader title="APPEARANCE" />
      <SettingsRow label="Dark Mode" value="On" />

      <SectionHeader title="OCR LANGUAGE" />
      <SettingsRow label="Language" value="Auto Detect" />

      <SectionHeader title="EXPORT" />
      <SettingsRow label="Default Format" value="TXT" />

      <SectionHeader title="ACCOUNT" />
      <SettingsRow label="Sign Out" onPress={handleLogout} danger />

      <SectionHeader title="DANGER ZONE" />
      <SettingsRow
        label="Clear All History"
        onPress={handleClearHistory}
        danger
      />

      <Text style={styles.version}>v1.0.0 · Smart OCR</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    fontSize: FontSize.badge,
    fontWeight: "bold",
    color: Theme.accent,
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  statusCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: Spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: FontSize.body,
    color: Theme.textSecondary,
  },
  statusValue: {
    fontSize: FontSize.body,
    color: Theme.textPrimary,
    maxWidth: 200,
  },
  statusBadge: {
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: FontSize.badge,
    fontWeight: "bold",
    color: Theme.textPrimary,
  },
  row: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.border,
  },
  rowLabel: {
    fontSize: FontSize.body,
    color: Theme.textPrimary,
  },
  rowLabelDanger: {
    color: Theme.error,
  },
  rowValue: {
    fontSize: FontSize.body,
    color: Theme.textSecondary,
  },
  version: {
    fontSize: FontSize.caption,
    color: Theme.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xl3,
  },
});
