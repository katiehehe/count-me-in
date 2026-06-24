/* This is the route config, not a component module, so React Fast Refresh's
   only-export-components rule doesn't apply to the lazy() page definitions. */
/* eslint-disable react/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'

// Route-level code splitting: each page (and the heavy lesson/simulation code it
// pulls in) loads on demand, so the landing/login first paint no longer ships
// the entire course. Firebase still loads eagerly via AuthProvider.
const LandingPage = lazy(() =>
  import('../pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const LoginPage = lazy(() =>
  import('../features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const CoursePage = lazy(() =>
  import('../features/course/CoursePage').then((m) => ({ default: m.CoursePage })),
)
const LessonPage = lazy(() =>
  import('../features/lesson/LessonPage').then((m) => ({ default: m.LessonPage })),
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      {
        path: 'course',
        element: (
          <ProtectedRoute>
            <CoursePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'lesson/:lessonId',
        element: (
          <ProtectedRoute>
            <LessonPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
])
