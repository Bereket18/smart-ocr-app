import { Theme } from "@/constants/colors";
import { FontSize, Radius, Spacing } from "@/constants/typography";
import { useFirebase } from "@/hooks/useFirebase";
import { useScanStore } from "@/store/scanStore";
import { Scan } from "@/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HistoryScreen() {
  const { scans, setActiveScan } = useScanStore();
  const { fetchScans, removeScan, error } = useFirebase();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchScans();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchScans();
    setRefreshing(false);
  }

  function handlePress(scan: Scan) {
    setActiveScan(scan);
    router.push("/results");
  }

  function handleDelete(scan: Scan) {
    Alert.alert("Delete Scan", "Are you sure you want to delete this scan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeScan(scan),
      },
    ]);
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🕐</Text>
        <Text style={styles.emptyTitle}>No scans yet</Text>
        <Text style={styles.emptySubtitle}>
          Your scan history will appear here
        </Text>
      </View>
    );
  }

  function renderItem({ item }: { item: Scan }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
        <View style={styles.cardContent}>
          <Text style={styles.cardText} numberOfLines={2}>
            {item.editedText || "No text extracted"}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardDate}>
              {item.createdAt?.toString().slice(0, 10) ?? ""}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.language.toUpperCase()}
              </Text>
            </View>
            {!item.synced && (
              <Text style={styles.unsyncedBadge}>⏳ Not saved</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}
      <FlatList
        data={scans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Theme.accent}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  listContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  errorBanner: {
    backgroundColor: Theme.error,
    padding: Spacing.sm,
    alignItems: "center",
  },
  errorText: {
    color: Theme.textPrimary,
    fontSize: FontSize.caption,
  },
  emptyState: {
    flex: 1,
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
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Theme.border,
    flexDirection: "row",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardText: {
    fontSize: FontSize.body,
    color: Theme.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardDate: {
    fontSize: FontSize.caption,
    color: Theme.textSecondary,
  },
  badge: {
    backgroundColor: Theme.accent,
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  badgeText: {
    color: Theme.background,
    fontSize: FontSize.badge,
    fontWeight: "bold",
  },
  unsyncedBadge: {
    fontSize: FontSize.badge,
    color: Theme.warning,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  deleteText: {
    fontSize: 18,
  },
});
