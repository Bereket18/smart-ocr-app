# Sprint 7 & 8 — Documentation

## Files: summarize.service.ts · useAI.ts · AISummaryCard.tsx · translate.service.ts · useTranslation.ts

---

## New Terms in These Sprints

---

### REST API — Calling AI Services

All AI services in this sprint use the same pattern — a `fetch` POST request with JSON:

```ts
const response = await fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
  body: JSON.stringify({ model: '...', messages: [...] }),
})

const data = await response.json()
const result = data.choices[0].message.content
```

Each AI service has its own URL, auth header format, and response shape — but the pattern is identical. Learning one means you understand all of them.

---

### Bearer Token Authentication

```ts
'Authorization': `Bearer ${API_KEY}`
```

"Bearer" means "whoever holds this token is authorized." The API key is the token. This is the standard authentication format for REST APIs. Different from Google APIs which use `?key=` in the URL.

---

### `temperature` in AI APIs

Controls how creative or consistent the AI response is:

```ts
generationConfig: { temperature: 0.3 }
```

- `0.0` — completely deterministic, same response every time
- `0.5` — balanced
- `1.0` — very creative, different response every time

For summarization we use `0.3` — we want consistent, factual summaries not creative ones.

---

### `max_tokens` / `maxOutputTokens`

Limits how long the AI response can be:

```ts
max_tokens: 600
```

One token ≈ 0.75 words. 600 tokens ≈ 450 words. This prevents unexpectedly long responses and controls API costs.

---

### `URLSearchParams`

Safely builds URL query strings:

```ts
const params = new URLSearchParams({
  q: text,
  target: 'fr',
  key: API_KEY,
})

fetch(`${URL}?${params.toString()}`)
// Result: URL?q=Hello+World&target=fr&key=AIza...
```

Never manually concatenate query strings with `+`. Special characters like `&`, `=`, `#`, spaces, and non-ASCII letters break manual concatenation. `URLSearchParams` handles all encoding automatically.

---

### `Animated.Value` sliding from above

In `AISummaryCard`, the animation slides DOWN from above (negative value) instead of up from below:

```ts
const slideAnim = useRef(new Animated.Value(-200)).current
// Starts at -200 (above the screen)
// Animates to 0 (normal position)
```

Negative `translateY` moves up. The card starts above its position and springs down into place.

---

---

## Sprint 7 — AI Summarization

---

## File 1 — `src/services/summarize.service.ts`

### What This File Is

Sends extracted text to the Groq API and returns a 5-bullet-point summary. One function, one responsibility.

### Why Groq Instead of Claude or Gemini

| Service | Issue | Status |
|---|---|---|
| Claude API | No free credits | ❌ |
| Gemini API | Prepaid credits depleted | ❌ |
| Groq API | Completely free, fast | ✅ |

