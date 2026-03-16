# Q&A — TypeScript Functions, Parameters, and How the Store Works

---

## First — TypeScript Function Types from Scratch

In JavaScript you write a function like this:

```js
function deleteScan(id) {
  // do something with id
}
```

TypeScript adds labels to tell you exactly what goes in and what comes out:

```ts
function deleteScan(id: string): void {
  // id must be a string
  // void means this returns nothing
}
```

The `: string` after `id` says — "this parameter must be a string."
The `: void` after the parentheses says — "this function returns nothing."

---

### What `void` means

`void` is TypeScript's way of saying "this function does its job and returns nothing."

```ts
// This returns something — a number
function add(a: number, b: number): number {
  return a + b
}

// This returns nothing — void
function sayHello(name: string): void {
  console.log('Hello ' + name)
  // no return statement needed
}
```

In our store, almost every action returns `void` because actions just UPDATE state — they do not return a value. The component calls `deleteScan(id)` and the store updates. Nothing comes back.

---

### Function type as a value

In JavaScript, functions can be stored as values:

```js
// JavaScript
const greet = function(name) {
  console.log('Hi ' + name)
}
```

TypeScript can describe what that value looks like:

```ts
// TypeScript — describing a function stored as a value
const greet: (name: string) => void = function(name) {
  console.log('Hi ' + name)
}
```

The part `(name: string) => void` is the TYPE of the function. It says:

- takes one parameter: `name` which is a string
- returns nothing: `void`

---

### Now look at the interface

This is what confused you:

```ts
export interface ScanStore {
  deleteScan: (id: string) => void
}
```

This is NOT the actual function. This is just the DESCRIPTION of what the function will look like.

Think of the interface like a job description:

```
Job Description (interface):
  deleteScan — must accept a string ID, must return nothing

The actual employee (scanStore.ts implementation):
  deleteScan: (id) => set((state) => ({ scans: state.scans.filter(...) }))
```

The interface says what the function MUST be. The store file actually builds it.

---

### Your specific question — `startMultiPage: () => void`

```ts
startMultiPage: () => void
```

Breaking this down:

- `startMultiPage` — the name
- `:` — "is of type"
- `()` — takes NO parameters
- `=> void` — returns nothing

So the full sentence is: **"startMultiPage is a function that takes nothing and returns nothing."**

Why define it here with no actual code?

Because the `ScanStore` interface is just the PLAN. It lists every function the store must have, like a checklist. The actual CODE for each function is written below in `scanStore.ts`.

```ts
// In types/index.ts — the PLAN (just the shape)
interface ScanStore {
  startMultiPage: () => void   // "there must be a function called startMultiPage"
}

// In scanStore.ts — the ACTUAL CODE
startMultiPage: () =>
  set({ multiPageSession: { active: true, pages: [], mode: 'collecting' } })
```

TypeScript checks that the actual code matches the plan. If you forget to write `startMultiPage` in the store, TypeScript gives you an error.

---

## How `create<ScanStore>` Works

### Step 1 — What `create` is

`create` is a function from Zustand. You call it to build a store.

```ts
import { create } from 'zustand'

const useStore = create(...)
```

### Step 2 — What the `< >` means

The `< >` passes a TYPE as a parameter. This is called a generic.

Normally you pass values in `( )`:

```ts
add(5, 3)      // passing values
```

With generics you pass TYPES in `< >`:

```ts
create<ScanStore>(...)   // passing a type
```

You are telling Zustand: **"Build me a store that looks exactly like ScanStore."**

Without `<ScanStore>`:

```ts
const useStore = create(...)
// Zustand has no idea what shape your store is
// TypeScript cannot help you at all
// get() returns unknown — useless
```

With `<ScanStore>`:

```ts
const useStore = create<ScanStore>(...)
// Zustand knows your store matches ScanStore
// TypeScript checks every field and function
// Autocomplete works perfectly
```

### Step 3 — What `(set, get) =>` is

Zustand gives you two tools when building the store:

```ts
create<ScanStore>((set, get) => ({
  // set — updates state
  // get — reads current state
}))
```

- `set` — call this to change state
- `get` — call this to READ state from inside an action

---

