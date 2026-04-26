import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Theme } from "@/constants/colors";
import { FontSize, Spacing, Radius } from "@/constants/typography";
import { countWords } from "@/utils/formatters";

interface Props {
  initialText: string;
  onTextChange?: (text: string) => void;
}

type Action =
  | { type: "SET"; payload: string }
  | { type: "UNDO" }
  | { type: "RESET" };

function reduce(
  current: string,
  history: string[],
  action: Action,
): { current: string; history: string[] } {
  switch (action.type) {
    case "SET":
      return {
        current: action.payload,
        history: [...history, current],
      };
    case "UNDO": {
      if (history.length === 0) return { current, history };
      return {
        current: history[history.length - 1],
        history: history.slice(0, -1),
      };
    }
    case "RESET":
      return { current, history: [] };
    default:
      return { current, history };
  }
}

export function TextEditor({ initialText, onTextChange }: Props) {
  const [current, setCurrent] = useState(initialText);
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  function dispatch(action: Action) {
    const next = reduce(current, history, action);
    setCurrent(next.current);
    setHistory(next.history);
    onTextChange?.(next.current);
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(current);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[
            styles.toolButton,
            history.length === 0 && styles.toolButtonDisabled,
          ]}
          onPress={() => dispatch({ type: "UNDO" })}
          disabled={history.length === 0}
        >
          <Text style={styles.toolText}>↩ Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => dispatch({ type: "RESET" })}
        >
          <Text style={[styles.toolText, styles.toolTextWarning]}>↺ Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton} onPress={handleCopy}>
          <Text style={[styles.toolText, styles.toolTextAccent]}>
            {copied ? "✓ Copied" : "⎘ Copy"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.wordCount}>{countWords(current)} words</Text>
      </View>

      <TextInput
        style={styles.input}
        value={current}
        onChangeText={(text) => dispatch({ type: "SET", payload: text })}
        multiline
        textAlignVertical="top"
        placeholder="No text extracted"
        placeholderTextColor={Theme.textSecondary}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.card,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  toolButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.input,
    backgroundColor: Theme.background,
  },
  toolButtonDisabled: {
    opacity: 0.4,
  },
  toolText: {
    fontSize: FontSize.caption,
    color: Theme.textSecondary,
    fontWeight: "600",
  },
  toolTextAccent: {
    color: Theme.accent,
  },
  toolTextWarning: {
    color: Theme.warning,
  },
  wordCount: {
    fontSize: FontSize.caption,
    color: Theme.textSecondary,
    marginLeft: "auto",
  },
  input: {
    flex: 1,
    backgroundColor: Theme.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    fontSize: FontSize.bodyLarge,
    color: Theme.textPrimary,
    minHeight: 300,
    borderWidth: 1,
    borderColor: Theme.border,
  },
});
