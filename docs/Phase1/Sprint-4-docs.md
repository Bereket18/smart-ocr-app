# Sprint 4 — Documentation

## Files: ocr.service.ts · useOCR.ts · formatters.ts · TextEditor.tsx · results.tsx

---

## New TypeScript & React Native Terms in This Sprint

---

### `useCallback`

`useCallback` stores a function so it is not recreated on every render.

```ts
// Without useCallback — new function created every render
const processImage = async (uri: string) => { ... }

// With useCallback — same function reused every render
const processImage = useCallback(async (uri: string) => { ... }, [])
```

The `[]` at the end is the dependency array. Empty `[]` means: create this function once and never recreate it.

Why does this matter? If `processImage` is recreated every render, any `useEffect` that depends on it would run again and again — causing an infinite loop.

---

### `useRef`  for storing values

We used `useRef` for the camera component reference. In the results screen we use it differently — to store a value that does NOT cause a re-render when it changes.

```ts
const savedText = useRef('')

// Update it — does NOT re-render the screen
savedText.current = 'new text'

// Read it — always the latest value
console.log(savedText.current)
```

`useState` re-renders the component when it changes. `useRef` does not. We use `useRef` for `savedText` because we only need the value when the user taps Save — we do not need the screen to re-render every keystroke.

---

### Discriminated Union Type

```ts
type Action =
  | { type: 'SET'; payload: string }
  | { type: 'UNDO' }
  | { type: 'RESET' }
```

Three different action shapes identified by their `type` field. TypeScript knows:

- Inside `case 'SET'` → `payload` exists and is a string
- Inside `case 'UNDO'` → no `payload` field
- Inside `case 'RESET'` → no `payload` field

This prevents you from accidentally reading `payload` on an UNDO action.

---

### `ActivityIndicator`

React Native's built-in loading spinner component.

```ts
<ActivityIndicator size="large" color={Theme.accent} />
```

Shows a spinning circle. `size` can be `"small"` or `"large"`. `color` sets the spinner color.

---

### `FormData`

A way to send files and text together in one HTTP request. Used for the OCR API.

```ts
const formData = new FormData()
formData.append('apikey', 'your-key')
formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'scan.jpg' } as any)

fetch(url, { method: 'POST', body: formData })
```

You cannot send a file as plain JSON — `FormData` packages everything together the way the server expects.

---

### `FileReader`

Converts a file or blob into base64 text. Used to encode images for Google Vision API.

```ts
const reader = new FileReader()
reader.onloadend = () => {
  const base64 = reader.result  // "data:image/jpeg;base64,/9j/4AAQ..."
}
reader.readAsDataURL(blob)
```

Google Vision expects the image as a base64 string — not a file path. `FileReader` converts it.

---

### `onTextChange?.(next.current)`

The `?.` on a function call is optional calling. It only calls the function if it exists.

```ts
// Without optional call — crashes if onTextChange is undefined
onTextChange(text)

// With optional call — safe, does nothing if undefined
onTextChange?.(text)
```

This is used because `onTextChange` is an optional prop — the caller might not pass it.

---

---

## File 1 — `src/services/ocr.service.ts`

### What This File Is

The OCR engine. Takes an image URI and returns extracted text. Currently uses Google Cloud Vision with ML Kit ready as an offline fallback.

### Why Google Cloud Vision over OCR.space

| | Google Cloud Vision | OCR.space |
|---|---|---|
| Accuracy | Best in class | Good |
| File size limit | None | 1MB |
| Languages | 100+ | 25+ |
| Tables and forms | Yes | No |
| Cost | 1000/month free | 25,000/month free |

Google Vision uses `DOCUMENT_TEXT_DETECTION` — this is specifically designed for documents, not just simple text. It preserves layout, detects paragraphs, and handles complex documents much better than basic text detection.

### The `imageToBase64` function

Google Vision does not accept file paths. It requires the image as a base64 string — text that represents the binary image data.

