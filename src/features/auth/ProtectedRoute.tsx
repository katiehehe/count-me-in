import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function useAuthGuard() {
  const { user, loading, firebaseConfigured } = useAuth()
  const location = useLocation()

  if (!firebaseConfigured) return { allowed: false, reason: 'config' as const }
  if (loading) return { allowed: false, reason: 'loading' as const }
  if (!user) return { allowed: false, reason: 'auth' as const, from: location.pathname }
  return { allowed: true as const }
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const guard = useAuthGuard()

  if (guard.reason === 'config') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Firebase not configured</h1>
        <p className="mt-2 text-slate-600">
          Copy <code className="rounded bg-slate-200 px-1">.env.example</code> to{' '}
          <code className="rounded bg-slate-200 px-1">.env</code> and add your Firebase credentials.
        </p>
      </div>
    )
  }

  if (guard.reason === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (guard.reason === 'auth') {
    return <Navigate to="/login" state={{ from: guard.from }} replace />
  }

  return <>{children}</>
}

export function DisplayNamePrompt() {
  const { user, profile, setDisplayName } = useAuth()
  const [name, setName] = useState(profile?.displayName ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.displayName) setName(profile.displayName)
  }, [profile?.displayName])

  const needsName =
    user &&
    profile &&
    (!profile.displayName || profile.displayName === 'Learner') &&
    !user.displayName

  if (!needsName) return null

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await setDisplayName(name.trim())
    setSaving(false)
  }

  return (
    <div className="border-b border-brand-200 bg-brand-50 px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center">
        <p className="text-sm text-brand-800">What should we call you?</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
          placeholder="Your name"
        />
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  )
}
