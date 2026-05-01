export const Colors = {
  dark: {
    background: "#0F172A",
    surface: "#1E293B",
    border: "#334155",
    accent: "#06B6D4",
    aiPurple: "#8B5CF6",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    white: "#FFFFFF",
  },
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    border: "#E2E8F0",
    accent: "#0891B2",
    aiPurple: "#7C3AED",
    success: "#059669",
    warning: "#D97706",
    error: "#DC2626",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    white: "#FFFFFF",
  },
};

export type ThemeType = typeof Colors.dark;
export const Theme = Colors.dark;
