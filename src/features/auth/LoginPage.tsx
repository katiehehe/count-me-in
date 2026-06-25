import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'

export function LoginPage() {
  const { user, loading, firebaseConfigured, authError, signInWithGoogle, signInAnonymously } =
    useAuth()
  const location = useLocation()
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  const from = (location.state as { from?: string })?.from ?? '/course'

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (user) return <Navigate to={from} replace />

  const handleGoogle = async () => {
    setSigningIn(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch {
      setError('Google sign-in failed. Try again or use demo mode.')
    }
    setSigningIn(false)
  }

  const handleAnonymous = async () => {
    setSigningIn(true)
    setError('')
    try {
      await signInAnonymously()
    } catch {
      setError('Sign-in failed. Check your Firebase configuration.')
    }
    setSigningIn(false)
  }

  if (!firebaseConfigured) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <h1 className="text-h3">Firebase not configured</h1>
          <p className="mt-2 text-sm text-slate-600">
            Copy <code className="rounded bg-slate-100 px-1">.env.example</code> to{' '}
            <code className="rounded bg-slate-100 px-1">.env</code> and add your Firebase project credentials.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-h2">Welcome to Count Me In</h1>
        <p className="mt-2 text-slate-600">Sign in to save your progress and streaks.</p>
      </div>

      <Card className="space-y-4">
        <Button onClick={handleGoogle} disabled={signingIn} className="w-full" size="lg">
          Continue with Google
        </Button>
        <Button
          onClick={handleAnonymous}
          disabled={signingIn}
          variant="secondary"
          className="w-full"
          size="lg"
        >
          Try demo (anonymous)
        </Button>
        {(error || authError) && (
          <p className="text-center text-sm text-error-700">{error || authError}</p>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/" className="text-brand-600 hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}
