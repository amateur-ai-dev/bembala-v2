import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function EmployerLayout() {
  const logout = useAuthStore((s) => s.logout)
  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-56 bg-gray-900 flex flex-col p-4 gap-2">
        <h2 className="text-white text-xl font-bold mb-4">Vaakya</h2>
        {[
          { to: '/employer', label: '📊 Dashboard' },
          { to: '/employer/workers', label: '👷 Workers' },
          { to: '/employer/config', label: '⚙️ Domain Config' },
        ].map((link) => (
          <NavLink key={link.to} to={link.to} end
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`
            }>
            {link.label}
          </NavLink>
        ))}
        <button onClick={logout} className="mt-auto text-gray-500 hover:text-white text-sm text-left px-3">
          Logout
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-6"><Outlet /></main>
    </div>
  )
}
