import { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Theme } from "@/constants/colors";
import { FontSize, Spacing, Radius } from "@/constants/typography";
import { useOCR } from "@/hooks/useOCR";
import { useScanStore } from "@/store/scanStore";
import { TextEditor } from "@/components/TextEditor";
import { generateId, formatDate } from "@/utils/formatters";

export default function ResultsScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const { activeScan } = useScanStore();
  const { status, text, language, error, processImage, reset } = useOCR();
  const { addScan } = useScanStore();
  const savedText = useRef("");

  useEffect(() => {
    if (imageUri) {
      processImage(imageUri);
    } else if (activeScan) {
      reset();
    }
  }, [imageUri]);

  function handleSave() {
    if (!text && !activeScan) return;

    const scanText = savedText.current || text;

    const newScan = {
      id: generateId(),
      imageUri: imageUri ?? activeScan?.imageUri ?? "",
      imageUrl: "",
      extractedText: text || activeScan?.extractedText || "",
      editedText: scanText,
      language: language || activeScan?.language || "und",
      summary: null,
      translation: null,
      createdAt: new Date().toISOString(),
      pageCount: 1,
      tags: [],
      folderId: null,
      synced: false,
    };

    addScan(newScan);
    Alert.alert("Saved", "Scan saved to history", [
      { text: "OK", onPress: () => router.push("/history") },
    ]);
  }

  function renderContent() {
    if (status === "processing") {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.accent} />
          <Text style={styles.processingText}>Extracting text...</Text>
        </View>
      );
    }

    if (status === "error") {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>
            {error === "NO_TEXT_DETECTED"
              ? "No text found"
              : error === "NO_INTERNET_CONNECTION"
                ? "No internet connection"
                : "Something went wrong"}
          </Text>
          <Text style={styles.errorSubtitle}>
            {error === "NO_TEXT_DETECTED"
              ? "Try a clearer photo with better lighting"
              : error === "NO_INTERNET_CONNECTION"
                ? "Connect to the internet to scan. Offline mode coming soon."
                : "Please try again"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const displayText =
      status === "success" ? text : (activeScan?.editedText ?? "");

    return (
      <TextEditor
        initialText={displayText}
        onTextChange={(t) => {
          savedText.current = t;
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerMeta}>
          {language || activeScan?.language ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {(language || activeScan?.language || "und").toUpperCase()}
              </Text>
            </View>
          ) : null}
          {status === "success" && (
            <Text style={styles.metaText}>
              {formatDate(new Date().toISOString())}
            </Text>
          )}
        </View>

        {(status === "success" || activeScan) && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>💾 Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: Theme.accent,
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: Theme.background,
    fontSize: FontSize.badge,
    fontWeight: "bold",
  },
  metaText: {
    fontSize: FontSize.caption,
    color: Theme.textSecondary,
  },
  saveButton: {
    backgroundColor: Theme.accent,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  saveButtonText: {
    color: Theme.background,
    fontSize: FontSize.body,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl4,
  },
  processingText: {
    marginTop: Spacing.lg,
    fontSize: FontSize.body,
    color: Theme.textSecondary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: FontSize.h2,
    fontWeight: "bold",
    color: Theme.textPrimary,
    marginBottom: Spacing.sm,
  },
  errorSubtitle: {
    fontSize: FontSize.body,
    color: Theme.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Theme.accent,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.xl2,
    paddingVertical: Spacing.md,
  },
  retryText: {
    color: Theme.background,
    fontSize: FontSize.body,
    fontWeight: "bold",
  },
});
