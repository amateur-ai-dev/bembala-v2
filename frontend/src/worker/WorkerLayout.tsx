import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function WorkerLayout() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-auto"><Outlet /></main>
      <nav className="flex justify-around bg-gray-900 text-white py-3">
        <NavLink to="/worker/voice" className="flex flex-col items-center text-xs gap-1">
          <span className="text-2xl">🎙️</span>{t('voice')}
        </NavLink>
        <NavLink to="/worker/chat" className="flex flex-col items-center text-xs gap-1">
          <span className="text-2xl">💬</span>{t('chat')}
        </NavLink>
        <NavLink to="/worker/translate" className="flex flex-col items-center text-xs gap-1">
          <span className="text-2xl">🔄</span>{t('translate')}
        </NavLink>
        <NavLink to="/worker/settings" className="flex flex-col items-center text-xs gap-1">
          <span className="text-2xl">⚙️</span>{t('settings')}
        </NavLink>
      </nav>
    </div>
  )
}
