import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(
  app,
  'gs://netflix-replica-02.firebasestorage.app'
)

export async function registerUser(
  email: string,
  password: string
): Promise<string> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  return credential.user.uid
}

export async function loginUser(
  email: string,
  password: string
): Promise<string> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user.uid
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}

export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null
}