## How `set` Works — Three Ways

### Way 1 — Direct update (simple)

When you just want to change one value directly:

```ts
setProcessing: (value) => set({ isProcessing: value })
```

`set({ isProcessing: value })` replaces `isProcessing` with the new value. Everything else in the store stays the same. Zustand merges automatically.

### Way 2 — Update using current state (callback form)

When you need to READ the current state to calculate the next state:

```ts
addScan: (scan) =>
  set((state) => ({ scans: [scan, ...state.scans] }))
```

Here `set` receives a function `(state) => ...`. Zustand calls that function and passes in the CURRENT state. You read `state.scans` and return the new value.

Why do we need the current state here? Because we need to keep all the existing scans AND add the new one. We cannot do that without reading what scans already exist.

### Way 3 — Read state with `get` inside an action

`get()` reads current state from inside an action without triggering a re-render.

```ts
stitchDocument: () => {
  const { pages } = get().multiPageSession  // read current state
  // now use pages to build the merged scan
  set(...)
}
```

You use `get()` instead of `set(state => ...)` when you need to read state early and do multiple steps before updating.

---

## How `deleteScan` Actually Works

```ts
deleteScan: (id) =>
  set((state) => ({ scans: state.scans.filter((s) => s.id !== id) }))
```

Let's unwrap this step by step.

### Step 1 — What `filter` does

`filter` goes through every item in an array and keeps only the ones where your condition is TRUE.

```js
const numbers = [1, 2, 3, 4, 5]

const result = numbers.filter((n) => n > 3)

// result = [4, 5]
// filter kept only the numbers where n > 3 was true
```

### Step 2 — Applying it to scans

```ts
state.scans.filter((s) => s.id !== id)
```

- `state.scans` — the current array of all scans
- `.filter(...)` — go through every scan
- `(s)` — each scan is temporarily called `s`
- `s.id !== id` — keep this scan IF its id does NOT match the id we want to delete

So if you have scans with ids `["1", "2", "3"]` and you delete id `"2"`:

```
scan "1" — s.id !== "2" → true  → KEEP
scan "2" — s.id !== "2" → false → REMOVE
scan "3" — s.id !== "2" → true  → KEEP

Result: ["1", "3"]
```

### Step 3 — Why not just do `array.splice()`?

In JavaScript you COULD do:

```js
state.scans.splice(index, 1)  // removes item at index
```

But this MUTATES the original array — it modifies it in place. React cannot detect this change. The UI would not update. Nothing would appear to be deleted.

`filter` creates a BRAND NEW array. When `set` receives this new array, React detects the change and re-renders the History screen automatically.

**Rule: never mutate state. Always create new arrays and objects.**

---

## How `updateScanText` Works

```ts
updateScanText: (id, newText) =>
  set((state) => ({
    scans: state.scans.map((s) =>
      s.id === id ? { ...s, editedText: newText } : s
    ),
  }))
```

### What `map` does

`map` goes through every item in an array and TRANSFORMS each one. Unlike `filter` which removes items, `map` keeps every item but can change them.

```js
const numbers = [1, 2, 3]

const doubled = numbers.map((n) => n * 2)

// doubled = [2, 4, 6]
// every item was transformed
```

### The ternary operator `? :`

```ts
s.id === id ? { ...s, editedText: newText } : s
```

This is a one-line if/else. Read it as:

```
condition ? value_if_true : value_if_false
```

So:

- IF `s.id === id` (this is the scan we want to update)
- THEN return `{ ...s, editedText: newText }` (a new object with the text updated)
- ELSE return `s` (the scan unchanged)

### What `{ ...s, editedText: newText }` does

`...s` spreads ALL existing fields of the scan object. Then `editedText: newText` overrides just that one field.

```ts
const scan = {
  id: "1",
  extractedText: "Hello",
  editedText: "Hello",
  language: "en"
  // ... more fields
}

// { ...scan, editedText: "Hi there" } produces:
{
  id: "1",
  extractedText: "Hello",
  editedText: "Hi there",   // ← only this changed
  language: "en"
  // ... all other fields unchanged
}
```

This is how you update ONE field of an object without touching the rest.

### The full loop visualized

