# Q&A — Dependencies, Architecture & Folder Structure

---

## Part 1 — Every Dependency Explained

---

### What is a dependency?

A dependency is a library someone else built that you install and use in your project. Instead of building everything from scratch, you install tools that already solve specific problems.

When you ran `npm install zustand` — you downloaded Zustand's code into your `node_modules` folder. Your app can now use it.

---

### 1. Expo + React Native

**What it is:**
React Native lets you write JavaScript/TypeScript and it turns into a real iOS and Android app. Expo is a layer on top of React Native that removes all the complicated setup.

**Without Expo you would need:**
- Xcode installed on a Mac
- Android Studio
- Complex build configuration files
- Native code knowledge (Swift, Kotlin)

**With Expo you just need:**
- Node.js
- The Expo Go app on your iPhone
- Run `npx expo start` — done

**Simple example:**
```js
// This TypeScript/JavaScript code...
import { View, Text } from 'react-native'

export default function App() {
  return (
    <View>
      <Text>Hello World</Text>
    </View>
  )
}

// ...becomes a real native iOS app on your iPhone
// You never wrote Swift. You never opened Xcode.
```

**Why Expo specifically?**
Expo Go lets you scan a QR code and instantly see your app on your iPhone. No building, no compiling, no waiting 10 minutes. You save a file and the app updates in seconds.

---

### 2. Zustand

**What it is:**
A tool for managing shared data across your entire app.

**The problem it solves:**

Imagine you scan a document on the Camera screen. The text gets extracted. Now you navigate to the History screen. In React, when you leave a screen, all its local data is destroyed. The extracted text is gone.

You need somewhere to store data that survives navigation. That place is Zustand.

**The analogy:**
Think of your app like a house with multiple rooms (screens). Each room has its own notepad (`useState`). When you leave a room, the notepad is thrown away.

Zustand is a whiteboard mounted in the hallway. Every room can read it and write to it. You leave a room — the whiteboard is still there. You come back — the data is still there.

**Simple example:**

```ts
// Without Zustand — data dies when you navigate away
function CameraScreen() {
  const [text, setText] = useState('')  // Dies when you leave this screen
}

// With Zustand — data lives for the whole app session
const useStore = create((set) => ({
  text: '',
  setText: (value) => set({ text: value })
}))

// Any screen can read it
function HistoryScreen() {
  const { text } = useStore()  // Still there even after leaving Camera
}
```

**Why Zustand and not Redux?**

Redux is the most famous state management tool. But it requires:
- Actions
- Reducers
- Dispatchers
- A Provider wrapping your whole app
- 50+ lines of setup for simple things

Zustand requires:
- One `create()` call
- Done

Same result. A fraction of the complexity. Perfect for a beginner.

---

### 3. Expo Router

**What it is:**
The navigation system. It controls which screen you see and how you move between screens.

**How it works:**
Every file you create inside the `app/` folder automatically becomes a screen. The file name is the route.

```
app/index.tsx        →  / (Home screen)
app/camera.tsx       →  /camera
app/results.tsx      →  /results
app/(tabs)/history.tsx  →  /history
```

No setup. No registration. Just create the file and the route exists.

**Simple example:**
```ts
// To navigate to the camera screen from anywhere:
import { router } from 'expo-router'

router.push('/camera')

// To go back:
router.back()

// To pass data to another screen:
router.push({ pathname: '/results', params: { imageUri: 'file://...' } })
```

**Why file-based routing?**
It is the same system that web frameworks like Next.js use. If you have ever built a web app, this feels immediately familiar. One file = one screen. Simple.

---

### 4. Google ML Kit (`@react-native-ml-kit/text-recognition`)

**What it is:**
Google's on-device AI that reads text from images. This is the core OCR engine.

**The key word: on-device**
The AI model runs entirely on the phone. No internet required. No API key. No cost per scan. The model is bundled into your app when you build it.

**Simple example:**
```ts
import TextRecognition from '@react-native-ml-kit/text-recognition'

// Give it an image path — get back the text
const result = await TextRecognition.recognize('file:///path/to/photo.jpg')

console.log(result.blocks[0].text)  // "Hello World"
```

**Why ML Kit and not a cloud OCR API?**

