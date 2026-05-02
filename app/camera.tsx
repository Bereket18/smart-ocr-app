import { Theme } from "@/constants/colors";
import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { FontSize, Radius, Spacing } from "@/constants/typography";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useTheme } from "@/hooks/useTheme";

export default function CameraScreen() {
  const Theme = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [torchOn, setTorchOn] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { pickFromGallery, isLoading } = useImagePicker();

  useEffect(() => {
    if (mode === "gallery") {
      openGallery();
    }
  }, []);

  async function openGallery() {
    const uri = await pickFromGallery();
    if (uri) {
      router.replace({ pathname: "/results", params: { imageUri: uri } });
    } else {
      router.back();
    }
  }

  function handleClose() {
    router.back();
  }

  function handleFlipCamera() {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }

  function handleToggleFlash() {
    setTorchOn((prev) => !prev);
  }

  async function handleCapture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo) return;
      router.push({ pathname: "/results", params: { imageUri: photo.uri } });
    } catch {
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  }

  async function handleGallery() {
    const uri = await pickFromGallery();
    if (uri) {
      router.push({ pathname: "/results", params: { imageUri: uri } });
    }
  }

  if (mode === "gallery") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Theme.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>🖼️</Text>
        <Text style={{ fontSize: FontSize.body, color: Theme.textSecondary }}>
          Opening gallery...
        </Text>
      </View>
    );
  }

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Theme.background,
          alignItems: "center",
          justifyContent: "center",
          padding: Spacing.xl3,
        }}
      >
        <Text style={{ fontSize: 64, marginBottom: Spacing.lg }}>📷</Text>
        <Text
          style={{
            fontSize: FontSize.h1,
            fontWeight: "bold",
            color: Theme.textPrimary,
            marginBottom: Spacing.sm,
            textAlign: "center",
          }}
        >
          Camera Access Required
        </Text>
        <Text
          style={{
            fontSize: FontSize.body,
            color: Theme.textSecondary,
            textAlign: "center",
            marginBottom: Spacing.xl2,
          }}
        >
          Smart OCR needs camera access to scan documents
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: Theme.accent,
            borderRadius: 8,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.xl2,
            marginBottom: Spacing.md,
          }}
          onPress={requestPermission}
        >
          <Text
            style={{
              color: Theme.background,
              fontSize: FontSize.body,
              fontWeight: "bold",
            }}
          >
            Grant Permission
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingVertical: Spacing.sm }}
          onPress={handleClose}
        >
          <Text style={{ color: Theme.textSecondary, fontSize: FontSize.body }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        enableTorch={torchOn}
      />

      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "space-between",
          paddingTop: Spacing.xl3,
          paddingBottom: Spacing.xl2,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <TouchableOpacity
          style={{
            alignSelf: "flex-start",
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 20,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={handleClose}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            ✕
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            marginVertical: Spacing.xl,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 30,
              height: 30,
              borderColor: Theme.accent,
              borderWidth: 3,
              borderRightWidth: 0,
              borderBottomWidth: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 30,
              height: 30,
              borderColor: Theme.accent,
              borderWidth: 3,
              borderLeftWidth: 0,
              borderBottomWidth: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 30,
              left: 0,
              width: 30,
              height: 30,
              borderColor: Theme.accent,
              borderWidth: 3,
              borderRightWidth: 0,
              borderTopWidth: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 30,
              right: 0,
              width: 30,
              height: 30,
              borderColor: Theme.accent,
              borderWidth: 3,
              borderLeftWidth: 0,
              borderTopWidth: 0,
            }}
          />
          <Text
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: FontSize.caption,
              textAlign: "center",
            }}
          >
            Align document within corners
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: Spacing.xl,
          }}
        >
          <TouchableOpacity
            style={{
              width: 50,
              height: 50,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleToggleFlash}
          >
            <Text style={{ fontSize: 28 }}>{torchOn ? "🔦" : "⚡️"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              borderWidth: 3,
              borderColor: Theme.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleCapture}
            disabled={isLoading}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#fff",
              }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: 50,
              height: 50,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleFlipCamera}
          >
            <Text style={{ fontSize: 28 }}>🔄</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{
            alignSelf: "center",
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.xl2,
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: Theme.accent,
            backgroundColor: "rgba(6,182,212,0.15)",
            marginTop: Spacing.sm,
          }}
          onPress={handleGallery}
        >
          <Text
            style={{
              color: Theme.accent,
              fontSize: FontSize.body,
              fontWeight: "600",
            }}
          >
            🖼 Choose from Gallery
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    paddingTop: Spacing.xl3,
    paddingBottom: Spacing.xl2,
    paddingHorizontal: Spacing.lg,
  },
  closeButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  frameContainer: {
    flex: 1,
    marginVertical: Spacing.xl,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: Theme.accent,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 30,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 30,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  frameGuide: {
    color: "rgba(255,255,255,0.8)",
    fontSize: FontSize.caption,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
  },
  controlButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: {
    fontSize: 28,
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: Theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  galleryButton: {
    alignSelf: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl2,
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: Theme.accent,
    backgroundColor: "rgba(6,182,212,0.15)",
  },
  galleryText: {
    color: Theme.accent,
    fontSize: FontSize.body,
    fontWeight: "600",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl3,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    fontSize: FontSize.h1,
    fontWeight: "bold",
    color: Theme.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  permissionSubtitle: {
    fontSize: FontSize.body,
    color: Theme.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl2,
  },
  permissionButton: {
    backgroundColor: Theme.accent,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl2,
    marginBottom: Spacing.md,
  },
  permissionButtonText: {
    color: Theme.background,
    fontSize: FontSize.body,
    fontWeight: "bold",
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
  },
  cancelText: {
    color: Theme.textSecondary,
    fontSize: FontSize.body,
  },
});
