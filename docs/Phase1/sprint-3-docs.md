# Sprint 3 — Documentation
## Files: useImagePicker.ts · camera.tsx

---

## New TypeScript & React Native Terms in This Sprint

---

### `Promise<string | null>`

A Promise is JavaScript's way of handling something that takes time. Instead of freezing the app while waiting, a Promise says "I will give you the result when it is ready."

```ts
// This function does not return a string immediately
// It returns a Promise that will eventually resolve to a string or null
async function pickFromCamera(): Promise<string | null> {
  // ... takes time to open camera and capture
  return '/path/to/photo.jpg'  // resolves to a string
  // OR
  return null  // if user cancelled
}
```

The `Promise<string | null>` type tells TypeScript: "when this Promise finishes, it will give you either a string or null."

You use `await` to wait for the Promise:

```ts
const uri = await pickFromCamera()
// uri is now string | null — not a Promise anymore
if (!uri) return  // handle null case
// use uri safely here
```

---

### `async` and `await`

`async` marks a function as asynchronous — it can do things that take time.
`await` pauses that function until the result is ready.

```ts
// Without async/await — hard to read, deeply nested
pickFromCamera().then(uri => {
  compressImage(uri).then(compressed => {
    router.push(compressed)
  })
})

// With async/await — reads like normal code top to bottom
async function handleCapture() {
  const uri = await pickFromCamera()
  const compressed = await compressImage(uri)
  router.push(compressed)
}
```

Every function in `useImagePicker.ts` is `async` because they all wait for device operations — camera, gallery, compression.

---

### `try / catch / finally`

This is error handling. Code that might fail goes in `try`. If it fails, `catch` handles the error. `finally` always runs no matter what.

```ts
try {
  const result = await doSomethingRisky()  // might fail
  return result
} catch (err: any) {
  setError(err.message)  // handle the failure
  return null
} finally {
  setIsLoading(false)  // always runs — success OR failure
}
```

The `finally` block is critical here. Without it, if the `try` block throws an error, `setIsLoading(false)` never runs and the spinner spins forever.

---

### `useRef`

`useRef` creates a reference to a component or value that persists across renders but does NOT cause a re-render when it changes.

```ts
const cameraRef = useRef<CameraView>(null)
```

This creates a reference to the `CameraView` component. Once the camera mounts on screen, the ref automatically points to it. Then you can call methods on it:

```ts
const photo = await cameraRef.current.takePictureAsync()
```

`cameraRef.current` is the actual `CameraView` component. `.takePictureAsync()` is a method on that component that captures a photo.

Think of `useRef` like a remote control for a specific component.

---

### `useRef<CameraView>(null)`

The `<CameraView>` generic tells TypeScript what type of thing this ref will eventually hold. Starting value is `null` because the camera component has not mounted yet when the code first runs.

```ts
// Without generic — TypeScript has no idea what .current holds
const cameraRef = useRef(null)
cameraRef.current.takePictureAsync()  // Error: null has no methods

// With generic — TypeScript knows it holds a CameraView
const cameraRef = useRef<CameraView>(null)
cameraRef.current?.takePictureAsync()  // TypeScript knows this method exists
```

---

### `useState<'front' | 'back'>('back')`

A union type as the generic for useState. This state can ONLY be `'front'` or `'back'` — nothing else. If you try to `setFacing('left')`, TypeScript errors.

```ts
const [facing, setFacing] = useState<'front' | 'back'>('back')

setFacing('front')   // ✅ valid
setFacing('back')    // ✅ valid
setFacing('left')    // ❌ TypeScript error
```

---

### `useLocalSearchParams<{ mode?: string }>()`

This reads URL parameters passed to the screen when navigating.

```ts
// When navigating with a param:
router.push({ pathname: '/camera', params: { mode: 'gallery' } })

// Inside camera.tsx — reading that param:
const { mode } = useLocalSearchParams<{ mode?: string }>()
// mode = 'gallery'
```

The `<{ mode?: string }>` generic tells TypeScript the shape of the params object. The `?` makes `mode` optional — the camera screen can be opened with or without the param.

---

### `position: 'absolute'`

In React Native, by default all elements stack vertically in a flow. `position: 'absolute'` removes an element from the flow and lets you position it anywhere using `top`, `left`, `right`, `bottom`.

```ts
// The overlay sits on top of the camera — covers it completely
overlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}
```

This is how the corner guides, close button, and shutter controls sit on top of the live camera preview without the camera preview being hidden behind them.

---

### `'rgba(0,0,0,0.5)'`

