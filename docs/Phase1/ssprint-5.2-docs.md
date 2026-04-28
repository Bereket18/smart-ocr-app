# Sprint 5 — Final Documentation

## Files: firebase.service.ts · useFirebase.ts · login.tsx · _layout.tsx (updated)

---

## New Terms in This Sprint

---

### `onAuthStateChanged`

A Firebase listener that fires every time the user's login status changes.

```ts
auth.onAuthStateChanged((user) => {
  if (user) {
    // user is logged in — user.uid is available
  } else {
    // user is logged out
  }
})
```

It fires once immediately when the app starts — telling you the current auth state. Then fires again whenever the user logs in or out. This is how `_layout.tsx` knows where to redirect.

---

### `createUserWithEmailAndPassword`

Creates a new Firebase account with email and password.

```ts
const credential = await createUserWithEmailAndPassword(auth, email, password)
const userId = credential.user.uid
```

Throws errors with specific codes you can check:

- `auth/email-already-in-use` — account exists
- `auth/invalid-email` — bad email format
- `auth/weak-password` — password too short

---

### `signInWithEmailAndPassword`

Logs in an existing user.

```ts
const credential = await signInWithEmailAndPassword(auth, email, password)
const userId = credential.user.uid
```

Throws errors:

- `auth/user-not-found` — no account with that email
- `auth/wrong-password` — incorrect password

---

### `auth.currentUser`

The currently logged-in user. Available anywhere after login.

```ts
auth.currentUser?.uid   // the user ID — or undefined if not logged in
```

This is what `getCurrentUserId()` returns. All Firebase operations use this ID to organize data.

---

### `setDoc` with `{ merge: true }`

Creates a document if it does not exist. Updates it if it does. No duplicates.

```ts
await setDoc(
  doc(db, 'users', userId, 'scans', scan.id),
  { ...data },
  { merge: true }   // ← the key option
)
```

Without `merge: true` — `setDoc` would REPLACE the entire document.
With `merge: true` — it only updates the fields you provide. Existing fields are preserved.

This is how editing a scan updates it instead of creating a duplicate.

---

### `KeyboardAvoidingView`

A React Native component that moves the screen up when the keyboard opens so inputs are not hidden.

```ts
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
  <TextInput />
</KeyboardAvoidingView>
```

On iOS `'padding'` adds padding to push content up. On Android `'height'` shrinks the view height. Without this, the keyboard covers the input fields on the login screen.

---

### `router.replace('/login')`

Navigates to login but removes the current screen from the navigation history. The user cannot go back with the back button.

```ts
router.push('/login')    // adds to history — back button returns here
router.replace('/login') // replaces history — no going back
```

Used for logout and unauthenticated redirects — the user should not be able to go back to the app after signing out.

---

---

## Why We Switched from Anonymous to Email/Password

| | Anonymous Auth | Email/Password |
|---|---|---|
| **New user ID every session** | ❌ Yes — history lost | ✅ No — always same ID |
| **History persists across reloads** | ❌ No | ✅ Yes |
| **Works on multiple devices** | ❌ No | ✅ Yes |
| **User can recover account** | ❌ No | ✅ Yes |
| **Portfolio quality** | ❌ Looks basic | ✅ Professional |

Anonymous auth gave a new random user ID every time the app restarted. Every reload looked like a brand new user — Firestore found zero documents and history appeared empty.

Email/password auth gives the same user ID every login — forever. Firestore always finds the right documents.

---

## File 1 — `src/services/firebase.service.ts`

### What Changed

Replaced anonymous auth with full email/password auth. Removed `signInAnon`. Added `registerUser`, `loginUser`, `logoutUser`, `getCurrentUserId`.

### `getAuth(app)` vs `initializeAuth`

We use `getAuth(app)` — the simple version. `initializeAuth` with persistence requires extra packages that caused errors in your Firebase version (12.12.1). `getAuth` works correctly for our use case.

### `getCurrentUserId()`

```ts
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null
}
```

Returns the logged-in user's ID. Returns `null` if nobody is logged in. Every Firebase operation calls this before doing anything — if null, it throws `NOT_AUTHENTICATED` and the operation stops safely.

### How it connects

```
src/services/firebase.service.ts
  ↓ exports
  auth, db, storage       — used by useFirebase.ts and _layout.tsx
  registerUser            — used by login.tsx
  loginUser               — used by login.tsx
  logoutUser              — used by settings.tsx
  getCurrentUserId        — used by useFirebase.ts
```

---

## File 2 — `src/hooks/useFirebase.ts`

### What Changed

Replaced `signInAnon()` with `getCurrentUserId()`. Added `NOT_AUTHENTICATED` error. Used `setDoc` with `merge: true` to prevent duplicates.

### The `saveScan` Logic

```
1. getCurrentUserId()     — get logged-in user ID
2. if no imageUrl yet:
   → fetch image → blob → upload to Storage → get URL
3. setDoc with merge: true — create or update Firestore document
4. addScan to local store  — update UI immediately
```