```
Original: file:///var/mobile/photo.jpg (a file path)
Base64:   /9j/4AAQSkZJRgABAQAA... (the image encoded as text)
```

The function:

1. `fetch(uri)` — reads the file from the device
2. `.blob()` — converts to a binary blob object
3. `FileReader.readAsDataURL()` — converts blob to base64 string
4. `.split(',')[1]` — removes the `data:image/jpeg;base64,` prefix, keeping only the raw base64

### The fallback architecture

```ts
export async function recognizeText(imageUri: string): Promise<OCRResult> {
  const network = await NetInfo.fetch()
  const isOffline = network.isConnected === false

  if (isOffline) {
    return await recognizeWithMLKit(imageUri)  // offline fallback
  }

  return await recognizeWithGoogleVision(imageUri)  // primary
}
```

`network.isConnected === false` is intentionally strict. If `isConnected` is `null` (unknown) or `true`, we try Google Vision. Only when we are certain there is no connection do we fall back to ML Kit.

### `recognizeWithMLKit` placeholder

```ts
async function recognizeWithMLKit(imageUri: string): Promise<OCRResult> {
  throw new Error('ML_KIT_UNAVAILABLE')
}
```

The function exists and is wired in. When EAS Build is set up and ML Kit is installed as a native module, we replace this one function body — nothing else changes. The architecture is already correct.

### How it connects

```
src/services/ocr.service.ts
  ↓ called by
  src/hooks/useOCR.ts
  ↓ calls
  Google Cloud Vision API (online)
  ML Kit native module (offline — after EAS Build)
  ↓ uses
  @react-native-community/netinfo — to check connectivity
```

---

## File 2 — `src/hooks/useOCR.ts`

### What This File Is

The state machine for OCR. Manages four states: idle, processing, success, error. The results screen reads from this hook to know what to display.

### Why a single state object instead of multiple useState calls

```ts
// Bad — multiple separate state calls
const [status, setStatus] = useState('idle')
const [text, setText] = useState('')
const [error, setError] = useState(null)

// Problem: React might render between these two calls
setStatus('success')
setText(result.text)
// For one frame: status='success' but text='' — inconsistent UI
```

```ts
// Good — single state object
const [state, setState] = useState<OCRState>(initialState)

// One call — all fields update together atomically
setState({ status: 'success', text: result.text, language: result.language, error: null })
// Never an inconsistent state
```

### The four states and what the UI shows

| Status | What the results screen renders |
|---|---|
| `idle` | Nothing — waiting to start |
| `processing` | ActivityIndicator spinner + "Extracting text..." |
| `success` | TextEditor with the extracted text |
| `error` | Error icon + specific message + Try Again button |

### `useCallback` with empty `[]`

```ts
const processImage = useCallback(async (uri: string): Promise<void> => {
  // ...
}, [])
```

The empty `[]` means: create `processImage` once when the hook first runs. Never recreate it. This is critical because `processImage` is used in a `useEffect` dependency in results.tsx. Without `useCallback`, it would be a new function every render — causing infinite re-renders.

### The `reset` function

Resets OCR state back to idle. Used when the results screen opens a saved scan from history — we do not want to show the processing spinner for an already-processed scan.

### How it connects

```
src/hooks/useOCR.ts
  ↓ calls
  src/services/ocr.service.ts — the recognizeText function
  ↓ used by
  app/results.tsx — reads status, text, language, error, processImage
```

---

## File 3 — `src/utils/formatters.ts`

### What This File Is

Pure helper functions. No React, no APIs, no state. Input goes in, output comes out. Used throughout the app for consistent data formatting.

### `formatDate`

```ts
formatDate('2026-03-16T09:41:00.000Z')
// Returns: "Mar 16, 2026"
```

`toLocaleDateString` uses the device's locale settings. The options object controls the format. This is cleaner than manually extracting year/month/day from the ISO string.

### `countWords`

```ts
countWords('Hello   World\nHow are you')
// Returns: 5
```

