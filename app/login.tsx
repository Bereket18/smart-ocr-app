import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Theme } from "@/constants/colors";
import { FontSize, Spacing, Radius } from "@/constants/typography";
import { loginUser, registerUser } from "@/services/firebase.service";
import { useTheme } from "@/hooks/useTheme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const Theme = useTheme();

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    try {
      setIsLoading(true);
      if (isRegister) {
        await registerUser(email.trim(), password);
      } else {
        await loginUser(email.trim(), password);
      }
      router.replace("/");
    } catch (err: any) {
      const message =
        err.code === "auth/user-not-found"
          ? "No account found"
          : err.code === "auth/wrong-password"
            ? "Incorrect password"
            : err.code === "auth/email-already-in-use"
              ? "Email already registered"
              : err.code === "auth/invalid-email"
                ? "Invalid email"
                : "Something went wrong. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>📄</Text>
        <Text style={styles.title}>Smart OCR</Text>
        <Text style={styles.subtitle}>
          {isRegister ? "Create your account" : "Sign in to your account"}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={Theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading
                ? "Please wait..."
                : isRegister
                  ? "Create Account"
                  : "Sign In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsRegister(!isRegister)}
          >
            <Text style={styles.switchText}>
              {isRegister
                ? "Already have an account? Sign in"
                : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl3,
  },
  logo: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.display,
    fontWeight: "bold",
    color: Theme.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Theme.textSecondary,
    marginBottom: Spacing.xl3,
  },
  form: {
    width: "100%",
    gap: Spacing.md,
  },
  input: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.input,
    padding: Spacing.lg,
    fontSize: FontSize.body,
    color: Theme.textPrimary,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  button: {
    backgroundColor: Theme.accent,
    borderRadius: Radius.button,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Theme.background,
    fontSize: FontSize.body,
    fontWeight: "bold",
  },
  switchButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  switchText: {
    color: Theme.accent,
    fontSize: FontSize.body,
  },
});
