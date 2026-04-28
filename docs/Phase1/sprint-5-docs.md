# Sprint 5 — Documentation

## Files: firebase.service.ts · useFirebase.ts · history.tsx (updated) · results.tsx (updated)

---

## New TypeScript & React Native Terms in This Sprint

---

### `async/await` with Firebase

Every Firebase operation takes time — writing to the cloud, uploading a file, reading documents. They are all async. You will see `await` before every Firebase call.

```ts
// Each line waits for the previous one to finish
const userId = await signInAnon()          // wait for auth
await uploadBytes(imageRef, blob)          // wait for upload
const imageUrl = await getDownloadURL(ref) // wait for URL
await addDoc(collection(...), data)        // wait for save
```

If you remove `await`, the next line runs before the previous one finishes — the upload has not completed but you are already trying to get the download URL. The app breaks.

---

### `serverTimestamp()`

Instead of using `new Date().toISOString()` for the creation time, Firebase provides `serverTimestamp()`.

```ts
// Client timestamp — your phone's clock
createdAt: new Date().toISOString();

// Server timestamp — Firebase server's clock
createdAt: serverTimestamp();
```

Why does this matter? If a user's phone clock is wrong — set to the wrong time zone or just incorrect — your dates would be wrong. `serverTimestamp()` uses Firebase's server clock which is always correct. All users get consistent timestamps.

---

### `query` and `orderBy`

Firestore does not automatically sort your data. You have to tell it how to sort:

```ts
const q = query(
  collection(db, "users", userId, "scans"),
  orderBy("createdAt", "desc"), // newest first
);

const snapshot = await getDocs(q);
```

`query()` builds the query. `orderBy('createdAt', 'desc')` sorts by creation time, newest first. Without `orderBy`, Firestore returns documents in an undefined order.

---

### `snapshot.docs.map()`

Firestore returns a `QuerySnapshot` — not a plain array. You access the documents through `.docs` and then map them:

```ts
const scans: Scan[] = snapshot.docs.map((document) => ({
  ...(document.data() as Scan),
  id: document.id,
}));
```

- `document.data()` — returns the document fields as a plain object
- `as Scan` — tells TypeScript to treat it as a Scan
- `document.id` — the Firestore document ID (we use this as our scan ID)
- `...` spread — combines data fields with the id

---

### `ref as storageRef`

When two imports have the same name from different packages, you rename one:

```ts
import { ref as storageRef } from "firebase/storage";
// Now use storageRef() instead of ref() for storage operations
```

This avoids the clash between `ref` from Firestore and `ref` from Storage.

---

### `RefreshControl`

Adds pull-to-refresh to a FlatList:

```ts
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={refreshing}    // true shows the spinner
      onRefresh={handleRefresh}  // called when user pulls down
      tintColor={Theme.accent}   // spinner color
    />
  }
/>
```

When `refreshing` is true, the spinner shows at the top of the list. When `handleRefresh` finishes, set `refreshing` back to false to hide the spinner.

---

### `process.env.EXPO_PUBLIC_`

Environment variables in Expo. Values stored in `.env` file.

```ts
// In .env file
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...

// In code
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY
```

The `EXPO_PUBLIC_` prefix is required — Expo only exposes variables with this prefix to the app bundle. Variables without this prefix are invisible to the app.

`@types/node` is needed to tell TypeScript that `process.env` exists — it is a Node.js global that TypeScript does not know about without the type definitions.

---

---

## File 1 — `src/services/firebase.service.ts`

### What This File Is

Initializes Firebase once and exports the three service objects the rest of the app uses. Also provides the `signInAnon` function for anonymous authentication.

### Why initialize Firebase in a separate file

Firebase must be initialized exactly once. If you called `initializeApp()` in every file that needed Firebase, you would get errors about initializing the same app multiple times.

By initializing in one file and exporting the results:

```ts
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

Every other file imports these pre-initialized objects — Firebase is never initialized twice.

### Anonymous Authentication

```ts
export async function signInAnon(): Promise<string> {
  const userCredential = await signInAnonymously(auth);
  return userCredential.user.uid;
}
```

This creates a unique anonymous account for each app installation. No email, no password — Firebase just assigns a random `uid` like `abc123xyz`.

Why do we need auth at all? Firebase Security Rules. In Firestore, data is organized as:

```
users/
  {userId}/
    scans/
      {scanId}
