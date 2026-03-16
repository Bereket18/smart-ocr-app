# Sprint 1 — Documentation
## Files: types/index.ts · colors.ts · typography.ts · scanStore.ts
---

## Before We Start — TypeScript Terms You Will See Everywhere

These are the things in the code that do not look like JavaScript. Read this section first before reading the file explanations.

---

### `interface`

In JavaScript you can create any object with any shape:

```js
// JavaScript — no rules, anything goes
const scan = {
  id: "123",
  text: "hello",
  anything: true
}
```

In TypeScript, an `interface` is a contract. It says: any object that claims to be this type **must** have exactly these fields with exactly these types.

```ts
interface Scan {
  id: string
  text: string
}

// ✅ This is fine
const scan: Scan = { id: "123", text: "hello" }

// ❌ TypeScript error — missing "text"
const scan: Scan = { id: "123" }

// ❌ TypeScript error — id must be a string, not a number
const scan: Scan = { id: 123, text: "hello" }
```

Think of it like a form with required fields. Every field must be filled in with the right type of value.

---

### `type`

`type` is similar to `interface` but used for simpler things — especially when you want to say "this value can only be one of these specific options."

```ts
type OCRStatus = 'idle' | 'processing' | 'success' | 'error'
```

The `|` means OR. So `OCRStatus` can only ever be one of those four exact strings. If you type `'loading'` by mistake, TypeScript will catch it immediately.

In JavaScript, you could accidentally write `status = "laoding"` (typo) and the app would silently break. TypeScript catches it before the app runs.

---

### `export`

Same as JavaScript. `export` makes something available to other files via `import`.

```ts
// In types/index.ts
export interface Scan { ... }

// In scanStore.ts
import { Scan } from '@/types'
```

---

### `string | null`

The `|` means OR. `string | null` means this value is either a string OR null (nothing).

```ts
summary: string | null
```

This is how you say: "this field starts as nothing, but will eventually have a value." You see this on `summary`, `translation`, and `folderId` — they are empty until Phase 3 or 5 fills them in.

---

### `as const`

This locks the values so TypeScript treats them as exact values, not general types.

```ts
// Without as const — TypeScript sees: accent is "some string"
const Colors = { dark: { accent: '#06B6D4' } }

// With as const — TypeScript sees: accent is exactly '#06B6D4'
const Colors = { dark: { accent: '#06B6D4' } } as const
```

Why does this matter? Some React Native style properties only accept specific values. `as const` tells TypeScript the exact value, so it can confirm it is valid.

---

### `string[]`

An array of strings. The `[]` after a type means "array of".

```ts
tags: string[]   // An array of strings: ["receipt", "work", "urgent"]
pages: PageScan[] // An array of PageScan objects
```

---

### `(value: boolean) => void`

This is a function type. It describes what a function looks like — what it receives and what it returns.

- `value: boolean` — the function takes one argument, a boolean
- `=> void` — the function returns nothing (`void` = no return value)

```ts
setProcessing: (value: boolean) => void
```

This says: `setProcessing` is a function that takes a boolean and returns nothing.

---

### `create<ScanStore>(...)`

The `<ScanStore>` part is called a **generic**. It passes a type as a parameter.

Think of it like this: `create()` is a machine that builds stores. You tell the machine what shape the store should have by passing the type inside `< >`.

Without `<ScanStore>`, Zustand does not know what your store contains. With it, TypeScript can check that everything you build matches the plan.

---

### `@/types`

This is a path alias. Instead of writing `../../types/index`, you write `@/types`.

The `@/` maps to the `src/` folder. Configured in `tsconfig.json`.

```ts
// Without alias — ugly and fragile
import { Scan } from '../../types/index'

// With alias — clean and always works
import { Scan } from '@/types'
```

---

---

## File 1 — `src/types/index.ts`

### What This File Is

This is the single source of truth for all data shapes in the app. Every other file imports from here. Nothing defines its own types — they all come from this one file.

### Why It Exists

Imagine 8 different files all describing what a Scan looks like. You add a new field. You have to update 8 files. Miss one and the app breaks in a way that is hard to find.

With one central types file, you change it in one place. TypeScript immediately shows you every file that needs updating.

### What Each Interface Does

**`Scan`**

The main object. One Scan = one document the user scanned. Every field has a purpose:

| Field | What It Holds | When It Gets a Value |

|---|---|---|