Step 2 only runs if `imageUrl` is empty. When re-saving an edited scan, the image is already uploaded — we skip the upload entirely and only update the text in Firestore.

### The `fetchScans` Logic

```
1. getCurrentUserId()     — get logged-in user ID
2. if null → return       — not logged in, do nothing
3. getDocs from Firestore — get all user's scans
4. if 0 docs → return     — do not wipe local state
5. convert timestamps     — Firestore Timestamp → ISO string
6. setScans               — replace store with Firebase data
```

The `if (snapshot.docs.length === 0) return` guard is critical. Without it, a slow Firebase response would wipe the local store and show an empty history.

### Timestamp Conversion

```ts
if (data.createdAt && typeof data.createdAt.toDate === 'function') {
  formattedDate = data.createdAt.toDate().toISOString()
}
```

Firestore stores timestamps as a special `Timestamp` object — not a string. `.toDate()` converts it to a JavaScript Date. `.toISOString()` converts that to the string format our app expects. Without this, `.slice(0, 10)` on the History card would crash.

---

## File 3 — `app/login.tsx`

### What This Screen Does

One screen handles both login and registration. A toggle switches between the two modes.

### The `isRegister` toggle

```ts
const [isRegister, setIsRegister] = useState(false)
```

`false` = login mode. `true` = register mode. The same form, the same button, the same submit handler — just different Firebase function called and different labels shown. Keeps the code clean without two separate screens.

### Error handling

```ts
const message =
  err.code === 'auth/user-not-found' ? 'No account found' :
  err.code === 'auth/wrong-password' ? 'Incorrect password' :
  err.code === 'auth/email-already-in-use' ? 'Email already registered' :
  'Something went wrong'
```

Firebase errors have specific codes. We map each code to a friendly message. Without this mapping, the user would see raw Firebase error strings like `Firebase: Error (auth/user-not-found)`.

### After successful login

```ts
router.replace('/')
```

`replace` removes login from the navigation stack. The user lands on the Home tab and cannot navigate back to the login screen with the back button.

### `secureTextEntry`

Hides the password field characters. Shows dots instead of letters. Standard for any password input.

---

## File 4 — `app/_layout.tsx`

### What Changed

Added auth state listener. Redirects to login if not authenticated. Shows spinner while auth state is loading.

### The Two `useEffect` Pattern

```ts
// Effect 1 — listens to Firebase auth changes
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    setIsLoggedIn(!!user)
    setIsReady(true)
  })
  return unsubscribe  // cleanup — stops listening when component unmounts
}, [])

// Effect 2 — redirects based on auth state
useEffect(() => {
  if (!isReady) return
  if (!isLoggedIn) {
    router.replace('/login')
  }
}, [isReady, isLoggedIn])
```

Why two effects instead of one? Putting `router.replace` inside `onAuthStateChanged` caused timing issues — the router was not ready when Firebase fired. Separating into two effects ensures the redirect only happens after everything is initialized.

### The `unsubscribe` return

```ts
return unsubscribe
```

`onAuthStateChanged` returns a function that stops the listener. Returning it from `useEffect` means React calls it automatically when the component unmounts — preventing memory leaks.

### `setIsReady(true)` in `onAuthStateChanged`

Firebase calls `onAuthStateChanged` once immediately when the app starts. `setIsReady(true)` after that first call tells us we know the auth state — safe to redirect. Without this, the app would redirect to login before Firebase has a chance to confirm the user is logged in.

---

## The Complete Auth Flow

```
App opens
  ↓
_layout.tsx mounts
  ↓
onAuthStateChanged fires
  → user exists → setIsLoggedIn(true) → setIsReady(true)
  → no user → setIsLoggedIn(false) → setIsReady(true)
  ↓
Second useEffect fires
  → isLoggedIn = false → router.replace('/login')
  → isLoggedIn = true → stay on current screen
  ↓
Login screen:
  → user registers/logs in → router.replace('/')
  ↓
onAuthStateChanged fires again
  → user now exists → setIsLoggedIn(true)
  ↓
Home screen loads
  ↓
History screen mounts → fetchScans() → loads from Firebase
  ↓
Same user ID every session → always sees their own scans
```

---

## Sprint 5 — Commit Reference

```bash
git add src/services/firebase.service.ts
git commit -m "feat(auth): switch to email/password auth with persistent login"

git add src/hooks/useFirebase.ts
git commit -m "feat(firebase): fix saveScan fetchScans removeScan with auth check"

git add app/login.tsx
git commit -m "feat(auth): add login and register screen"

git add app/_layout.tsx
git commit -m "feat(nav): add auth state listener with redirect to login"

git add "app/(tabs)/settings.tsx"
git commit -m "feat(settings): add sign out button"

git push origin phase/2-firebase
```

---

## Q&A Time

Read through this file. Ask anything about Firebase auth, the two useEffect pattern, the login screen, or anything else before we move to Sprint 6 — Export TXT, PDF, and Share.
