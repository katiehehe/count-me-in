import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../features/auth/LoginPage'
import { CoursePage } from '../features/course/CoursePage'
import { LessonPage } from '../features/lesson/LessonPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'

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