| `id` | Unique identifier | When scan is created — `Date.now().toString()` |
| `imageUri` | Local file path on the device | After taking a photo |
| `imageUrl` | Firebase download URL | Phase 2 — after upload |
| `extractedText` | Raw ML Kit output | After OCR runs — never changed |
| `editedText` | The user's editable copy | Starts as copy of extractedText |
| `language` | Language code like "en" or "fr" | After OCR runs |
| `summary` | AI-generated summary | Phase 3 — starts as null |
| `translation` | Translated text | Phase 3 — starts as null |
| `createdAt` | ISO date string | When scan is created |
| `pageCount` | Number of pages | 1 unless multi-page (Phase 4) |
| `tags` | Array of label strings | Phase 5 — starts as empty array |
| `folderId` | Which folder it belongs to | Phase 5 — starts as null |
| `synced` | Has it been saved to Firebase | false until Phase 2 saves it |

Notice `extractedText` and `editedText` are two separate fields. This is intentional. ML Kit fills `extractedText` once and it never changes. The user edits `editedText`. This means the app can always offer "Reset to Original" — just copy `extractedText` back into `editedText`.

**`OCRStatus`**

Four allowed values that describe what the OCR process is doing right now. The results screen reads this to decide what to show:

- `idle` → show nothing, waiting to start
- `processing` → show spinner
- `success` → show the text editor
- `error` → show error message

**`OCRResult`**

What the OCR service hands back after processing an image. Just two fields: the text and the detected language.

**`OCRState`**

The full state object inside the `useOCR` hook. Combines the status, the result text, and any error into one object.

**`ScanStore`**

The blueprint of the entire Zustand store. Lists every field and every action. When you write `create<ScanStore>(...)`, Zustand uses this to verify your store matches the plan.

### How It Connects to Other Files

```
src/types/index.ts
       ↓ imported by
src/store/scanStore.ts     — uses Scan, ScanStore, MultiPageSession
src/hooks/useOCR.ts        — uses OCRStatus, OCRResult, OCRState
src/hooks/useFirebase.ts   — uses Scan
src/components/ScanCard.tsx — uses Scan
app/results.tsx            — uses OCRState
```

---

## File 2 — `src/constants/colors.ts`

### What This File Is

Every color in the app comes from this file. No screen or component ever hardcodes a hex value like `#06B6D4`. They all import from `Colors` or `Theme`.

### Why It Exists

If you hardcode colors in 20 different files and decide to change the accent color, you have to find and edit all 20 files. With this file, you change one line and every screen updates.

### The Structure

```ts
Colors.dark  — the dark theme palette (what we build with in Phases 1–3)
Colors.light — the light theme palette (added fully in Phase 4)
Theme        — currently points to Colors.dark
```

Components import `Theme` rather than `Colors.dark` directly. When Phase 4 adds theme switching, only this file changes — all components inherit the switch automatically.

### The Color Tokens

| Token | Color | Used For |

|---|---|---|
| `background` | Very dark navy | The app background behind everything |
| `surface` | Slightly lighter navy | Cards, inputs, bottom sheets |
| `border` | Subtle grey-blue | Card outlines, dividers |
| `accent` | Cyan | Buttons, active tabs, highlights |
| `aiPurple` | Purple | Everything AI-related |
| `success` | Green | Save confirmation, sync status |
| `warning` | Amber | Low quality image warnings |
| `error` | Red | Delete confirmation, no text found |
| `textPrimary` | Near white | Headlines, main text |
| `textSecondary` | Muted grey | Timestamps, captions, hints |

### `as const` Here

Without `as const`, TypeScript sees `accent` as type `string` — just some string. With `as const`, TypeScript sees the exact value `'#06B6D4'`. This matters for StyleSheet validation.

---

## File 3 — `src/constants/typography.ts`

### What This File Is

All font sizes, font weights, spacing values, and border radius values in one place. Every screen uses these tokens instead of hardcoding numbers.

### Why It Exists

Same reason as colors — change one number here and it updates everywhere. Also makes the design consistent. Every heading is always 24sp. Every card always has 12dp radius. No guessing.

### The Tokens

**FontSize** — from largest to smallest, each with a specific purpose:

| Token | Size | Used For |
|---|---|---|
| `display` | 32sp | App name on splash, empty state titles |
| `h1` | 24sp | Screen titles |
| `h2` | 18sp | Section headers |
| `bodyLarge` | 16sp | Extracted text, main content |
| `body` | 14sp | Card text, list items |
| `caption` | 12sp | Timestamps, word count |
| `badge` | 11sp | Language badge, status chips |

**Spacing** — based on a 4-point grid. Every value is a multiple of 4:

