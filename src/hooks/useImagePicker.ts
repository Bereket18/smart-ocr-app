import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import * as FileSystem from 'expo-file-system'

interface UseImagePickerReturn {
  pickFromCamera: () => Promise<string | null>;
  pickFromGallery: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

async function compressImage(uri: string): Promise<string> {
  const sizes = [
    { width: 800, compress: 0.4 },
    { width: 600, compress: 0.3 },
    { width: 500, compress: 0.2 },
    { width: 400, compress: 0.1 },
  ]

  for (const { width, compress } of sizes) {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      { compress, format: ImageManipulator.SaveFormat.JPEG }
    )

    const info = await FileSystem.getInfoAsync(result.uri)
    const sizeInKB = (info as any).size / 1024

    console.log(`Compressed: ${width}px quality ${compress} → ${Math.round(sizeInKB)}KB`)

    if (sizeInKB < 900) {
      return result.uri
    }
  }

  throw new Error('IMAGE_TOO_LARGE')
}

export function useImagePicker(): UseImagePickerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickFromCamera(): Promise<string | null> {
    try {
      setIsLoading(true);
      setError(null);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        setError("Camera permission is required to scan documents");
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return null;

      const uri = result.assets[0].uri;
      const compressed = await compressImage(uri);
      return compressed;
    } catch (err: any) {
      setError(err.message ?? "Camera failed");
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function pickFromGallery(): Promise<string | null> {
    try {
      setIsLoading(true);
      setError(null);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        setError("Gallery permission is required to upload images");
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return null;

      const uri = result.assets[0].uri;
      const compressed = await compressImage(uri);
      return compressed;
    } catch (err: any) {
      setError(err.message ?? "Gallery failed");
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { pickFromCamera, pickFromGallery, isLoading, error };
}