A color with transparency. `rgba` stands for Red, Green, Blue, Alpha. The fourth value (alpha) controls opacity from 0 (fully transparent) to 1 (fully opaque).

```ts
backgroundColor: 'rgba(0,0,0,0.5)'  // black at 50% opacity
backgroundColor: 'rgba(0,0,0,0.8)'  // black at 80% opacity — darker
backgroundColor: 'rgba(255,255,255,0.3)'  // white at 30% opacity
```

Used for the close button background so it is visible against any background without fully blocking the camera view.

---

---

## File 1 — `src/hooks/useImagePicker.ts`

### What This File Is

A custom hook that handles all image acquisition — from camera and from gallery. It manages permissions, launches the picker, and compresses the result. The camera screen just calls `pickFromCamera()` and gets back a URI.

### Why a hook for this?

Without a hook, the camera screen would contain:
- Permission request logic
- Camera launch logic
- Gallery launch logic
- Compression logic
- Loading state management
- Error state management

That is 100+ lines of non-UI logic inside a screen file. The screen becomes impossible to read.

With the hook, the camera screen calls one function and gets back one value. All the complexity is hidden inside the hook.

### The `UseImagePickerReturn` interface

```ts
interface UseImagePickerReturn {
  pickFromCamera: () => Promise<string | null>
  pickFromGallery: () => Promise<string | null>
  isLoading: boolean
  error: string | null
}
```

This documents exactly what the hook gives back. When a screen imports this hook, TypeScript immediately shows it the available functions and values. No guessing.

### The `compressImage` function

```ts
async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  )
  return result.uri
}
```

This is defined OUTSIDE the hook — it is a private helper. It is not exported. No other file needs it.

What it does:
- Takes the original image URI
- Resizes it so the maximum width is 1920px (height scales automatically)
- Compresses to 85% JPEG quality
- Returns the URI of the new compressed image

Why compress? An iPhone photo can be 5–8MB. ML Kit processes it much faster at ~300KB. 85% JPEG quality is visually identical to the original — you cannot tell the difference, but the file is 90% smaller.

### The permission check pattern

```ts
const { status } = await ImagePicker.requestCameraPermissionsAsync()

if (status !== 'granted') {
  setError('Camera permission is required')
  return null
}
```

This is called a guard clause. Check the condition early. If it fails, exit immediately. The rest of the function only runs when the condition is met. This keeps the happy path at the left margin and avoids deep nesting.

On iOS, the first time this runs it shows the system permission dialog. After the user responds, subsequent calls return the cached result immediately — no dialog again.

### `result.assets[0].uri`

Expo SDK 47+ changed the ImagePicker response shape:

```ts
// Old way (before SDK 47) — no longer works
const uri = result.uri

// New way (SDK 47+) — always use this
const uri = result.assets[0].uri
```

`assets` is an array because ImagePicker supports multiple selections. We always pick `[0]` (the first and only selected image) since we do not enable multi-select.

### `finally { setIsLoading(false) }`

Both `pickFromCamera` and `pickFromGallery` set `isLoading(true)` at the start. The `finally` block guarantees `isLoading` resets to false no matter what happens — success, cancellation, or error.

Without `finally`:
- If user cancels → early `return null` → `setIsLoading(false)` at the end never runs
- If an error throws → caught by `catch` → `setIsLoading(false)` at end never runs

`finally` solves both cases in one line.

### How it connects

```
src/hooks/useImagePicker.ts
  ↓ used by
  app/camera.tsx — calls pickFromCamera and pickFromGallery
  ↓ uses
  expo-image-picker — for camera and gallery access
  expo-image-manipulator — for compression
```

---

## File 2 — `app/camera.tsx`

### What This File Is

A full-screen camera experience. No tab bar. Slides up as a modal. The user aligns their document to the cyan corner guides and taps the shutter button. The captured image URI is passed to the results screen.

### Why it opens as a modal

In `app/_layout.tsx`:
```ts
<Stack.Screen name="camera" options={{ presentation: 'fullScreenModal' }} />
```

A modal slides up from the bottom. This signals to the user: "you are in a temporary mode." When done, you dismiss it and return exactly where you were. A pushed screen (sliding from right) signals: "you navigated somewhere new."

Camera is temporary — modal is the right pattern.

### The three conditional renders

The camera screen has three possible states:

```ts
// State 1 — permissions not loaded yet (brief moment on first open)
if (!permission) {
  return <View style={styles.container} />  // blank screen
}

// State 2 — permission denied
if (!permission.granted) {
  return <PermissionDeniedUI />
}

// State 3 — permission granted
return <FullCameraUI />
```