| Token | Value | Used For |
|---|---|---|
| `xs` | 4 | Tiny gaps between related items |
| `sm` | 8 | Icon padding, chip padding |
| `md` | 12 | Input padding |
| `lg` | 16 | Card padding, screen margins |
| `xl` | 20 | Between major sections |
| `xl2` | 24 | Modal header padding |
| `xl3` | 32 | Screen top padding |
| `xl4` | 48 | Empty state spacing |

**Radius** — how rounded the corners are:

| Token | Value | Used For |
|---|---|---|
| `card` | 12 | All card components |
| `button` | 8 | All buttons |
| `input` | 8 | All text inputs |
| `badge` | 999 | Language badge — fully round pill shape |

---

## File 4 — `src/store/scanStore.ts`

### What This File Is

The global state of the app. Any screen can read from it and write to it. When state changes, every screen that reads from it automatically updates.

### Why Zustand Instead of useState

`useState` is destroyed when you navigate away from a screen. If you put `scans` in `useState` inside the History screen, they disappear the moment you navigate to Camera. 

The Zustand store lives for the entire app session. Navigate anywhere, the data is still there.

### The Mental Model

Imagine a whiteboard in the hallway between all your rooms (screens). Every room can read the whiteboard and write to it. That is the store. `useState` is a notepad inside one room — only that room can see it, and it gets thrown away when you leave.

### What `create<ScanStore>(...)` Does

`create` is the Zustand function that builds the store. The `<ScanStore>` tells TypeScript what shape the store must have — it checks against the `ScanStore` interface from `types/index.ts`.

`(set, get) =>` — Zustand gives you two tools:

- `set` — updates state
- `get` — reads current state from inside an action

### How Each Action Works

**`addScan`**

```ts
addScan: (scan) =>
  set((state) => ({ scans: [scan, ...state.scans] }))
```

The new scan goes at the front of the array (`[scan, ...state.scans]`). This means newest scans appear at the top of the history list. `...state.scans` spreads all existing scans after it.

Important: we never do `state.scans.push(scan)`. That mutates the existing array. React cannot detect that change. We always create a new array.

**`deleteScan`**

```ts
deleteScan: (id) =>
  set((state) => ({ scans: state.scans.filter((s) => s.id !== id) }))
```

`filter` creates a new array containing every scan EXCEPT the one with the matching id. The deleted scan is simply not included in the new array.

**`updateScanText`**

```ts
scans: state.scans.map((s) =>
  s.id === id ? { ...s, editedText: newText } : s
)
```

`map` goes through every scan. If the id matches, return a new object with the updated `editedText`. If it does not match, return the scan unchanged. This creates a new array with one scan updated.

**`stitchDocument`**

Used in Phase 4 for multi-page scanning. Takes all the pages collected in `multiPageSession`, joins their text with page headers, creates one merged `Scan` object, and adds it to the `scans` array.

### How Components Use the Store

```ts
// Inside any screen or component:
const { scans, addScan, deleteScan } = useScanStore()

// Read the data
scans.map(scan => ...)

// Update the data
addScan(newScan)
deleteScan(someId)
```

The component automatically re-renders when `scans` changes.

### How This File Connects

```
src/store/scanStore.ts
       ↓ used by
app/(tabs)/index.tsx     — reads scans for recent strip
app/(tabs)/history.tsx   — reads scans for full list, calls deleteScan
app/results.tsx          — calls addScan after saving
```

---

## How All 4 Files Connect

```
src/types/index.ts
  — defines Scan, ScanStore, OCRStatus, etc.
        ↓
src/constants/colors.ts       — no imports from types (just color values)
src/constants/typography.ts   — no imports from types (just number values)
        ↓
src/store/scanStore.ts
  — imports Scan, ScanStore, MultiPageSession, PageScan from types
  — uses those types to build the correctly-shaped store
        ↓
Every screen and component
  — imports Theme from colors
  — imports FontSize, Spacing from typography
  — imports useScanStore from store
  — imports interfaces from types
```

---

## Sprint 1 — Commit Commands

After reading this and completing the Q&A, run these to save your work:

```bash
git add src/types/index.ts
git commit -m "feat(types): add all shared interfaces and type definitions"

git add src/constants/colors.ts src/constants/typography.ts
git commit -m "feat(constants): add Colors Theme FontSize Spacing and Radius tokens"

git add src/store/scanStore.ts
git commit -m "feat(store): add Zustand scanStore with all state fields and actions"

git push origin phase/1-core-ocr
```

---

## Q&A Time

Read through this file. Then come back and ask any question you have — about anything that is still unclear, any term that does not make sense, or any part of the code you want explained differently.

There are no wrong questions. Ask as many as you need before we move to Sprint 2.
