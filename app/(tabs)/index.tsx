import { Theme } from "@/constants/colors";
import { FontSize, Radius, Spacing } from "@/constants/typography";
import { useScanStore } from "@/store/scanStore";
import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen() {
  const { scans } = useScanStore();

  function handleScanNow() {
    router.push("/camera");
  }

  function handleGallery() {
    router.push({ pathname: "/camera", params: { mode: "gallery" } });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroArea}>
        {scans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap Scan Now to capture your first document
            </Text>
          </View>
        ) : (
          <View style={styles.recentStrip}>
            <Text style={styles.recentLabel}>Recent Scans</Text>
            {scans.slice(0, 3).map((scan) => (
              <TouchableOpacity
                key={scan.id}
                style={styles.recentCard}
                onPress={() => router.push("/history")}
              >
                <Text style={styles.recentText} numberOfLines={2}>
                  {scan.editedText}
                </Text>
                <Text style={styles.recentDate}>
                  {scan.createdAt.slice(0, 10)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleScanNow}>
        <Text style={styles.primaryButtonText}>📷 SCAN NOW</Text>
      </TouchableOpacity>

      <View style={styles.secondaryRow}>
        <TouchableOpacity style={styles.outlineButton} onPress={handleGallery}>
          <Text style={styles.outlineButtonText}>🖼 Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineButton} onPress={() => {}}>
          <Text style={styles.outlineButtonText}>📄 Multi-page</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: Spacing.xl3,
  },
  heroArea: {
    minHeight: 200,
    marginBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl4,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.h1,
    fontWeight: "bold",
    color: Theme.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.body,
    color: Theme.textSecondary,
    textAlign: "center",
  },
  recentLabel: {
    fontSize: FontSize.h2,
    fontWeight: "600",
    color: Theme.textPrimary,
    marginBottom: Spacing.md,
  },
  recentStrip: {
    gap: Spacing.sm,
  },
  recentCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  recentText: {
    fontSize: FontSize.body,
    color: Theme.textPrimary,
    marginBottom: Spacing.xs,
  },
  recentDate: {
    fontSize: FontSize.caption,
    color: Theme.textSecondary,
  },
  primaryButton: {
    backgroundColor: Theme.accent,
    borderRadius: Radius.button,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    color: Theme.background,
    fontSize: FontSize.body,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Theme.accent,
    borderRadius: Radius.button,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    color: Theme.accent,
    fontSize: FontSize.body,
    fontWeight: "600",
  },
});
