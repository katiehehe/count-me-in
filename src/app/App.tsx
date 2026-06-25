import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '../features/auth/AuthProvider'
import { ErrorBoundary } from './ErrorBoundary'
import { router } from './router'
import { useSuppressBottomOverscroll } from './useSuppressBottomOverscroll'

export function App() {
  // Keep the native top pull-to-refresh, but block only the bottom rubber-band.
  useSuppressBottomOverscroll()

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  )
}