This pattern is called early return. Handle the edge cases first. The main UI only renders when everything is ready.

### `useCameraPermissions()`

Returns `[permission, requestPermission]`:
- `permission` — the current permission status object
- `requestPermission` — a function that shows the iOS permission dialog

```ts
const [permission, requestPermission] = useCameraPermissions()

// permission.granted — true or false
// requestPermission() — shows the dialog
```

### The `handleCapture` function

```ts
async function handleCapture() {
  if (!cameraRef.current) return

  try {
    const photo = await cameraRef.current.takePictureAsync({ quality: 1 })
    if (!photo) return
    router.push({ pathname: '/results', params: { imageUri: photo.uri } })
  } catch {
    Alert.alert('Error', 'Failed to take photo. Please try again.')
  }
}
```

Step by step:
1. Check the ref exists — if camera has not mounted yet, exit
2. Call `takePictureAsync` — captures the current camera frame
3. If photo is null for any reason, exit
4. Navigate to results screen and pass the image URI as a parameter

We capture at `quality: 1` (full resolution). The compression happens in the results screen via `useImagePicker`'s `compressImage`. We want the original for OCR accuracy.

### The overlay structure

```
<View style={styles.container}>           ← black background
  <CameraView style={styles.camera} />   ← live camera preview (fills screen)
  <View style={styles.overlay}>          ← absolute positioned on top
    ✕ close button
    Corner guides
    Controls row (flash · shutter · flip)
    Gallery button
  </View>
</View>
```

The overlay is `position: absolute` covering the full screen. It sits on top of the camera preview. The camera preview shows through because the overlay has no background color — it is transparent.

### The corner guides

```ts
<View style={[styles.corner, styles.topLeft]} />
<View style={[styles.corner, styles.topRight]} />
<View style={[styles.corner, styles.bottomLeft]} />
<View style={[styles.corner, styles.bottomRight]} />
```

Four Views, each showing only two sides of a border:

```ts
topLeft: {
  top: 0,
  left: 0,
  borderRightWidth: 0,   // hide right border
  borderBottomWidth: 0,  // hide bottom border
  // only top and left border visible → top-left corner bracket
}
```

This creates the classic document scanner corner bracket UI without any images or icons.

### `handleFlipCamera` and `handleToggleFlash`

```ts
function handleFlipCamera() {
  setFacing((prev) => (prev === 'back' ? 'front' : 'back'))
}

function handleToggleFlash() {
  setFlash((prev) => (prev === 'off' ? 'on' : 'off'))
}
```

Both use the functional updater form `(prev) => ...`. They toggle between two values. The ternary `? :` reads: if currently back → switch to front. If currently front → switch to back.

### `handleGallery`

```ts
async function handleGallery() {
  const uri = await pickFromGallery()
  if (uri) {
    router.push({ pathname: '/results', params: { imageUri: uri } })
  }
}
```

Calls the hook's `pickFromGallery`. If the user picks an image (uri is not null), navigate to results with the URI. If the user cancels (uri is null), do nothing — stay on camera screen.

### How it connects

```
app/camera.tsx
  ↓ uses hook
  src/hooks/useImagePicker.ts — for gallery picking and compression
  ↓ uses Expo
  expo-camera (CameraView, useCameraPermissions) — for live preview and capture
  ↓ navigates to
  app/results.tsx — passes imageUri as navigation param
  ↓ reads from
  expo-router (useLocalSearchParams) — reads mode param to know if gallery was requested
```

---

## The Full Flow — Camera to Results

```
Home screen: user taps "Scan Now"
        ↓
router.push('/camera')
        ↓
camera.tsx renders
  → useCameraPermissions() checks permission
  → if not granted: show permission UI
  → if granted: show camera UI
        ↓
User taps shutter button
        ↓
handleCapture() runs
  → cameraRef.current.takePictureAsync()
  → photo.uri = 'file:///var/mobile/...'
        ↓
router.push({ pathname: '/results', params: { imageUri: photo.uri } })
        ↓
results.tsx receives imageUri param
  → OCR runs on the image (Sprint 4)
```

---

## Sprint 3 — Commit Reference

```bash
git add src/hooks/useImagePicker.ts
git commit -m "feat(camera): add useImagePicker hook with permission handling and compression"

git add app/camera.tsx
git commit -m "feat(camera): add full-screen camera screen with corner guides and flash"

git add app.json
git commit -m "chore(config): add expo-camera permission to app.json"

git push origin phase/1-core-ocr
```

---

## Q&A Time

Read through this file. Then come back and ask anything — about async/await, useRef, permissions, the overlay system, or anything else before we move to Sprint 4.
