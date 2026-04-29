const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2'
const API_KEY = process.env.EXPO_PUBLIC_TRANSLATE_KEY

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  if (!API_KEY) throw new Error('TRANSLATE_KEY_MISSING')

  const response = await fetch(`${TRANSLATE_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      target: targetLanguage,
      format: 'text',
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.log('Translate error:', JSON.stringify(data))
    throw new Error(`TRANSLATE_ERROR: ${response.status}`)
  }

  const translated = data.data?.translations?.[0]?.translatedText
  if (!translated) throw new Error('NO_TRANSLATION_RETURNED')

  return translated
}