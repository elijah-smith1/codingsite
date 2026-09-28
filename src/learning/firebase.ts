import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const emulator = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
const cloud = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
export const firebaseMode = emulator ? 'emulator' : 'cloud'
const configured = emulator || Object.values(cloud).every(Boolean)
const app = configured ? initializeApp(emulator ? {
  apiKey: 'demo-codebloom-key', authDomain: 'demo-codebloom.firebaseapp.com',
  projectId: 'demo-codebloom', appId: 'demo-codebloom-app',
} : cloud) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
if (emulator && auth && db) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
