import { useState } from 'react'
import { translateText } from '../services/translate.service'

interface TranslationState {
  translation: string | null
  isLoading: boolean
  error: string | null
  targetLanguage: string
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'am', label: 'Amharic' },
]

export { LANGUAGES }

export function useTranslation() {
  const [state, setState] = useState<TranslationState>({
    translation: null,
    isLoading: false,
    error: null,
    targetLanguage: 'en',
  })

  async function translate(text: string, targetLanguage: string): Promise<void> {
    if (!text.trim()) {
      setState((prev) => ({ ...prev, error: 'No text to translate' }))
      return
    }

    try {
      setState({
        translation: null,
        isLoading: true,
        error: null,
        targetLanguage,
      })

      const result = await translateText(text, targetLanguage)

      setState({
        translation: result,
        isLoading: false,
        error: null,
        targetLanguage,
      })
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message ?? 'TRANSLATE_FAILED',
      }))
    }
  }

  function clearTranslation() {
    setState({
      translation: null,
      isLoading: false,
      error: null,
      targetLanguage: 'en',
    })
  }

  return { ...state, translate, clearTranslation }
}