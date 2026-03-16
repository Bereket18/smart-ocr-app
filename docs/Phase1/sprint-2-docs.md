# Sprint 2 — Documentation

## Files: _layout.tsx · (tabs)/_layout.tsx · index.tsx · history.tsx · settings.tsx

---

## New TypeScript & React Native Terms in This Sprint

---

### `export default function`

Every screen file must have one `export default`. Expo Router reads this and uses it as the screen to render. There can only be one per file.

```ts
export default function HomeScreen() {
  return (...)
}
```

The `default` means: "this is the main thing this file exports." Other files do not need to name it when importing — Expo Router handles that automatically.

---

### Props with a type inline

In Sprint 1 we defined interfaces separately. In small components you can define the type inline directly:

```ts
// Separate interface — used for larger components
interface Props {
  label: string
  danger?: boolean
}

// Inline type — used for small helper components
function SectionHeader({ title }: { title: string }) {
  return <Text>{title}</Text>
}
```

Both are valid. Inline is fine when the component is small and only used in one file.

---

### The `?` on a prop — optional props

```ts
function SettingsRow({ label, value, onPress, danger }: {
  label: string
  value?: string      // ← the ? makes this optional
  onPress?: () => void
  danger?: boolean
}) {}
```

The `?` after the name means the prop is optional. The caller can leave it out and TypeScript will not complain. Inside the component you check if it exists before using it:

```ts
{value && <Text>{value}</Text>}
// Only renders if value is not undefined
```

---

### `[styles.rowLabel, danger && styles.rowLabelDanger]`

This is how you apply multiple styles conditionally in React Native:

```ts
style={[styles.rowLabel, danger && styles.rowLabelDanger]}
```

- `styles.rowLabel` — always applied
- `danger && styles.rowLabelDanger` — only applied if `danger` is true

When `danger` is false, `danger && styles.rowLabelDanger` evaluates to `false`. React Native ignores `false` in a style array.

---

### `{ item }: { item: Scan }`

This pattern appears in the FlatList `renderItem`:

```ts
function renderItem({ item }: { item: Scan }) {
  return <View>...</View>
}
```

FlatList calls `renderItem` and passes an object like `{ item: scan, index: 0 }`. We destructure `item` out of that object. The `: { item: Scan }` tells TypeScript that `item` is a `Scan` object — so we get full autocomplete on `item.editedText`, `item.language`, etc.

---

### `numberOfLines={2}`

A React Native prop on `<Text>` that limits the text to a maximum number of lines. Any overflow is cut off with `...` at the end.

---

### `flexDirection: 'row'`

React Native uses Flexbox for layout. By default everything stacks vertically (`column`). Setting `flexDirection: 'row'` makes children sit side by side horizontally.

```ts
// Vertical stack (default)
<View>
  <Button />   // on top
  <Button />   // below
</View>

// Horizontal row
<View style={{ flexDirection: 'row' }}>
  <Button />   // left
  <Button />   // right
</View>
```

---

### `flex: 1`

Tells a component to take up all available remaining space.

```ts
// cardContent takes all the space, deleteButton only takes what it needs
<View style={{ flexDirection: 'row' }}>
  <View style={{ flex: 1 }}>      {/* takes all remaining width */}
    <Text>Scan text here...</Text>
  </View>
  <TouchableOpacity>              {/* only as wide as the icon */}
    <Text>🗑</Text>
  </TouchableOpacity>
</View>
```

---

---

## File 1 — `app/_layout.tsx`

### What This File Is

The root of the entire navigation tree. Every screen in the app is a child of this layout. It runs once when the app starts and wraps everything else.

### What `Stack` is

A Stack navigator means screens slide in from the right and slide back when you go back — like a stack of cards. This is the standard iOS navigation pattern.

### What each `Stack.Screen` declaration does

```ts
<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
```

This registers the `(tabs)` group with the Stack. `headerShown: false` removes the Stack's header for the tabs — because the tab bar manages its own header for each tab.

```ts
<Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', headerShown: false }} />
```

`presentation: 'fullScreenModal'` makes the camera screen slide UP from the bottom instead of pushing in from the right. This signals to the user that camera is a temporary mode — not a permanent destination.

```ts
<Stack.Screen name="results" options={{ title: 'Results' }} />
```

The results screen pushes in from the right with a "Results" header and an automatic back arrow.

### What `screenOptions` does

`screenOptions` applies to ALL screens in the Stack. Instead of setting the header background color on every single screen, you set it once here and every screen inherits it.