Imagine you have 3 scans and you update scan with id `"2"`:

```
map goes through each scan:

scan "1" → s.id === "2"? NO  → return scan "1" unchanged
scan "2" → s.id === "2"? YES → return new object with editedText updated
scan "3" → s.id === "2"? NO  → return scan "3" unchanged

Result: new array, same 3 scans, but scan "2" has new editedText
```

---

## How `addScan` Works

```ts
addScan: (scan) =>
  set((state) => ({ scans: [scan, ...state.scans] }))
```

`[scan, ...state.scans]` creates a new array:

- First item: the new scan
- Then: all existing scans spread after it

```
Before: scans = [scanB, scanC]
addScan(scanA)
After:  scans = [scanA, scanB, scanC]
```

The new scan is at the FRONT. This means the History screen shows newest scans at the top without any sorting needed.

---

## How `stitchDocument` Works (Multi-page)

This is the most complex function. Let's break it fully.

```ts
stitchDocument: () => {
  const { pages } = get().multiPageSession

  const stitchedText = pages
    .map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`)
    .join('\n\n')

  const mergedScan: Scan = {
    id: Date.now().toString(),
    imageUri: pages[0]?.imageUri ?? '',
    // ...
  }

  set((state) => ({
    scans: [mergedScan, ...state.scans],
    multiPageSession: { active: false, pages: [], mode: 'complete' },
  }))
}
```

### Step 1 — Read current pages

```ts
const { pages } = get().multiPageSession
```

`get()` reads the current store. `multiPageSession.pages` is the array of all scanned pages collected so far.

### Step 2 — Build one combined text string

```ts
const stitchedText = pages
  .map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`)
  .join('\n\n')
```

`map` transforms each page into a string like:

```
--- Page 1 ---
Text from page one...
```

`.join('\n\n')` combines all those strings with two newlines between each one:

```
--- Page 1 ---
Text from page one...

--- Page 2 ---
Text from page two...
```

### Step 3 — The `??` operator

```ts
imageUri: pages[0]?.imageUri ?? ''
```

- `pages[0]?.imageUri` — get the first page's imageUri, but if pages is empty, return `undefined` safely
- `?? ''` — if that result is undefined or null, use empty string instead

### Step 4 — Update two things at once

```ts
set((state) => ({
  scans: [mergedScan, ...state.scans],     // add merged scan to history
  multiPageSession: { active: false, ... } // reset the session
}))
```

One `set` call updates two parts of the store simultaneously.

---

## How All Functions Connect — The Full Picture

```
User taps "Delete" on a ScanCard
        ↓
ScanCard component calls: onDelete(scan.id)
        ↓
History screen received onDelete from store: const { deleteScan } = useScanStore()
        ↓
deleteScan(scan.id) is called
        ↓
set() runs: creates new scans array without the deleted scan
        ↓
Zustand detects state changed
        ↓
History screen automatically re-renders
        ↓
Deleted scan no longer appears in the list
```

```
User types in the TextEditor
        ↓
TextEditor calls: updateScanText(activeScan.id, newText)
        ↓
set() runs: map through scans, find matching id, return new object with updated text
        ↓
Zustand detects state changed
        ↓
Any component reading that scan automatically gets the new text
```

---

## Summary — The Pattern Behind Every Action

Every store action follows the same pattern:

```ts
actionName: (parameter: Type) =>
  set((state) => ({
    fieldToUpdate: /* new value calculated from state and parameter */
  }))
```

| Action | What it does to state |
|---|---|
| `addScan` | Prepends new scan to array |
| `deleteScan` | Filters out scan with matching id |
| `updateScanText` | Maps through scans, returns updated copy for matching id |
| `setActiveScan` | Replaces activeScan directly |
| `setProcessing` | Replaces isProcessing directly |
| `clearAllScans` | Replaces scans with empty array |
| `startMultiPage` | Replaces multiPageSession with fresh active session |
| `addPageToSession` | Spreads existing session, appends new page to pages array |
| `stitchDocument` | Reads pages with get(), builds merged scan, adds to scans, resets session |
| `cancelMultiPage` | Replaces multiPageSession with initial idle state |

---

Ask your next question whenever you are ready.
