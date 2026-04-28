# Sprint 6 — Documentation

## Files: useExport.ts · BottomSheet.tsx · results.tsx (updated)

---

## New Terms in This Sprint

---

### `Animated.Value`

A special value that React Native can animate smoothly. Regular state changes cause instant jumps. `Animated.Value` changes gradually over time.

```ts
const slideAnim = useRef(new Animated.Value(300)).current;
// Starts at 300 (off screen below)
// Animates to 0 (on screen)
```

The `useRef` keeps the same `Animated.Value` across re-renders — creating a new one every render would restart the animation.

---

### `Animated.spring` and `Animated.timing`

Two ways to animate an `Animated.Value`:

```ts
// Spring — bouncy, natural feeling
Animated.spring(slideAnim, {
  toValue: 0, // animate to this value
  tension: 100, // how stiff the spring is
  friction: 12, // how quickly it stops bouncing
  useNativeDriver: true,
}).start();

// Timing — linear or eased, predictable
Animated.timing(slideAnim, {
  toValue: 300, // animate to this value
  duration: 200, // how long in milliseconds
  useNativeDriver: true,
}).start();
```

`useNativeDriver: true` runs the animation on the native thread — smoother and faster than JavaScript-driven animations.

---

### `Modal`

A component that renders on top of everything else on the screen.

```ts
<Modal
  visible={showExport}   // show or hide
  transparent            // background can show through
  animationType="fade"   // how the modal appears
  onRequestClose={onClose}  // Android back button handler
>
  {/* content here appears on top of everything */}
</Modal>
```

`transparent` means the Modal itself has no background — we add our own semi-transparent overlay inside it.

---

### `TouchableWithoutFeedback`

A touchable that responds to taps but shows no visual feedback (no opacity change, no ripple).

```ts
<TouchableWithoutFeedback onPress={onClose}>
  <View style={styles.overlay}>
    {/* tapping the overlay closes the sheet */}
  </View>
</TouchableWithoutFeedback>
```

Used for the dark overlay behind the bottom sheet. Tapping anywhere outside the sheet closes it — with no visual feedback because it is just a background.

---

### `FileSystem.documentDirectory`

A private folder on the device that belongs to your app.

```ts
const path = FileSystem.documentDirectory + "scan.txt";
// Example: file:///var/mobile/Containers/Data/Application/.../Documents/scan.txt
```

Files here:

- Survive app restarts
- Are deleted when the app is uninstalled
- Are private — other apps cannot access them
- Can be shared via `Sharing.shareAsync`

---

### `Sharing.shareAsync`

Opens the iOS share sheet — the panel that lets users send content to Mail, WhatsApp, AirDrop, Notes, and hundreds of other apps.

```ts
await Sharing.shareAsync(filePath, {
  mimeType: "text/plain", // tells iOS what kind of file this is
  dialogTitle: "Export as TXT", // title shown in the share sheet
});
```

`mimeType` determines which apps appear in the share sheet. `text/plain` shows text-compatible apps. `application/pdf` shows PDF-compatible apps.

---

### `Print.printToFileAsync`

Converts HTML to a PDF file and saves it to a temporary directory.

```ts
const { uri } = await Print.printToFileAsync({ html: htmlString });
// uri = path to the generated PDF file
```

You pass any HTML string and get back a PDF. We use this to create formatted PDF exports from the extracted text.

---

### `setTimeout(fn, 300)`

Delays a function call by 300 milliseconds.

```ts
onPress={() => {
  onClose()                        // close the sheet first
  setTimeout(option.onPress, 300)  // then run export after animation finishes
}}
```

Without the delay, the export action would run while the bottom sheet is still animating closed — causing a visual glitch where the share sheet appears on top of the closing animation.

---

---

## File 1 — `src/hooks/useExport.ts`

### What This File Is

All export operations in one hook. Three functions: export as TXT, export as PDF, share text. The results screen just calls these functions — it never touches the file system directly.

### `exportAsTXT` — How It Works

```
1. Check Sharing is available on this device
2. Build a file path in documentDirectory
3. Write the text to that file (UTF8 encoding)
4. Open the iOS share sheet with the file
```

UTF8 encoding is critical. Without it, special characters (Arabic, Chinese, accented letters) would be corrupted in the exported file.

### `exportAsPDF` — How It Works

```
1. Check Sharing is available
2. Build an HTML string with the text inside
3. expo-print converts HTML → PDF file
4. Open iOS share sheet with the PDF
```

The HTML template:

- Sets a clean font and spacing
- Uses cyan for the title to match the app's design
- Uses `white-space: pre-wrap` to preserve line breaks from the OCR text
- Escapes `<` and `>` characters to prevent HTML injection

### `shareText` — How It Works

Same as TXT export but with a generic "Share Text" dialog title. Opens the share sheet so the user can send the text to any app.

### `isAvailableAsync()` Check

```ts
const isAvailable = await Sharing.isAvailableAsync();
if (!isAvailable) {
  setError("Sharing is not available on this device");
  return;
}
```

On iOS simulators, sharing is sometimes not available. Always check before calling `shareAsync` — without the check, the app crashes on devices where sharing is unavailable.

### How it connects

