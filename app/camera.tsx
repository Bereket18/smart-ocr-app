import { Theme } from "@/constants/colors";
import { FontSize, Radius, Spacing } from "@/constants/typography";
import { useImagePicker } from "@/hooks/useImagePicker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export default function CameraScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  // const [flash, setFlash] = useState<'off' | 'on'>('off')
  const [torchOn, setTorchOn] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { pickFromGallery, isLoading } = useImagePicker();
  const Theme = useTheme();

  function handleClose() {
    router.back();
  }

  function handleFlipCamera() {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }

  // function handleToggleFlash() {
  //   setFlash((prev) => (prev === 'off' ? 'on' : 'off'))
  // }

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

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionSubtitle}>
          Smart OCR needs camera access to scan documents
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={torchOn}
      />

      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.frameContainer}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <Text style={styles.frameGuide}>Align document within corners</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleToggleFlash}
          >
            <Text style={styles.controlText}>{torchOn ? "🔦" : "⚡️"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shutterButton}
            onPress={handleCapture}
            disabled={isLoading}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleFlipCamera}
          >
            <Text style={styles.controlText}>🔄</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.galleryButton} onPress={handleGallery}>
          <Text style={styles.galleryText}>🖼 Choose from Gallery</Text>
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