### The `<> </>` wrapper

This is a React Fragment. It lets you return two things (`StatusBar` and `Stack`) without wrapping them in an extra `View`. A `View` adds an actual element to the screen. A Fragment adds nothing — it is invisible.

### How it connects

```
app/_layout.tsx
  ↓ wraps
  app/(tabs)/_layout.tsx  (the tab bar)
  app/camera.tsx          (full screen modal)
  app/results.tsx         (pushed screen)
```

---

## File 2 — `app/(tabs)/_layout.tsx`

### What This File Is

The tab bar configuration. It tells Expo Router: "inside the tabs group, show these three tabs with these icons and labels."

### What `Tabs` is

`Tabs` is Expo Router's tab navigator. It renders the bottom tab bar automatically and switches between screens when the user taps a tab.

### The `TabIcon` helper component

```ts
type IconName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon({ name, color, size }: { name: IconName; color: string; size: number }) {
  return <Ionicons name={name} color={color} size={size} />
}
```

`React.ComponentProps<typeof Ionicons>['name']` is a TypeScript trick that pulls the exact type of the `name` prop from the Ionicons component. This means TypeScript knows every valid icon name and will error if you typo one.

Without this, `name` would just be `string` — you could write `name="not-a-real-icon"` and TypeScript would not catch it.

### `tabBarActiveTintColor` vs `tabBarInactiveTintColor`

- Active = the tab you are currently on → cyan
- Inactive = all other tabs → textSecondary (muted grey)

The color change tells the user which tab they are on without needing a label underneath.

### `tabBarIcon: ({ color, size }) => ...`

Expo Router calls this function automatically and passes `color` (active or inactive color based on which tab is selected) and `size` (calculated based on device). You pass them to the icon so the icon matches.

### How it connects

```
app/(tabs)/_layout.tsx
  ↓ contains
  app/(tabs)/index.tsx     (name="index"   → Home tab)
  app/(tabs)/history.tsx   (name="history" → History tab)
  app/(tabs)/settings.tsx  (name="settings" → Settings tab)
```

---

## File 3 — `app/(tabs)/index.tsx` — Home Screen

### What This File Is

The first screen the user sees. Two states: empty (no scans yet) or recent strip (last 3 scans).

### Reading from the store

```ts
const { scans } = useScanStore()
```

This subscribes the Home screen to the `scans` array in the store. When a scan is added or deleted anywhere in the app, the Home screen automatically re-renders with the updated list.

### The conditional render

```ts
{scans.length === 0 ? (
  <EmptyState />
) : (
  <RecentStrip />
)}
```

The ternary checks if scans is empty. First launch: shows the empty state illustration. After scanning: shows the recent strip. Same component, different content depending on state.

### `scans.slice(0, 3)`

`slice(0, 3)` returns a new array containing only the first 3 items. The home screen only shows the 3 most recent scans — not the full history. The full list is on the History tab.

### `scan.createdAt.slice(0, 10)`

`createdAt` is stored as a full ISO date string: `"2026-03-16T09:41:00.000Z"`. `slice(0, 10)` cuts it down to just the date part: `"2026-03-16"`. Simple and readable.

### `router.push('/camera')` vs `router.push({ pathname: '/camera', params: { mode: 'gallery' } })`

Both navigate to the camera screen. The second version passes a `mode` parameter. The camera screen will read this parameter and open the gallery picker directly instead of the camera. This is how you pass data between screens in Expo Router.

### How it connects

```
app/(tabs)/index.tsx
  ↓ reads from
  useScanStore() — the scans array
  ↓ navigates to
  app/camera.tsx — when Scan Now is tapped
  app/(tabs)/history.tsx — when a recent card is tapped
```

---

## File 4 — `app/(tabs)/history.tsx` — History Screen

### What This File Is

The full list of all saved scans. Uses `FlatList` for performance. Each card taps to open the scan and swipes/taps to delete.

### Why FlatList and not ScrollView + map

```ts
// Bad — renders ALL 1000 scans at once, even ones not visible
<ScrollView>
  {scans.map(scan => <ScanCard />)}
</ScrollView>

// Good — only renders the scans currently visible on screen
<FlatList
  data={scans}
  renderItem={renderItem}
/>
```

FlatList is virtualized. If you have 500 scans, it only renders the 10 or so currently visible on screen. As you scroll, it renders more and removes the ones that go off screen. This is critical for performance.

