import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { FontSize, Spacing, Radius } from "@/constants/typography";
import { useScanStore } from "@/store/scanStore";
import { useTheme } from "@/hooks/useTheme";

export default function HomeScreen() {
  const Theme = useTheme();
  const { scans } = useScanStore();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Theme.background }}
      contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.xl3 }}
    >
      <View style={{ minHeight: 200, marginBottom: Spacing.xl }}>
        {scans.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: Spacing.xl4,
            }}
          >
            <Text style={{ fontSize: 64, marginBottom: Spacing.lg }}>📄</Text>
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
              Tap Scan Now to capture your first document
            </Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            <Text
              style={{
                fontSize: FontSize.h2,
                fontWeight: "600",
                color: Theme.textPrimary,
                marginBottom: Spacing.md,
              }}
            >
              Recent Scans
            </Text>
            {scans.slice(0, 3).map((scan) => (
              <TouchableOpacity
                key={scan.id}
                style={{
                  backgroundColor: Theme.surface,
                  borderRadius: Radius.card,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: Theme.border,
                }}
                onPress={() => router.push("/history")}
              >
                <Text
                  style={{
                    fontSize: FontSize.body,
                    color: Theme.textPrimary,
                    marginBottom: Spacing.xs,
                  }}
                  numberOfLines={2}
                >
                  {scan.editedText}
                </Text>
                <Text
                  style={{
                    fontSize: FontSize.caption,
                    color: Theme.textSecondary,
                  }}
                >
                  {scan.createdAt.slice(0, 10)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: Theme.accent,
          borderRadius: Radius.button,
          height: 56,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: Spacing.md,
        }}
        onPress={() => router.push("/camera")}
      >
        <Text
          style={{
            color: Theme.background,
            fontSize: FontSize.body,
            fontWeight: "bold",
            letterSpacing: 1,
          }}
        >
          📷 SCAN NOW
        </Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", gap: Spacing.sm }}>
        <TouchableOpacity
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: Theme.accent,
            borderRadius: Radius.button,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() =>
            router.push({ pathname: "/camera", params: { mode: "gallery" } })
          }
        >
          <Text
            style={{
              color: Theme.accent,
              fontSize: FontSize.body,
              fontWeight: "600",
            }}
          >
            🖼 Gallery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: Theme.accent,
            borderRadius: Radius.button,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => {}}
        >
          <Text
            style={{
              color: Theme.accent,
              fontSize: FontSize.body,
              fontWeight: "600",
            }}
          >
            📄 Multi-page
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
