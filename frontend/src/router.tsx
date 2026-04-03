import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LanguagePicker from './worker/LanguagePicker'
import LoginScreen from './worker/LoginScreen'
import WorkerLayout from './worker/WorkerLayout'
import VoiceChat from './worker/VoiceChat'
import TextChat from './worker/TextChat'
import TranslateScreen from './worker/TranslateScreen'
import Settings from './worker/Settings'
import EmployerLogin from './employer/EmployerLogin'
import EmployerLayout from './employer/EmployerLayout'
import Dashboard from './employer/Dashboard'
import WorkerList from './employer/WorkerList'
import DomainConfig from './employer/DomainConfig'
import WorkerHistory from './employer/WorkerHistory'

export const router = createBrowserRouter([
  { path: '/', element: <LanguagePicker /> },
  { path: '/worker/login', element: <LoginScreen /> },
  {
    path: '/worker',
    element: <ProtectedRoute requiredRole="worker"><WorkerLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <VoiceChat /> },
      { path: 'voice', element: <VoiceChat /> },
      { path: 'chat', element: <TextChat /> },
      { path: 'translate', element: <TranslateScreen /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '/employer/login', element: <EmployerLogin /> },
  {
    path: '/employer',
    element: <ProtectedRoute requiredRole="employer"><EmployerLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'workers', element: <WorkerList /> },
      { path: 'config', element: <DomainConfig /> },
      { path: 'workers/:id/history', element: <WorkerHistory /> },
    ],
  },
])
