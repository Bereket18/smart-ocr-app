import { TextEditor } from "@/components/TextEditor";
import { Theme } from "@/constants/colors";
import { FontSize, Radius, Spacing } from "@/constants/typography";
import { useFirebase } from "@/hooks/useFirebase";
import { useOCR } from "@/hooks/useOCR";
import { useScanStore } from "@/store/scanStore";
import { Scan } from "@/types";
import { generateId } from "@/utils/formatters";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResultsScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const { activeScan } = useScanStore();
  const { status, text, language, error, processImage, reset } = useOCR();
  const { addScan } = useScanStore();
  const { saveScan, isUploading, uploadProgress } = useFirebase();
  const savedText = useRef("");

  useEffect(() => {
    if (imageUri) {
      processImage(imageUri);
    } else if (activeScan) {
      reset();
    }
  }, [imageUri]);

  async function handleSave() {
    const currentText =
      savedText.current || text || activeScan?.editedText || "";

    if (!currentText.trim()) return;

    const newScan: Scan = {
      id: activeScan?.id ?? generateId(),
      imageUri: imageUri ?? activeScan?.imageUri ?? "",
      imageUrl: activeScan?.imageUrl ?? "",
      extractedText: text || activeScan?.extractedText || "",
      editedText: currentText,
      language: language || activeScan?.language || "und",
      summary: null,
      translation: null,
      createdAt: activeScan?.createdAt ?? new Date().toISOString(),
      pageCount: 1,
      tags: [],
      folderId: null,
      synced: false,
    };

    await saveScan(newScan);

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
          {/* Language Badge */}
          {language || activeScan?.language ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {(language || activeScan?.language || "und").toUpperCase()}
              </Text>
            </View>
          ) : null}

          {/* Save Button (Only one copy needed here) */}
          {(status === "success" || activeScan) && (
            <TouchableOpacity
              style={[
                styles.saveButton,
                isUploading && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isUploading}
            >
              <Text style={styles.saveButtonText}>
                {isUploading
                  ? `Saving... ${Math.round(uploadProgress * 100)}%`
                  : "💾  Save"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  saveButtonDisabled: {
    backgroundColor: Theme.border,
  },
});