### `keyExtractor={(item) => item.id}`

FlatList needs a unique key for each item so React can track which items were added, removed, or changed. Without this, React re-renders the entire list on every change instead of just the changed items.

### `ListEmptyComponent={renderEmpty}`

When `data` is an empty array, FlatList renders this component instead of the list. Clean way to handle the empty state.

### `{ item }: { item: Scan }`

FlatList passes `{ item, index, separators }` to `renderItem`. We only need `item`. The TypeScript annotation `: { item: Scan }` tells TypeScript the shape of what FlatList passes — so we get full type safety on `item.id`, `item.editedText`, etc.

### The delete flow

```
User taps 🗑 icon
  → handleDelete(item.id) is called
  → Alert.alert() shows a confirmation dialog
  → User taps "Delete"
  → deleteScan(id) is called
  → Zustand updates the scans array
  → FlatList automatically re-renders
  → Item disappears from the list
```

The confirmation dialog (`Alert.alert`) prevents accidental deletes. The destructive style makes the "Delete" button red on iOS automatically.

### `handlePress` — opening a scan

```ts
function handlePress(scan: Scan) {
  setActiveScan(scan)
  router.push('/results')
}
```

Two steps: first store the selected scan in `activeScan` in the store. Then navigate to the results screen. The results screen reads `activeScan` from the store to know which scan to display.

### How it connects

```
app/(tabs)/history.tsx
  ↓ reads from
  useScanStore() — scans array
  ↓ calls
  useScanStore() — deleteScan, setActiveScan
  ↓ navigates to
  app/results.tsx — when a scan card is tapped
```

---

## File 5 — `app/(tabs)/settings.tsx` — Settings Screen

### What This File Is

App preferences. Grouped list with section headers. Currently most rows are placeholders — they will become interactive in Phase 2 and 4.

### The two helper components

**`SectionHeader`** — renders the cyan uppercase group label (APPEARANCE, ACCOUNT, etc.)

**`SettingsRow`** — a single tappable row with a label on the left and optional value on the right. The `danger` prop makes the label red — used for destructive actions like Clear All History.

Why define these as separate components inside the same file?

Because they are only used in this file. If they were needed elsewhere, they would move to `src/components/`. Keeping them here avoids creating unnecessary files while still keeping the JSX clean and readable.

### `disabled={!onPress}`

If no `onPress` is provided (for the placeholder rows), the row is not tappable. `!onPress` evaluates to `true` when `onPress` is undefined, which disables the touch.

### The clear history flow

```ts
function handleClearHistory() {
  Alert.alert(
    'Clear All History',
    `This will permanently delete all ${scans.length} scans...`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => clearAllScans() },
    ]
  )
}
```

Template literal `` `...${scans.length}...` `` inserts the actual number of scans into the warning message. The user sees "delete all 12 scans" — not a generic message.

### How it connects

```
app/(tabs)/settings.tsx
  ↓ reads from
  useScanStore() — scans.length (for the warning message)
  ↓ calls
  useScanStore() — clearAllScans
```

---

## How All 5 Files Connect

```
app/_layout.tsx
  — the root, wraps everything
  — registers camera as a modal, results as a push screen
        ↓
app/(tabs)/_layout.tsx
  — the tab bar
  — registers index, history, settings as tabs
        ↓
app/(tabs)/index.tsx      reads scans, navigates to camera
app/(tabs)/history.tsx    reads scans, deletes scans, opens results
app/(tabs)/settings.tsx   reads scans.length, clears all scans
```

All three tab screens read from the same Zustand store. When any screen changes the store — all other screens that read it update automatically.

---

## Sprint 2 — Commit Reference

```bash
git add app/_layout.tsx
git commit -m "feat(nav): add root Stack layout with dark theme header"

git add "app/(tabs)/_layout.tsx"
git commit -m "feat(nav): add tab bar with Home History Settings tabs"

git add "app/(tabs)/index.tsx"
git commit -m "feat(home): add Home screen with Scan Now button and empty state"

git add "app/(tabs)/history.tsx"
git commit -m "feat(history): add History screen with FlatList and delete"

git add "app/(tabs)/settings.tsx"
git commit -m "feat(settings): add Settings screen with clear history action"

git push origin phase/1-core-ocr
```

---

## Q&A Time

Read through this file. Then come back and ask anything that is unclear — about Flexbox, FlatList, navigation, props, or anything else before we move to Sprint 3.