`split(/\s+/)` splits on any whitespace — spaces, tabs, newlines. `filter(Boolean)` removes empty strings that appear when there are multiple consecutive spaces. `.length` counts the remaining items.

### `truncate`

```ts
truncate('This is a very long text', 10)
// Returns: "This is a..."
```

Used in scan cards to show a preview of the extracted text without overflowing the UI.

### `generateId`

```ts
generateId()
// Returns something like: "1710234567890abc123"
```

Combines `Date.now()` (millisecond timestamp — always unique) with a random string for extra safety. This ensures no two scans ever have the same ID even if created in the same millisecond.

---

## File 4 — `src/components/TextEditor.tsx`

### What This File Is

An editable text area with an undo stack. The user can edit the OCR output, undo mistakes, reset to the original, and copy everything to clipboard.

### Why not `useReducer`

The doc previously mentioned `useReducer`. We implemented a similar pattern with plain `useState` and a `reduce` helper function. The result is identical but easier to understand:

```ts
// The reduce function takes current state and an action, returns new state
function reduce(current, history, action) {
  switch (action.type) {
    case 'SET': ...
    case 'UNDO': ...
    case 'RESET': ...
  }
}

// The dispatch function calls reduce and updates state
function dispatch(action) {
  const next = reduce(current, history, action)
  setCurrent(next.current)
  setHistory(next.history)
}
```

### The undo stack explained

Every time the user types, the CURRENT text is pushed onto the history array BEFORE being replaced:

```
User types "H":
  history: []          → history: [""]
  current: ""          → current: "H"

User types "i":
  history: [""]        → history: ["", "H"]
  current: "H"         → current: "Hi"

User taps Undo:
  history: ["", "H"]   → history: [""]
  current: "Hi"        → current: "H"

User taps Undo again:
  history: [""]        → history: []
  current: "H"         → current: ""
```

`history.slice(0, -1)` removes the last item from the history array. `-1` means "one from the end."

### The copy feedback

```ts
const [copied, setCopied] = useState(false)

async function handleCopy() {
  await Clipboard.setStringAsync(current)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}
```

After copying, `copied` becomes true — the button label changes to "✓ Copied". After 2 seconds, `setTimeout` resets it back to "⎘ Copy". This gives the user clear feedback that the copy succeeded.

### `scrollEnabled={false}` on TextInput

The TextInput is inside a ScrollView in results.tsx. If the TextInput had its own scrolling, there would be two nested scrollers — a terrible UX. `scrollEnabled={false}` disables the TextInput's internal scroll and lets the parent ScrollView handle all scrolling.

### How it connects

```
src/components/TextEditor.tsx
  ↓ receives
  initialText — the OCR extracted text
  onTextChange — called every keystroke, results.tsx stores latest value
  ↓ uses
  expo-clipboard — for copy to clipboard
  src/utils/formatters.ts — for word count display
```

---

## File 5 — `app/results.tsx`

### What This File Is

The results screen. Three possible states: processing (spinner), error (message), success (text editor). Also handles opening saved scans from history.

### Two ways to open this screen

```
Way 1 — From camera (new scan):
router.push({ pathname: '/results', params: { imageUri: 'file://...' } })
→ imageUri param exists → OCR runs automatically

Way 2 — From history (existing scan):
setActiveScan(scan)
router.push('/results')
→ no imageUri → activeScan from store is used → no OCR
```

The `useEffect` handles both cases:

```ts
useEffect(() => {
  if (imageUri) {
    processImage(imageUri)   // new scan — run OCR
  } else if (activeScan) {
    reset()                  // existing scan — just show it
  }
}, [imageUri])
```

### `savedText` with `useRef`

```ts
const savedText = useRef('')

// In TextEditor:
onTextChange={(t) => { savedText.current = t }}
```

Every keystroke in the TextEditor updates `savedText.current`. When Save is tapped, we use `savedText.current` — which always holds the latest edited text. We use `useRef` not `useState` because we do not need the screen to re-render on every keystroke — we only need the value at save time.

