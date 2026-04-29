import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Theme } from "@/constants/colors";
import { FontSize, Spacing, Radius } from "@/constants/typography";

interface Props {
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  onDismiss: () => void;
}

export function AISummaryCard({ summary, isLoading, error, onDismiss }: Props) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const visible = isLoading || !!summary || !!error;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.card, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>✨</Text>
          <Text style={styles.title}>AI Summary</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={Theme.aiPurple} size="small" />
          <Text style={styles.loadingText}>Generating summary...</Text>
        </View>
      )}

      {error && !isLoading && <Text style={styles.errorText}>⚠️ {error}</Text>}

      {summary && !isLoading && (
        <Text style={styles.summaryText}>{summary}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2D1B4E",
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.aiPurple,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: FontSize.h2,
    fontWeight: "bold",
    color: Theme.aiPurple,
  },
  dismissButton: {
    padding: Spacing.xs,
  },
  dismissText: {
    color: Theme.textSecondary,
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.body,
    color: Theme.textSecondary,
  },
  errorText: {
    fontSize: FontSize.body,
    color: Theme.error,
  },
  summaryText: {
    fontSize: FontSize.body,
    color: Theme.textPrimary,
    lineHeight: 24,
  },
});
