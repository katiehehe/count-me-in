import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  )
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Copy .env.example to .env and add your credentials.')
  }
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp())
  return auth
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    // Force long polling: the default WebChannel/streaming transport can hang
    // indefinitely behind some networks, mobile carriers, proxies, VPNs, and
    // ad blockers — which presents as a sign-in "freeze". Forcing long polling
    // uses plain HTTP requests that work reliably everywhere.
    db = initializeFirestore(getFirebaseApp(), {
      experimentalForceLongPolling: true,
      // IndexedDB-backed cache: buffers reads and, crucially, queues writes made
      // while offline (or during a network blip) and flushes them automatically
      // on reconnect, so a learner's answers aren't silently lost. The multi-tab
      // manager keeps state consistent across tabs. If the browser can't provide
      // persistence (private mode / unsupported), Firestore degrades to
      // online-only on its own without throwing.
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  }
  return db
}
