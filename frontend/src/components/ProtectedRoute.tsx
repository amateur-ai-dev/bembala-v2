import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

interface Props {
  children: React.ReactNode
  requiredRole?: 'worker' | 'employer'
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { token, role } = useAuthStore()
  if (!token) return <Navigate to="/worker/login" replace />
  if (requiredRole && role !== requiredRole) return <Navigate to="/worker/login" replace />
  return <>{children}</>
}
