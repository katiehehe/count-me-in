import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '../../firebase/firebaseClient'
import { ensureUserProfile, getUserProfile, updateDisplayName } from '../progress/progressService'
import type { UserProfile } from '../../firebase/firestoreTypes'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  firebaseConfigured: boolean
  authError: string | null
  signInWithGoogle: () => Promise<void>
  signInAnonymously: () => Promise<void>
  signOut: () => Promise<void>
  setDisplayName: (name: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const firebaseConfigured = isFirebaseConfigured()

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false)
      return
    }

    const auth = getFirebaseAuth()

    // Complete any pending redirect sign-in. On the redirect path the error lands
    // here after a full page reload — long after the click handler's try/catch is
    // gone — so without this the failure would be silently swallowed and the user
    // would just be bounced back to the login screen with no explanation.
    getRedirectResult(auth).catch((err) => {
      console.error('Google redirect sign-in failed:', err)
      setAuthError('Google sign-in failed. Try again or use demo mode.')
    })

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      // Never block the UI on Firestore. As soon as auth state is known the app
      // is usable; the profile (streak/display name) loads in the background and
      // populates when it arrives. This prevents a slow/blocked Firestore call
      // from ever freezing the sign-in screen.
      setLoading(false)

      if (firebaseUser) {
        setAuthError(null)
        ensureUserProfile(
          firebaseUser.uid,
          firebaseUser.displayName || 'Learner',
          firebaseUser.email ?? undefined,
        )
          .then((p) => setProfile(p))
          .catch((err) => {
            console.error('Failed to load user profile from Firestore:', err)
          })
      } else {
        setProfile(null)
      }
    })
    return unsub
  }, [firebaseConfigured])

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      // Popups are blocked or unsupported in many mobile/in-app browsers and can
      // silently hang. Fall back to a full-page redirect, which works everywhere.
      const code = (err as { code?: string })?.code ?? ''
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, provider)
        return
      }
      throw err
    }
  }, [])

  const signInAnonymouslyFn = useCallback(async () => {
    const auth = getFirebaseAuth()
    await signInAnonymously(auth)
  }, [])

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth()
    await firebaseSignOut(auth)
  }, [])

  const setDisplayName = useCallback(
    async (name: string) => {
      if (!user) return
      await updateDisplayName(user.uid, name)
      const p = await getUserProfile(user.uid)
      setProfile(p)
    },
    [user],
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const p = await getUserProfile(user.uid)
    setProfile(p)
  }, [user])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      firebaseConfigured,
      authError,
      signInWithGoogle,
      signInAnonymously: signInAnonymouslyFn,
      signOut,
      setDisplayName,
      refreshProfile,
    }),
    [user, profile, loading, firebaseConfigured, authError, signInWithGoogle, signInAnonymouslyFn, signOut, setDisplayName, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The auth hook is intentionally colocated with its provider; it's a hook, not a
// component, so React Fast Refresh's only-export-components rule doesn't apply.
// eslint-disable-next-line react/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
