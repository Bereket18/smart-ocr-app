import { AISummaryCard } from "@/components/AISummaryCard";
import { BottomSheet } from "@/components/BottomSheet";
import { TextEditor } from "@/components/TextEditor";
import { Theme } from "@/constants/colors";
import { FontSize, Radius, Spacing } from "@/constants/typography";
import { useAI } from "@/hooks/useAI";
import { useExport } from "@/hooks/useExport";
import { useFirebase } from "@/hooks/useFirebase";
import { useOCR } from "@/hooks/useOCR";
import { useScanStore } from "@/store/scanStore";
import { Scan } from "@/types/index";
import { generateId } from "@/utils/formatters";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation, LANGUAGES } from "@/hooks/useTranslation";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";

export default function ResultsScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const { activeScan } = useScanStore();
  const { status, text, language, error, processImage, reset } = useOCR();
  const { saveScan, isUploading, uploadProgress } = useFirebase();
  const { exportAsTXT, exportAsPDF, shareText, isExporting } = useExport();
  const {
    summary,
    isLoading: aiLoading,
    error: aiError,
    summarize,
    clearSummary,
  } = useAI();
  const savedText = useRef("");
  const [showExport, setShowExport] = useState(false);

  const {
    translation,
    isLoading: translateLoading,
    error: translateError,
    translate,
    clearTranslation,
  } = useTranslation();

  const [showLanguages, setShowLanguages] = useState(false);
  const Theme = useTheme();

  useEffect(() => {
    if (imageUri) {
      processImage(imageUri);
    } else if (activeScan) {
      reset();
    }
  }, [imageUri]);

  function getCurrentText(): string {
    return savedText.current || text || activeScan?.editedText || "";
  }

  async function handleSave() {
    const currentText = getCurrentText();
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

  const exportOptions = [
    {
      icon: "📄",
      label: "Export as TXT",
      description: "Plain text file you can open anywhere",
      onPress: () => exportAsTXT(getCurrentText()),
    },
    {
      icon: "📋",
      label: "Export as PDF",
      description: "Formatted PDF document",
      onPress: () => exportAsPDF(getCurrentText()),
    },
    {
      icon: "📤",
      label: "Share Text",
      description: "Share via any app on your phone",
      onPress: () => shareText(getCurrentText()),
    },
  ];

  const hasContent = status === "success" || !!activeScan;

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Left — Language Badge */}
        <View style={styles.headerLeft}>
          {(language || activeScan?.language) && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {(language || activeScan?.language || "und").toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Right — Action Buttons */}
        {hasContent && (
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => summarize(getCurrentText())}
              disabled={aiLoading}
            >
              <Text style={styles.aiButtonText}>✨ AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowLanguages(true)}
              disabled={translateLoading}
            >
              <Text style={styles.iconButtonText}>
                {translateLoading ? "..." : "🌐"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowExport(true)}
              disabled={isExporting}
            >
              <Text style={styles.iconButtonText}>
                {isExporting ? "..." : "📤"}
              </Text>
            </TouchableOpacity>

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
                  ? `${Math.round(uploadProgress * 100)}%`
                  : "💾 Save"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <AISummaryCard
          summary={summary}
          isLoading={aiLoading}
          error={aiError}
          onDismiss={clearSummary}
        />

        {(translation || translateLoading || translateError) && (
          <View style={styles.translationCard}>
            <View style={styles.translationHeader}>
              <Text style={styles.translationTitle}>🌐 Translation</Text>
              <TouchableOpacity onPress={clearTranslation}>
                <Text style={styles.dismissText}>✕</Text>
              </TouchableOpacity>
            </View>
            {translateLoading && (
              <ActivityIndicator color={Theme.accent} size="small" />
            )}
            {translateError && (
              <Text style={styles.translateError}>⚠️ {translateError}</Text>
            )}
            {translation && (
              <Text style={styles.translationText}>{translation}</Text>
            )}
          </View>
        )}
        {renderContent()}
      </ScrollView>

      {/* ── Export Sheet ── */}
      <BottomSheet
        visible={showExport}
        onClose={() => setShowExport(false)}
        options={exportOptions}
      />
      <BottomSheet
        visible={showLanguages}
        onClose={() => setShowLanguages(false)}
        options={LANGUAGES.map((lang) => ({
          icon: "🌐",
          label: lang.label,
          description: `Translate to ${lang.label}`,
          onPress: () => translate(getCurrentText(), lang.code),
        }))}
      />
    </KeyboardAvoidingView>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
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
  aiButton: {
    backgroundColor: "#2D1B4E",
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Theme.aiPurple,
  },
  aiButtonText: {
    color: Theme.aiPurple,
    fontSize: FontSize.body,
    fontWeight: "600",
  },
  iconButton: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  iconButtonText: {
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: Theme.accent,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  saveButtonDisabled: {
    backgroundColor: Theme.border,
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
  translationCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.accent,
  },
  translationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  translationTitle: {
    fontSize: FontSize.h2,
    fontWeight: "bold",
    color: Theme.accent,
  },
  dismissText: {
    color: Theme.textSecondary,
    fontSize: 16,
    fontWeight: "bold",
  },
  translationText: {
    fontSize: FontSize.body,
    color: Theme.textPrimary,
    lineHeight: 24,
  },
  translateError: {
    fontSize: FontSize.body,
    color: Theme.error,
  },
});