Groq runs Llama 3 (Meta's open-source model) on custom hardware. The quality is excellent and the free tier is generous — no credit card, no expiry.

### The Request Structure

```ts
body: JSON.stringify({
  model: 'llama-3.3-70b-versatile',
  max_tokens: 600,
  messages: [
    {
      role: 'user',
      content: `Summarize in 5 bullet points starting with •\n\n${text}`,
    },
  ],
})
```

The `messages` array is the conversation history. For a single summarization request, it contains one message from the user. The `role: 'user'` tells the AI this is a user message (not a system instruction or previous AI response).

### The Prompt Engineering

```
You are a document assistant. Summarize the following scanned text
in 5 clear bullet points. Be concise. Start each point with •
```

Three specific instructions:

1. Role — "document assistant" improves output quality
2. Format — "5 bullet points" makes the response predictable
3. Symbol — "Start each point with •" ensures consistent formatting the UI can display

### The Response Shape

```ts
data.choices[0].message.content
```

Groq uses the OpenAI-compatible API format. `choices` is an array of possible responses. `[0]` is the first (and only) choice. `message.content` is the text.

### How it connects

```
src/services/summarize.service.ts
  ↓ called by
  src/hooks/useAI.ts
  ↓ calls
  Groq API (llama-3.3-70b-versatile)
```

---

## File 2 — `src/hooks/useAI.ts`

### What This File Is

Manages the AI summarization state. Three states: loading, success, error. The results screen reads from this hook.

### The `AIState` interface

```ts
interface AIState {
  summary: string | null  // null until AI responds
  isLoading: boolean      // true while waiting
  error: string | null    // null unless something failed
}
```

Starting state: everything null/false. After summarize() runs — one of the three fields changes.

### Guard clause — empty text

```ts
if (!text.trim()) {
  setState((prev) => ({ ...prev, error: 'No text to summarize' }))
  return
}
```

If the user taps AI with no text, show an error immediately without making an API call. Never waste an API call on empty input.

### `clearSummary`

Resets everything back to the initial state. Called when the user taps ✕ on the AI card. This hides the card and clears the summary so the next scan starts fresh.

---

## File 3 — `src/components/AISummaryCard.tsx`

### What This File Is

A purple animated card that slides down from above when AI is processing or has a result. Shows a spinner while loading, bullet points when done, error message if failed.

### The `visible` logic

```ts
const visible = isLoading || !!summary || !!error
```

The card is visible if ANY of these is true:

- AI is loading
- There is a summary to show
- There is an error to show

The `!!` converts a value to boolean. `!!null` = false. `!!"text"` = true.

### Three content states

```
isLoading = true   → ActivityIndicator spinner
error exists       → ⚠️ error message
summary exists     → bullet point text
```

Only one renders at a time. The order of the `if` checks matters — loading takes priority over error which takes priority over summary.

### `if (!visible) return null`

When nothing is happening, the component returns `null` — renders nothing. React removes it from the DOM entirely. This is cleaner than hiding with `display: 'none'`.

### The color `'#2D1B4E'`

A very dark purple background — darker than `Theme.aiPurple` (`#8B5CF6`) which is used for the border and text. The contrast between the dark background and bright purple text creates a premium AI feel distinct from the rest of the dark navy UI.

---

## Sprint 8 — Google Translate

---

## File 4 — `src/services/translate.service.ts`

### What This File Is

Sends text to Google Cloud Translation API and returns the translated string. One function, one responsibility.

### Why POST instead of GET

Google Translate v2 accepts both GET and POST. We use POST with JSON body because:

- Long texts exceed URL length limits in GET requests
- POST with JSON is more reliable for special characters
- Consistent with other API calls in the codebase

### The request body

```ts
body: JSON.stringify({
  q: text,           // the text to translate
  target: 'fr',      // BCP-47 language code
  format: 'text',    // 'text' or 'html'
})
```

`format: 'text'` prevents Google from treating the input as HTML. Without this, characters like `<` and `>` in the OCR text could be misinterpreted as HTML tags and corrupted.

### BCP-47 Language Codes

```
'en' → English
'fr' → French
'es' → Spanish
'ar' → Arabic
'zh' → Chinese (Simplified)
'de' → German
'am' → Amharic
```

These are standardized codes used by Google, Apple, and most internationalization systems.

### Response shape

```ts
data.data.translations[0].translatedText
```

Google wraps the response in a `data` object. `translations` is an array (supports batch translation). `[0]` is the first result. `translatedText` is the string.

### Separate API Key

We use `EXPO_PUBLIC_TRANSLATE_KEY` — a separate unrestricted key — instead of the Vision key. The Vision key has API restrictions (Vision only). Using it for Translate would be blocked by those restrictions.

---

## File 5 — `src/hooks/useTranslation.ts`

### What This File Is

Manages translation state. Stores the result, loading state, error, and which language was selected. Exports the `LANGUAGES` array so the results screen can build the language picker.

### The `LANGUAGES` array

```ts
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic' },
  // ...
]
```

Exported as a named export alongside the hook. The results screen maps this array to BottomSheet options. Adding a new language means adding one line here — no other changes needed.

### Why `targetLanguage` is in state

```ts
const [state, setState] = useState<TranslationState>({
  targetLanguage: 'en',
  // ...
})
```

Storing the selected language in state means the UI can show which language was chosen (e.g., "Translated to French"). Without this, the UI would not know which language the current translation is in.

### `clearTranslation`

Resets the translation state. Called when the user taps ✕ on the translation card. Always resets `targetLanguage` to 'en' so the next translation starts from a clean state.

---

## How AI and Translation Connect to results.tsx

```
results.tsx
  ├── useAI()
  │     ↓ summarize(text)
  │     src/services/summarize.service.ts
  │     ↓ fetch Groq API
  │     returns summary string
  │     ↓ displayed in AISummaryCard
  │
  └── useTranslation()
        ↓ translate(text, 'fr')
        src/services/translate.service.ts
        ↓ fetch Google Translate API
        returns translated string
        ↓ displayed in translation card
```

Both hooks follow the same pattern:

- `isLoading` → show spinner
- `result` → show content
- `error` → show error message
- `clear` → hide card

---

## The AI Feature Flow

```
User taps ✨ AI button
        ↓
summarize(getCurrentText()) called
        ↓
useAI sets isLoading = true
AISummaryCard slides down with spinner
        ↓
summarizeText() sends text to Groq API
Groq processes with Llama 3 model
Returns 5 bullet points
        ↓
useAI sets summary = result
AISummaryCard shows bullet points
        ↓
User taps ✕
clearSummary() → card slides back up
```

## The Translation Flow

```
User taps 🌐 button
        ↓
Language picker BottomSheet slides up
User selects "French"
        ↓
translate(text, 'fr') called
        ↓
useTranslation sets isLoading = true
Translation card appears with spinner
        ↓
translateText() sends to Google Translate
Returns French translation
        ↓
useTranslation sets translation = result
Card shows translated text
        ↓
User taps ✕ → clearTranslation()
```

---

## API Comparison — All Services Used

| Service | Used For | Auth Method | Free Tier |
|---|---|---|---|
| Google Cloud Vision | OCR | `?key=` in URL | 1000/month |
| Google Translate | Translation | `?key=` in URL | 500k chars/month |
| Groq (Llama 3) | AI Summary | Bearer token | Generous free tier |
| Firebase Auth | Login | SDK | Free |
| Firebase Firestore | Database | SDK | 50k reads/day |
| Firebase Storage | Images | SDK | 1GB |

---

## Sprint 7 & 8 — Commit Reference

```bash
# Sprint 7
git add src/services/summarize.service.ts
git commit -m "feat(ai): add Groq AI summarization service with Llama 3"

git add src/hooks/useAI.ts
git commit -m "feat(ai): add useAI hook with loading success error states"

git add src/components/AISummaryCard.tsx
git commit -m "feat(components): add animated AISummaryCard with purple theme"

git add app/results.tsx
git commit -m "feat(results): add AI summary button and clean up header layout"

# Sprint 8
git add src/services/translate.service.ts
git commit -m "feat(translate): add Google Translate service"

git add src/hooks/useTranslation.ts
git commit -m "feat(translate): add useTranslation hook with 11 languages"

git add src/components/BottomSheet.tsx
git commit -m "fix(components): add ScrollView to BottomSheet for long lists"

git push origin phase/3-ai-features
```

---

## Q&A Time

Read through this file. Ask anything about AI APIs, the animation system, the translation flow, or anything else. When ready say "done with Q&A" and we merge Phase 3 and tag v0.3.0.