| ML Kit (on-device) | Cloud OCR (e.g. Google Vision API) |
|---|---|
| Free forever | Pay per scan |
| Works offline | Requires internet |
| Fast (0.5–3 seconds) | Slower (network round-trip) |
| Private (image never leaves phone) | Image sent to Google servers |

ML Kit wins on every dimension for this use case.

---

### 5. Firebase (Firestore + Storage + Auth)

Three separate Firebase services that work together:

**Firebase Auth — who is the user?**
```ts
// Creates an anonymous account — no email, no password
// Just gives each device installation a unique ID
await signInAnonymously(auth)
const userId = auth.currentUser.uid  // "abc123xyz"
```

Anonymous auth means users can use the app immediately without signing up. Every installation gets a unique ID used to separate their data.

**Firebase Firestore — where the scan data lives**
```ts
// Save a scan document
await addDoc(collection(db, 'users', userId, 'scans'), {
  extractedText: 'Hello World',
  language: 'en',
  createdAt: serverTimestamp()
})

// Read all scans
const snapshot = await getDocs(collection(db, 'users', userId, 'scans'))
```

Firestore is a database in the cloud. Data is organized in collections and documents — like folders and files.

**Firebase Storage — where the images live**
```ts
// Upload an image file
const storageRef = ref(storage, `users/${userId}/scans/${Date.now()}.jpg`)
await uploadBytes(storageRef, imageBlob)

// Get a URL to display the image
const url = await getDownloadURL(storageRef)
```

Storage is a file system in the cloud. You upload the image file, you get back a URL you can use anywhere.

**Why Firebase?**
No backend to build. No server to manage. No DevOps. You write JavaScript, Firebase handles everything else. Free tier covers thousands of users.

---

### 6. Claude API (Anthropic)

**What it is:**
The AI that generates summaries of scanned documents.

**How it works:**
One `fetch()` call. You send the extracted text. Claude sends back a bullet-point summary.

```ts
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Summarize this in 5 bullet points:\n\n${scannedText}`
    }]
  })
})

const data = await response.json()
const summary = data.content[0].text  // The bullet-point summary
```

No SDK needed. No complex setup. Just a regular HTTP request that any JavaScript developer already knows how to make.

---

### 7. Google Translate API

**What it is:**
Translates the extracted text into any language.

```ts
// Translate English text to French
const params = new URLSearchParams({
  q: 'Hello World',
  target: 'fr',
  key: API_KEY
})

const response = await fetch(`https://translation.googleapis.com/language/translate/v2?${params}`)
const data = await response.json()

console.log(data.data.translations[0].translatedText)  // "Bonjour le monde"
```

One GET request. Returns the translated string. Done.

---

### 8. expo-camera

**What it is:**
Gives your app access to the iPhone camera.

```ts
import { CameraView } from 'expo-camera'

// Shows a live camera preview
<CameraView ref={cameraRef} style={{ flex: 1 }} />

// Takes a photo
const photo = await cameraRef.current.takePictureAsync()
console.log(photo.uri)  // "file:///var/mobile/..."
```

Expo handles all the iOS permission dialogs automatically.

---

### 9. expo-image-picker

**What it is:**
Opens the iPhone photo gallery so the user can pick an existing image.

```ts
import * as ImagePicker from 'expo-image-picker'

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: 'Images',
  quality: 1
})

if (!result.canceled) {
  console.log(result.assets[0].uri)  // Path to the selected image
}
```

---

### 10. expo-image-manipulator

**What it is:**
Resizes and compresses images before OCR.

A photo from an iPhone camera can be 5–8MB. That is too large for ML Kit to process quickly. We compress it to ~300KB first.

```ts
import * as ImageManipulator from 'expo-image-manipulator'

const compressed = await ImageManipulator.manipulateAsync(
  originalUri,
  [{ resize: { width: 1920 } }],  // Max 1920px wide
  { compress: 0.85, format: 'jpeg' }  // 85% quality JPEG
)

console.log(compressed.uri)  // Path to the smaller image
```

---

### 11. expo-clipboard

**What it is:**
Lets the app copy text to the iPhone clipboard.

```ts
import * as Clipboard from 'expo-clipboard'

await Clipboard.setStringAsync('Hello World')
// User can now paste "Hello World" anywhere on their phone
```

---

### 12. expo-file-system

**What it is:**
Lets the app read and write files on the device.

Used for creating TXT and PDF export files.

```ts
import * as FileSystem from 'expo-file-system'