```

The security rules say: "only the authenticated user can read/write their own data." Without auth, anyone could read anyone's scans. With anonymous auth, each installation only accesses its own data.

If the user is already signed in, `signInAnonymously` does nothing — it just returns the existing user. Safe to call every time before a Firebase operation.

### How it connects

```
src/services/firebase.service.ts
  ↓ exports
  auth, db, storage  — used by useFirebase.ts
  signInAnon         — used by useFirebase.ts
  ↓ uses
  firebase/app       — initializeApp
  firebase/auth      — getAuth, signInAnonymously
  firebase/firestore — getFirestore
  firebase/storage   — getStorage
```

---

## File 2 — `src/hooks/useFirebase.ts`

### What This File Is

All Firebase operations in one hook — save a scan, fetch all scans, delete a scan. The UI never talks to Firebase directly — it calls this hook.

### `saveScan` — the upload flow

```
1. signInAnon()              — get userId
2. fetch(scan.imageUri)      — read the local image file
3. .blob()                   — convert to binary blob
4. uploadBytes(imageRef, blob) — upload to Firebase Storage
5. getDownloadURL(imageRef)  — get the public URL
6. addDoc(collection, data)  — save scan document to Firestore
7. addScan(updatedScan)      — update local Zustand store
```

Each step depends on the previous. The `uploadProgress` state updates at each major step (0.3, 0.6, 0.8, 1.0) so the UI can show a progress indicator.

### Why upload the image to Storage AND save to Firestore?

They serve different purposes:

- **Storage** — holds the actual image file. Returns a permanent HTTPS URL.
- **Firestore** — holds the scan data (text, language, date). Stores the Storage URL so we can display the image later.

Without Storage, the image URL would be a local file path (`file:///var/...`) that only works on the device that took the photo. The Firebase Storage URL works from any device.

### `fetchScans` — avoiding duplicates

```ts
fetchedScans.forEach((scan) => {
  const exists = scans.find((s) => s.id === scan.id);
  if (!exists) addScan(scan);
});
```

Before adding each fetched scan to the store, we check if it already exists. Without this check, every pull-to-refresh would duplicate all scans in the local store.

### `removeScan` — deleting from both places

```ts
await deleteDoc(doc(db, "users", userId, "scans", scan.id));

if (scan.imageUrl) {
  await deleteObject(imageRef);
}

deleteScan(scan.id);
```

Three steps in order:

1. Delete the Firestore document
2. Delete the Storage image (only if it was uploaded — `imageUrl` exists)
3. Remove from local Zustand store

Order matters — always confirm Firebase deletion before removing from local state. If Firebase fails, the local state stays intact and the user sees the scan is still there.

### `uploadProgress` states

| Progress | What just happened        |
| -------- | ------------------------- |
| 0        | Starting                  |
| 0.3      | Image blob ready          |
| 0.6      | Image uploaded to Storage |
| 0.8      | Download URL retrieved    |
| 1.0      | Firestore document saved  |

The Save button in results.tsx reads this and shows `Saving... 60%` etc.

### How it connects

```
src/hooks/useFirebase.ts
  ↓ uses
  src/services/firebase.service.ts — auth, db, storage, signInAnon
  src/store/scanStore.ts — addScan, deleteScan, scans
  ↓ used by
  app/results.tsx — saveScan, isUploading, uploadProgress
  app/(tabs)/history.tsx — fetchScans, removeScan, error
```

---

## File 3 — `app/(tabs)/history.tsx` (Updated)

### What Changed

The History screen now:

- Fetches scans from Firebase on mount (`useEffect`)
- Supports pull-to-refresh (`RefreshControl`)
- Shows a sync status badge (⏳ Not saved) for unsynced scans
- Shows an error banner if Firebase fails
- Deletes from Firebase (not just local store)

### The `useEffect` fetch

```ts
useEffect(() => {
  fetchScans();
}, []);
```

Runs once when the screen first mounts. Fetches all scans from Firestore and adds any new ones to the local store. The FlatList then reads from the store and renders them.

### Pull-to-refresh flow

