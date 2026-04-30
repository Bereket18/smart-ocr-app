import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { Scan } from '../types/index'
import { useScanStore } from '../store/scanStore'
import { getCurrentUserId } from '../services/firebase.service'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../services/firebase.service'

const PENDING_KEY = 'smartocr_pending_scans'

export async function saveToLocalDB(scan: Scan): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(PENDING_KEY)
    const pending: Scan[] = existing ? JSON.parse(existing) : []
    const updated = [...pending.filter((s) => s.id !== scan.id), scan]
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(updated))
  } catch (err: any) {
    console.log('Local save error:', err.message)
  }
}

async function syncPendingScans(): Promise<void> {
  const userId = getCurrentUserId()
  if (!userId) return

  try {
    const existing = await AsyncStorage.getItem(PENDING_KEY)
    if (!existing) return

    const pending: Scan[] = JSON.parse(existing)
    if (pending.length === 0) return

    const remaining: Scan[] = []

    for (const scan of pending) {
      try {
        let imageUrl = scan.imageUrl

        if (!imageUrl && scan.imageUri) {
          const response = await fetch(scan.imageUri)
          const blob = await response.blob()
          const imageRef = ref(storage, `users/${userId}/scans/${scan.id}.jpg`)
          await uploadBytes(imageRef, blob)
          imageUrl = await getDownloadURL(imageRef)
        }

        await setDoc(
          doc(db, 'users', userId, 'scans', scan.id),
          {
            ...scan,
            imageUrl: imageUrl ?? '',
            synced: true,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        )

        useScanStore.getState().setScans(
          useScanStore.getState().scans.map((s) =>
            s.id === scan.id ? { ...s, synced: true } : s
          )
        )

        console.log('Synced offline scan:', scan.id)
      } catch (err: any) {
        console.log('Failed to sync scan:', scan.id, err.message)
        remaining.push(scan)
      }
    }

    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining))

  } catch (err: any) {
    console.log('Sync error:', err.message)
  }
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  async function loadPendingCount() {
    try {
      const existing = await AsyncStorage.getItem(PENDING_KEY)
      const pending: Scan[] = existing ? JSON.parse(existing) : []
      setPendingCount(pending.length)
    } catch {
      setPendingCount(0)
    }
  }

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = state.isConnected === true
      setIsOnline(online)

      if (online) {
        console.log('Back online — syncing pending scans...')
        await syncPendingScans()
        await loadPendingCount()
      }
    })

    loadPendingCount()

    return unsubscribe
  }, [])

  return { isOnline, pendingCount }
}