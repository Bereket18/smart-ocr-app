import { useState } from 'react'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { db, storage, getCurrentUserId } from '../services/firebase.service'
import { useScanStore } from '../store/scanStore'
import { Scan } from '../types/index'

export function useFirebase() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function saveScan(scan: Scan): Promise<void> {
    try {
      setIsUploading(true)
      setError(null)
      setUploadProgress(0)

      const userId = getCurrentUserId()
      if (!userId) throw new Error('NOT_AUTHENTICATED')

      let imageUrl = scan.imageUrl

      if (!imageUrl && scan.imageUri) {
        const response = await fetch(scan.imageUri)
        const blob = await response.blob()
        setUploadProgress(0.3)

        const imageRef = ref(storage, `users/${userId}/scans/${scan.id}.jpg`)
        await uploadBytes(imageRef, blob)
        setUploadProgress(0.6)

        imageUrl = await getDownloadURL(imageRef)
        setUploadProgress(0.8)
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

      setUploadProgress(1)

      const updatedScan: Scan = {
        ...scan,
        imageUrl: imageUrl ?? '',
        synced: true,
        createdAt: new Date().toISOString(),
      }

      useScanStore.getState().addScan(updatedScan)

    } catch (err: any) {
      console.log('Save error:', err.message)
      setError(err.message ?? 'SAVE_FAILED')
    } finally {
      setIsUploading(false)
    }
  }

  async function fetchScans(): Promise<void> {
    try {
      setError(null)
      const userId = getCurrentUserId()
      if (!userId) return

      const snapshot = await getDocs(
        collection(db, 'users', userId, 'scans')
      )

      if (snapshot.docs.length === 0) return

      const fetchedScans: Scan[] = snapshot.docs.map((document) => {
        const data = document.data()
        let formattedDate = new Date().toISOString()
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          formattedDate = data.createdAt.toDate().toISOString()
        }
        return {
          ...(data as Scan),
          id: document.id,
          createdAt: formattedDate,
          synced: true,
        }
      })

      useScanStore.getState().setScans(fetchedScans)

    } catch (err: any) {
      console.log('Fetch error:', err.message)
      setError(err.message ?? 'FETCH_FAILED')
    }
  }

  async function removeScan(scan: Scan): Promise<void> {
    try {
      setError(null)
      const userId = getCurrentUserId()
      if (!userId) throw new Error('NOT_AUTHENTICATED')

      await deleteDoc(doc(db, 'users', userId, 'scans', scan.id))

      if (scan.imageUrl) {
        const imageRef = ref(storage, `users/${userId}/scans/${scan.id}.jpg`)
        await deleteObject(imageRef)
      }

      useScanStore.getState().deleteScan(scan.id)

    } catch (err: any) {
      console.log('Delete error:', err.message)
      setError(err.message ?? 'DELETE_FAILED')
    }
  }

  return {
    saveScan,
    fetchScans,
    removeScan,
    isUploading,
    uploadProgress,
    error,
  }
}