### The `handleSave` function

```ts
const newScan = {
  id: generateId(),
  imageUri: imageUri ?? activeScan?.imageUri ?? '',
  extractedText: text || activeScan?.extractedText || '',
  editedText: savedText.current || text,
  // ...
}
addScan(newScan)
```

`??` and `||` handle both ways the screen can be opened. If `imageUri` exists (new scan), use it. If not, fall back to `activeScan?.imageUri`. This one function works correctly for both new scans and re-saves of existing scans.

### The three `renderContent` states

```
status === 'processing'
  → ActivityIndicator + "Extracting text..."

status === 'error'
  → Error icon + specific message based on error code
  → "NO_TEXT_DETECTED" → "Try a clearer photo"
  → "NO_INTERNET_CONNECTION" → "Connect to internet"
  → anything else → "Please try again"

status === 'success' OR activeScan exists
  → TextEditor with the text
```

### `keyboardShouldPersistTaps="handled"`

When the keyboard is open and the user taps outside the TextInput, this prop prevents the tap from being swallowed by the keyboard dismissal. Without it, the user would have to tap Save twice — once to dismiss the keyboard, once to actually save.

### How it connects

```
app/results.tsx
  ↓ reads params from
  expo-router (useLocalSearchParams) — imageUri
  ↓ reads from store
  useScanStore() — activeScan
  ↓ calls hook
  useOCR() — processImage, status, text, language, error, reset
  ↓ calls store action
  useScanStore() — addScan
  ↓ renders component
  src/components/TextEditor.tsx
  ↓ uses utils
  src/utils/formatters.ts — generateId, formatDate
```

---

## The Complete Sprint 4 Flow

```
Camera captures photo → photo.uri passed to results screen
        ↓
results.tsx mounts
  → useEffect sees imageUri → calls processImage(imageUri)
        ↓
useOCR.ts sets status = 'processing'
  → results screen shows spinner
        ↓
processImage calls recognizeText(imageUri) in ocr.service.ts
        ↓
ocr.service.ts checks internet connection
  → online: sends image to Google Vision API
  → offline: tries ML Kit (currently unavailable — shows error)
        ↓
Google Vision returns extracted text and language
        ↓
useOCR.ts sets status = 'success', text, language
  → results screen re-renders
        ↓
TextEditor renders with the extracted text
  → user reads, edits, copies
        ↓
User taps Save
  → handleSave creates Scan object
  → addScan adds it to Zustand store
  → Alert confirms → navigates to History
        ↓
History screen reads from store
  → new scan appears at the top of the list
```

---

## OCR API Comparison — Final Decision

| | Google Cloud Vision | ML Kit | OCR.space |
|---|---|---|---|
| **Our choice** | ✅ Primary | ✅ Offline fallback | ❌ Removed |
| **Works now** | ✅ Yes | ⏳ After EAS Build | ✅ But unreliable |
| **Accuracy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cost** | 1000 free/month | Free forever | 25,000 free/month |
| **File limits** | None | None | 1MB |

---

## Sprint 4 — Commit Reference

```bash
git add src/services/ocr.service.ts
git commit -m "feat(ocr): add Google Vision OCR service with ML Kit offline fallback"

git add src/hooks/useOCR.ts
git commit -m "feat(ocr): add useOCR hook with processing success error states"

git add src/utils/formatters.ts
git commit -m "feat(utils): add formatDate countWords truncate generateId helpers"

git add src/components/TextEditor.tsx
git commit -m "feat(editor): add TextEditor with undo stack and copy to clipboard"

git add app/results.tsx
git commit -m "feat(results): add results screen with OCR states and save to history"

git add src/hooks/useImagePicker.ts
git commit -m "fix(camera): improve compression to stay under API file size limit"

git push origin phase/1-core-ocr
```

---

## Q&A Time

Read through this file. Then ask anything — about the OCR pipeline, the undo stack, useRef vs useState, the fallback architecture, or anything else before we move to Sprint 5.