```
src/hooks/useExport.ts
  ↓ uses
  expo-file-system   — writes files to device storage
  expo-sharing       — opens iOS share sheet
  expo-print         — converts HTML to PDF
  ↓ used by
  app/results.tsx    — exportAsTXT, exportAsPDF, shareText, isExporting
```

---

## File 2 — `src/components/BottomSheet.tsx`

### What This File Is

An animated panel that slides up from the bottom of the screen. Shows export options. Tapping the dark overlay or Cancel closes it.

### The Animation System

```ts
const slideAnim = useRef(new Animated.Value(300)).current;
```

Starts at `300` — 300dp below its normal position (off screen). When `visible` becomes true, springs to `0` (normal position). When `visible` becomes false, times back to `300`.

```ts
useEffect(() => {
  if (visible) {
    Animated.spring(slideAnim, { toValue: 0, ... }).start()
  } else {
    Animated.timing(slideAnim, { toValue: 300, ... }).start()
  }
}, [visible])
```

Spring for opening (bouncy, feels alive). Timing for closing (quick and clean).

### The Layered Structure

```
Modal (full screen, transparent)
  ↓
TouchableWithoutFeedback (tapping overlay closes sheet)
  ↓
View (dark semi-transparent overlay)
  ↓
TouchableWithoutFeedback (prevents taps on sheet from closing it)
  ↓
Animated.View (the white sheet that slides up)
  ↓
  Handle bar
  Title
  Export option rows
  Cancel button
```

The nested `TouchableWithoutFeedback` around the sheet is important. Without it, tapping anywhere on the sheet — including on the options — would trigger the outer `TouchableWithoutFeedback` and close the sheet.

### The `setTimeout` in Option Press

```ts
onPress={() => {
  onClose()
  setTimeout(option.onPress, 300)
}}
```

Close the sheet first. Wait 300ms for the close animation to finish. Then run the export. This prevents the iOS share sheet from appearing while the bottom sheet animation is still playing.

### `ExportOption` interface

```ts
interface ExportOption {
  icon: string;
  label: string;
  description: string;
  onPress: () => void;
}
```

The BottomSheet does not know anything about TXT or PDF. It just renders whatever options the caller passes. This makes it reusable — any screen can use BottomSheet with any set of options.

---

## File 3 — `app/results.tsx` (Updated)

### What Changed

Added an Export button (📤) next to the Save button. Tapping it opens the BottomSheet with three export options.

### The Export Options Array

```ts
const exportOptions = [
  {
    icon: "📄",
    label: "Export as TXT",
    description: "Plain text file",
    onPress: () => exportAsTXT(currentText),
  },
  // ...
];
```

Defined inside the component so it has access to the current text. The text priority is:

1. `savedText.current` — text the user edited
2. `text` — original OCR output
3. `activeScan?.editedText` — text from a saved scan opened from history

### The `headerButtons` layout

```ts
<View style={styles.headerButtons}>
  <TouchableOpacity style={styles.exportButton}>  {/* 📤 */}
  <TouchableOpacity style={styles.saveButton}>    {/* 💾 Save */}
</View>
```

`headerButtons` uses `flexDirection: 'row'` with `gap` to place buttons side by side. Both only show when there is text to export (`status === 'success'` or `activeScan` exists).

---

## The Complete Export Flow

```
User taps 📤 on results screen
        ↓
setShowExport(true)
        ↓
BottomSheet becomes visible
  → slideAnim springs from 300 to 0
  → Sheet slides up with bounce
        ↓
User taps "Export as PDF"
        ↓
onClose() called → slideAnim times back to 300
setTimeout 300ms
        ↓
exportAsPDF(text) runs
  → build HTML string
  → Print.printToFileAsync → PDF file created
  → Sharing.shareAsync → iOS share sheet opens
        ↓
User picks Mail / AirDrop / Files / WhatsApp etc
        ↓
File sent to chosen destination
```

---

## Sprint 6 — Commit Reference

```bash
git add src/hooks/useExport.ts
git commit -m "feat(export): add useExport hook with TXT PDF and share options"

git add src/components/BottomSheet.tsx
git commit -m "feat(components): add animated BottomSheet with export options"

git add app/results.tsx
git commit -m "feat(results): add export button and connect BottomSheet"

git push origin phase/2-firebase
```

---

## Phase 2 Complete — What We Built

| Sprint   | Feature                          | Status |
| -------- | -------------------------------- | ------ |
| Sprint 5 | Firebase Auth (email/password)   | ✅     |
| Sprint 5 | Save scan to Firestore + Storage | ✅     |
| Sprint 5 | History loads from Firebase      | ✅     |
| Sprint 5 | Delete scan from Firebase        | ✅     |
| Sprint 5 | Login and Register screen        | ✅     |
| Sprint 6 | Export as TXT                    | ✅     |
| Sprint 6 | Export as PDF                    | ✅     |
| Sprint 6 | Share via iOS share sheet        | ✅     |
| Sprint 6 | Animated BottomSheet             | ✅     |

---

## Q&A Time

Read through this file. Ask anything about animations, the Modal system, the export flow, or anything else. When ready say "done with Q&A" and we merge Phase 2, tag v0.2.0, and start Phase 3 — AI Summarization with Claude API.
