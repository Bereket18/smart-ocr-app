import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
// import * as FileSystem from 'expo-file-system'

interface UseImagePickerReturn {
  pickFromCamera: () => Promise<string | null>;
  pickFromGallery: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

async function compressImage(uri: string): Promise<string> {
  const attempts = [
    { width: 800, compress: 0.5 },
    { width: 600, compress: 0.3 },
    { width: 400, compress: 0.2 },
  ]

  let lastUri = uri

  for (const { width, compress } of attempts) {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      { compress, format: ImageManipulator.SaveFormat.JPEG }
    )
    lastUri = result.uri
    break
  }

  return lastUri
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
    setIsLoading(true)
    setError(null)

    console.log('Gallery: requesting permission...')
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    console.log('Gallery: permission status =', status)

    if (status !== 'granted') {
      setError('Gallery permission is required')
      console.log('Gallery: permission denied')
      return null
    }

    console.log('Gallery: launching picker...')
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: false,
      quality: 1,
    })

    console.log('Gallery: result canceled =', result.canceled)

    if (result.canceled) return null

    const uri = result.assets[0].uri
    console.log('Gallery: got uri =', uri)

    const compressed = await compressImage(uri)
    console.log('Gallery: compressed =', compressed)
    return compressed

  } catch (err: any) {
    console.log('Gallery ERROR:', err.message)
    setError(err.message ?? 'Gallery failed')
    return null
  } finally {
    setIsLoading(false)
  }
}

  return { pickFromCamera, pickFromGallery, isLoading, error };
}