// Write a text file
const path = FileSystem.documentDirectory + 'scan.txt'
await FileSystem.writeAsStringAsync(path, 'Hello World', {
  encoding: FileSystem.EncodingType.UTF8
})
```

`documentDirectory` is a private folder that belongs to your app. Files here survive app restarts but are deleted when the app is uninstalled.

---

### 13. expo-sharing

**What it is:**
Opens the iOS share sheet — the panel with apps like Mail, WhatsApp, AirDrop, etc.

```ts
import * as Sharing from 'expo-sharing'

// Share a file — iOS shows the share sheet
await Sharing.shareAsync(filePath, {
  mimeType: 'text/plain'
})
```

---

### 14. expo-print

**What it is:**
Converts HTML to a PDF file.

```ts
import * as Print from 'expo-print'

const html = `<html><body><h1>Scan</h1><p>${text}</p></body></html>`
const { uri } = await Print.printToFileAsync({ html })
// uri is the path to the generated PDF
```

---

### 15. expo-sqlite

**What it is:**
A local SQL database that lives on the device. Used in Phase 4 for offline mode.

```ts
import * as SQLite from 'expo-sqlite'

const db = await SQLite.openDatabaseAsync('smartocr.db')

// Create a table
await db.execAsync('CREATE TABLE IF NOT EXISTS scans (id TEXT, data TEXT, synced INTEGER)')

// Insert a row
await db.runAsync('INSERT INTO scans VALUES (?, ?, ?)', ['id1', JSON.stringify(scan), 0])

// Read rows
const rows = await db.getAllAsync('SELECT * FROM scans WHERE synced = 0')
```

This is a real SQL database running on the phone. It persists between app sessions and survives phone restarts.

---

### 16. TypeScript + @types packages

**What they are:**
TypeScript is the language. The `@types` packages add TypeScript type definitions to libraries that were originally written in plain JavaScript.

```
typescript             — the TypeScript compiler itself
@types/react           — tells TypeScript what React functions look like
@types/react-native    — tells TypeScript what React Native components look like
```

Without `@types/react-native`, TypeScript would not know what `<View>` or `<Text>` are.

---

---

## Part 2 — Folder & File Structure (Architectural View)

---

### The 5 Layers

The project is organized into 5 layers. Each layer has exactly one job. A layer can use the layer below it but never the one above it.

```
┌─────────────────────────────────────────┐
│  UI LAYER                               │
│  app/ screens + src/components/         │
│  Shows data. Handles taps. Renders UI.  │
├─────────────────────────────────────────┤
│  LOGIC LAYER                            │
│  src/hooks/                             │
│  Coordinates work. Manages state.       │
├─────────────────────────────────────────┤
│  SERVICE LAYER                          │
│  src/services/                          │
│  Talks to external APIs.               │
├─────────────────────────────────────────┤
│  STATE LAYER                            │
│  src/store/                             │
│  Global shared data.                    │
├─────────────────────────────────────────┤
│  FOUNDATION LAYER                       │
│  src/types/ + src/constants/            │
│  Types and design tokens.               │
└─────────────────────────────────────────┘
```

**The rule:** A screen calls a hook. A hook calls a service. A service calls an API. Data comes back the same way. A screen never calls an API directly.

---

### Why This Separation Matters

Imagine ML Kit breaks and you want to swap it for a different OCR engine. With this structure:

- You change ONE file: `src/services/ocr.service.ts`
- Every hook, screen, and component that uses OCR — unchanged
- The app keeps working

Without this structure, OCR calls are scattered across 5 different screens. You have to find and change all of them. You will miss one. It will break.

---

### Every Folder and File

---

#### `app/` — The UI Layer (Screens)

These are the actual screens the user sees. Expo Router reads this folder and automatically creates routes.

```
app/
├── _layout.tsx
├── camera.tsx
├── results.tsx
└── (tabs)/
    ├── _layout.tsx
    ├── index.tsx
    ├── history.tsx
    └── settings.tsx
