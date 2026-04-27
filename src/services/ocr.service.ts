import { OCRResult } from '../types/index'
import NetInfo from '@react-native-community/netinfo'

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate'
const VISION_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY

async function imageToBase64(uri: string): Promise<string> {
  const response = await fetch(uri)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function recognizeWithGoogleVision(imageUri: string): Promise<OCRResult> {
  const base64 = await imageToBase64(imageUri)

  const body = {
    requests: [
      {
        image: { content: base64 },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
      },
    ],
  }

  const response = await fetch(`${VISION_URL}?key=${VISION_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.log('Vision Error:', JSON.stringify(errorData))
    throw new Error(`VISION_ERROR: ${response.status}`)
  }

  const data = await response.json()
  console.log('Vision Response:', JSON.stringify(data).slice(0, 200))

  const annotation = data.responses?.[0]?.fullTextAnnotation

  if (!annotation || !annotation.text) {
    throw new Error('NO_TEXT_DETECTED')
  }

  const pages = annotation.pages ?? []
  const language =
    pages[0]?.property?.detectedLanguages?.[0]?.languageCode ?? 'und'

  return {
    text: annotation.text.trim(),
    language,
  }
}

async function recognizeWithMLKit(imageUri: string): Promise<OCRResult> {
  throw new Error('ML_KIT_UNAVAILABLE')
}

export async function recognizeText(imageUri: string): Promise<OCRResult> {
  const network = await NetInfo.fetch()
  const isOffline = network.isConnected === false

  if (isOffline) {
    try {
      return await recognizeWithMLKit(imageUri)
    } catch {
      throw new Error('NO_INTERNET_CONNECTION')
    }
  }

  return await recognizeWithGoogleVision(imageUri)
}