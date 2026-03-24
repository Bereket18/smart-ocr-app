import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'

interface UseImagePickerReturn {
  pickFromCamera: () => Promise<string | null>
  pickFromGallery: () => Promise<string | null>
  isLoading: boolean
  error: string | null
}

async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  )
  return result.uri
}

export function useImagePicker(): UseImagePickerReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pickFromCamera(): Promise<string | null> {
    try {
      setIsLoading(true)
      setError(null)

      const { status } = await ImagePicker.requestCameraPermissionsAsync()

      if (status !== 'granted') {
        setError('Camera permission is required to scan documents')
        return null
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      })

      if (result.canceled) return null

      const uri = result.assets[0].uri
      const compressed = await compressImage(uri)
      return compressed

    } catch (err: any) {
      setError(err.message ?? 'Camera failed')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  async function pickFromGallery(): Promise<string | null> {
    try {
      setIsLoading(true)
      setError(null)

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== 'granted') {
        setError('Gallery permission is required to upload images')
        return null
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      })

      if (result.canceled) return null

      const uri = result.assets[0].uri
      const compressed = await compressImage(uri)
      return compressed

    } catch (err: any) {
      setError(err.message ?? 'Gallery failed')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { pickFromCamera, pickFromGallery, isLoading, error }
}