```

| File | What It Does |
|---|---|
| `_layout.tsx` | The root wrapper. Sets up the navigation stack. Dark header. Wraps every screen. |
| `(tabs)/_layout.tsx` | Configures the bottom tab bar. Three tabs, icons, colors. |
| `(tabs)/index.tsx` | Home screen. Scan Now button. Recent scans strip. |
| `(tabs)/history.tsx` | List of all saved scans. Swipe to delete. Pull to refresh. |
| `(tabs)/settings.tsx` | App settings. Theme, language, export format, clear history. |
| `camera.tsx` | Full-screen camera. No tab bar. Corner guides. Shutter button. |
| `results.tsx` | Shows OCR output. Three states: loading, error, success. |

**Why `(tabs)/` with parentheses?**
Parentheses in Expo Router create a group. The folder name is not included in the URL. Without parentheses, the home screen would be at `/tabs/index`. With parentheses, it is at `/` — cleaner.

---

#### `src/components/` — Reusable UI Pieces

These are building blocks. Each component does one visual thing. Screens are assembled from components.

```
src/components/
├── PrimaryButton.tsx
├── OutlineButton.tsx
├── ScanCard.tsx
├── LanguageBadge.tsx
├── EmptyState.tsx
├── TextEditor.tsx
├── AISummaryCard.tsx
├── BottomSheet.tsx
└── ProgressBar.tsx
```

| File | What It Does |
|---|---|
| `PrimaryButton.tsx` | The big cyan button. Used for Scan Now and Save. Has a loading spinner state. |
| `OutlineButton.tsx` | A bordered button with transparent background. Used for Gallery and Multi-page. |
| `ScanCard.tsx` | One item in the history list. Shows thumbnail, language badge, preview text, date. |
| `LanguageBadge.tsx` | The small chip showing "EN" or "FR". Color-coded by language. |
| `EmptyState.tsx` | The illustration + text shown when there are no scans yet. |
| `TextEditor.tsx` | The editable text area on the results screen. Has undo, redo, reset. |
| `AISummaryCard.tsx` | The purple card that slides in with the AI summary. |
| `BottomSheet.tsx` | The panel that slides up from the bottom with export options. |
| `ProgressBar.tsx` | Animated horizontal bar for upload and OCR progress. |

**The rule for components:** A component receives data via props and displays it. It never calls Firebase. It never calls the Claude API. It calls a hook if it needs to trigger logic.

---

#### `src/hooks/` — The Logic Layer

Hooks are where the real work happens. A hook connects the UI to the services.

```
src/hooks/
├── useImagePicker.ts
├── useOCR.ts
├── useFirebase.ts
├── useExport.ts
├── useAI.ts
├── useTranslation.ts
└── useOfflineSync.ts
```

| File | What It Does |
|---|---|
| `useImagePicker.ts` | Handles camera permission, opens camera, opens gallery, compresses the image. |
| `useOCR.ts` | Manages the OCR state machine. Calls `ocr.service.ts`. Returns status, text, language, error. |
| `useFirebase.ts` | Save scan to Firestore, upload image to Storage, fetch history, delete scan. |
| `useExport.ts` | Creates TXT file, creates PDF, opens share sheet. |
| `useAI.ts` | Calls Claude API. Returns loading/summary/error state. |
| `useTranslation.ts` | Calls Google Translate. Returns loading/result/error state. |
| `useOfflineSync.ts` | Writes to SQLite first. Watches network. Syncs to Firebase when online. |

**What is a hook?**
A hook is a function that starts with `use`. It can use React features like `useState` and `useEffect`. You call it inside a component and it gives you data and actions.

```ts
// Inside a screen component:
const { pickFromCamera, isLoading, error } = useImagePicker()

// Now you have:
// pickFromCamera() — call this when user taps Scan Now
// isLoading — true while camera is opening
// error — any error message
```

The screen does not know HOW the camera works. It just calls `pickFromCamera()` and gets back an image URI.

---

#### `src/services/` — The Service Layer

Services talk to external systems. No React. No state. Just input → output.

```
src/services/
├── ocr.service.ts
├── summarize.service.ts
├── translate.service.ts
└── firebase.service.ts
```

| File | What It Does |
|---|---|
| `ocr.service.ts` | Wraps ML Kit. Takes an image URI. Returns extracted text and language. |
| `summarize.service.ts` | Wraps Claude API. Takes extracted text. Returns a summary string. |
| `translate.service.ts` | Wraps Google Translate. Takes text and target language. Returns translated text. |
| `firebase.service.ts` | Initializes Firebase. Exports the `db`, `storage`, and `auth` objects used everywhere. |

**Why separate services from hooks?**

```
Without services — the hook does everything:
useOCR.ts → contains the ML Kit code directly
useOCR.ts → contains Firebase code directly
useOCR.ts → becomes 200 lines long and does 5 different jobs

