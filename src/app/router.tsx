/* This is the route config, not a component module, so React Fast Refresh's
   only-export-components rule doesn't apply to the lazy() page definitions. */
/* eslint-disable react/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter, useParams } from 'react-router-dom'
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

// Keying on the lesson id forces a full remount when navigating directly from one
// lesson to the next (same route). Without this, LessonPage keeps the course
// progress it read on first mount, so a just-completed lesson still looks locked
// and the unlock guard wrongly bounces "Next lesson" back to the course page.
function LessonRoute() {
  const { lessonId } = useParams<{ lessonId: string }>()
  return <LessonPage key={lessonId} />
}

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
            <LessonRoute />
          </ProtectedRoute>
        ),
      },
    ],
  },
])