```
User pulls down on the list
  → refreshing = true → spinner shows
  → handleRefresh() calls fetchScans()
  → fetchScans() loads latest from Firebase
  → refreshing = false → spinner hides
  → FlatList re-renders with updated data
```

### The sync badge

```ts
{!item.synced && (
  <Text style={styles.unsyncedBadge}>⏳ Not saved</Text>
)}
```

Scans created while offline or before the user tapped Save show `⏳ Not saved`. Once saved to Firebase, `synced: true` and the badge disappears. This gives users clear feedback about which scans are backed up.

### The error banner

```ts
{error && (
  <View style={styles.errorBanner}>
    <Text style={styles.errorText}>⚠️ {error}</Text>
  </View>
)}
```

If Firebase fails — network error, permission denied, etc. — the error message shows at the top of the screen. The list still shows locally cached scans. The app degrades gracefully instead of showing a blank screen.

---

## File 4 — `app/results.tsx` (Updated)

### What Changed

The Save button now:

- Calls `saveScan()` from `useFirebase` instead of just `addScan()`
- Shows upload progress percentage while saving
- Disables itself during upload to prevent double-saves

### The updated `handleSave`

```ts
async function handleSave() {
  // build newScan object
  await saveScan(newScan)  // uploads image + saves to Firestore
  Alert.alert('Saved', ...)
}
```

`saveScan` handles everything — upload, Firestore write, store update. The results screen just calls it and waits.

### Progress button

```ts
{
  isUploading ? `Saving... ${Math.round(uploadProgress * 100)}%` : "💾  Save";
}
```

While uploading, the button label changes to show progress. `Math.round(0.6 * 100)` = `60`. So the user sees "Saving... 60%". This prevents the user from wondering if the app froze.

### `disabled={isUploading}`

```ts
<TouchableOpacity disabled={isUploading}>
```

While saving, the button is disabled. The user cannot tap Save twice and create duplicate scans in Firebase.

---

## The Complete Phase 2 Firebase Flow

```
User taps Save on results screen
        ↓
handleSave() builds newScan object
        ↓
saveScan(newScan) called in useFirebase
        ↓
signInAnon() → gets userId
        ↓
fetch(imageUri) → blob ready → progress: 30%
        ↓
uploadBytes to Firebase Storage → progress: 60%
        ↓
getDownloadURL → imageUrl ready → progress: 80%
        ↓
addDoc to Firestore with all scan data → progress: 100%
        ↓
addScan(updatedScan) → Zustand store updated
        ↓
Alert "Saved" → navigate to History
        ↓
History screen mounts → fetchScans() runs
        ↓
Firestore returns all scans → FlatList renders them
        ↓
User pulls down → RefreshControl → fetchScans() again
```

---

## Firestore Data Structure

```
Firestore Database
└── users/
    └── {userId}/              ← anonymous user ID
        └── scans/
            └── {scanId}/      ← Firestore auto-generated ID
                ├── id
                ├── imageUri
                ├── imageUrl   ← Firebase Storage URL
                ├── extractedText
                ├── editedText
                ├── language
                ├── summary
                ├── translation
                ├── createdAt  ← serverTimestamp()
                ├── pageCount
                ├── tags
                ├── folderId
                └── synced: true
```

---

## Firebase Storage Structure

```
Firebase Storage
└── users/
    └── {userId}/
        └── scans/
            ├── {scanId}.jpg
            ├── {scanId}.jpg
            └── {scanId}.jpg
```

---

## Sprint 5 — Commit Reference

```bash
git add src/services/firebase.service.ts
git commit -m "feat(firebase): add Firebase init with Firestore Storage and Auth"

git add src/hooks/useFirebase.ts
git commit -m "feat(firebase): add useFirebase hook with save fetch and delete"

git add "app/(tabs)/history.tsx"
git commit -m "feat(history): connect to Firebase with pull to refresh and sync status"

git add app/results.tsx
git commit -m "feat(results): connect Save button to Firebase with upload progress"

git add .env tsconfig.json
git commit -m "chore(config): add Firebase env keys and fix tsconfig types"

git push origin phase/2-firebase
```

---

## Q&A Time

Read through this file. Ask anything about Firebase, anonymous auth, Firestore structure, the upload flow, or anything else before we move to Sprint 6 — Export (TXT, PDF, Share).