With services — each file has one job:
useOCR.ts → calls ocr.service.ts → 50 lines, easy to read
ocr.service.ts → just the ML Kit code → 30 lines, easy to test
```

If Google changes the Translate API, you update `translate.service.ts`. Every hook and screen that uses translation — unchanged.

---

#### `src/store/` — The State Layer

```
src/store/
└── scanStore.ts
```

One file. The global whiteboard. All scan data and all actions to update it. Any screen can read from it. Changes automatically trigger re-renders in every screen that uses the data.

---

#### `src/types/` — The Foundation

```
src/types/
└── index.ts
```

All TypeScript interfaces. The contract every file agrees to. Change a type here and TypeScript shows you every file that needs updating.

---

#### `src/constants/` — Design Tokens

```
src/constants/
├── colors.ts
└── typography.ts
```

No logic. Just values. Colors, font sizes, spacing, border radius. Every component reads from here. Change a value once — the whole app updates.

---

#### `src/utils/` — Helper Functions

```
src/utils/
├── formatters.ts
└── imageUtils.ts
```

| File | What It Does |
|---|---|
| `formatters.ts` | `formatDate()`, `countWords()`, `truncate()`, `generateId()` |
| `imageUtils.ts` | `compressImage()`, `getImageDimensions()` |

Pure functions with no side effects. No React. No APIs. Input goes in. Output comes out.

---

#### Root Files

| File | What It Does |
|---|---|
| `.env` | API keys. Never committed. Never opened in public. |
| `.gitignore` | Tells Git which files to ignore. .env is in here. |
| `tsconfig.json` | TypeScript configuration. Enables strict checking and @/ alias. |
| `CLAUDE.md` | Context document for Claude Code sessions. Explains the project. |
| `app.json` | Expo configuration. App name, permissions, icons, splash screen. |
| `package.json` | Lists all dependencies. Created automatically by npm. |

---

### The Data Flow — How Everything Connects

Here is the complete flow when a user scans a document:

```
User taps "Scan Now" on Home screen (app/(tabs)/index.tsx)
        ↓
Router navigates to /camera (app/camera.tsx)
        ↓
useImagePicker hook (src/hooks/useImagePicker.ts)
  → requests camera permission
  → opens camera
  → user takes photo
  → compresses image via imageUtils.ts
  → returns imageUri
        ↓
Router navigates to /results?imageUri=... (app/results.tsx)
        ↓
useOCR hook (src/hooks/useOCR.ts)
  → calls ocr.service.ts with imageUri
  → ocr.service.ts calls ML Kit
  → ML Kit returns text blocks
  → text assembled into one string
  → language detected
  → returns { status: 'success', text, language }
        ↓
Results screen renders TextEditor component
  → TextEditor shows extracted text
  → user can edit, copy, save
        ↓
User taps Save
        ↓
useFirebase hook (src/hooks/useFirebase.ts)
  → calls firebase.service.ts
  → uploads image to Firebase Storage
  → saves scan document to Firestore
  → calls scanStore.addScan() to update global state
        ↓
History screen (app/(tabs)/history.tsx)
  → reads scans from useScanStore()
  → automatically shows the new scan
  → no refresh needed
```

---

## Summary Table — Which File Does What

| I need to... | Go to this file |
|---|---|
| Add a new screen | Create a file in `app/` |
| Change a button style | `src/components/PrimaryButton.tsx` |
| Change a color | `src/constants/colors.ts` |
| Add a new data field to a scan | `src/types/index.ts` |
| Fix an OCR bug | `src/services/ocr.service.ts` |
| Change how state is managed | `src/store/scanStore.ts` |
| Fix a Firebase save issue | `src/hooks/useFirebase.ts` |
| Change how translation works | `src/services/translate.service.ts` |
| Add a new reusable component | `src/components/` |
| Format a date differently | `src/utils/formatters.ts` |

---

Ask your next question whenever you are ready.
