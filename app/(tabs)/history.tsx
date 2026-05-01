import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { FontSize, Spacing, Radius } from "@/constants/typography";
import { useScanStore } from "@/store/scanStore";
import { useFirebase } from "@/hooks/useFirebase";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useTheme } from "@/hooks/useTheme";
import { Scan } from "@/types/index";

export default function HistoryScreen() {
  const Theme = useTheme();
  const { scans, setActiveScan } = useScanStore();
  const { fetchScans, removeScan, error } = useFirebase();
  const { isOnline } = useOfflineSync();
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
    Alert.alert("Delete Scan", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeScan(scan) },
    ]);
  }

  function renderEmpty() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: Spacing.xl4,
        }}
      >
        <Text style={{ fontSize: 64, marginBottom: Spacing.lg }}>🕐</Text>
        <Text
          style={{
            fontSize: FontSize.h1,
            fontWeight: "bold",
            color: Theme.textPrimary,
            marginBottom: Spacing.sm,
          }}
        >
          No scans yet
        </Text>
        <Text
          style={{
            fontSize: FontSize.body,
            color: Theme.textSecondary,
            textAlign: "center",
          }}
        >
          Your scan history will appear here
        </Text>
      </View>
    );
  }

  function renderItem({ item }: { item: Scan }) {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: Theme.surface,
          borderRadius: Radius.card,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
          borderWidth: 1,
          borderColor: Theme.border,
          flexDirection: "row",
          alignItems: "center",
        }}
        onPress={() => handlePress(item)}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: FontSize.body,
              color: Theme.textPrimary,
              marginBottom: Spacing.xs,
            }}
            numberOfLines={2}
          >
            {item.editedText || "No text extracted"}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
            }}
          >
            <Text
              style={{ fontSize: FontSize.caption, color: Theme.textSecondary }}
            >
              {item.createdAt?.toString().slice(0, 10) ?? ""}
            </Text>
            <View
              style={{
                backgroundColor: Theme.accent,
                borderRadius: Radius.badge,
                paddingHorizontal: Spacing.xs,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  color: Theme.background,
                  fontSize: FontSize.badge,
                  fontWeight: "bold",
                }}
              >
                {item.language.toUpperCase()}
              </Text>
            </View>
            {!item.synced && (
              <Text style={{ fontSize: FontSize.badge, color: Theme.warning }}>
                ⏳ Not saved
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={{ padding: Spacing.sm }}
          onPress={() => handleDelete(item)}
        >
          <Text style={{ fontSize: 18 }}>🗑</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Theme.background }}>
      {!isOnline && (
        <View
          style={{
            backgroundColor: Theme.warning,
            padding: Spacing.sm,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: Theme.background,
              fontSize: FontSize.caption,
              fontWeight: "bold",
            }}
          >
            ● Offline — scans will sync when connected
          </Text>
        </View>
      )}
      {error && (
        <View
          style={{
            backgroundColor: Theme.error,
            padding: Spacing.sm,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: Theme.textPrimary, fontSize: FontSize.caption }}
          >
            ⚠️ {error}
          </Text>
        </View>
      )}
      <FlatList
        data={scans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }}
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
