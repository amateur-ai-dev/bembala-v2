import { useNavigate } from 'react-router-dom'
import i18n from '../i18n'
import { useDialectStore } from '../store/dialect'

const LANGUAGES = [
  { code: 'kn', label: 'ಕನ್ನಡ', defaultDialect: 'kn-bengaluru', flag: '🟡' },
  { code: 'te', label: 'తెలుగు', defaultDialect: 'te-hyderabad', flag: '🟠' },
  { code: 'ta', label: 'தமிழ்', defaultDialect: 'ta-chennai', flag: '🔴' },
]

export default function LanguagePicker() {
  const navigate = useNavigate()
  const setDialect = useDialectStore((s) => s.setDialect)

  const pick = (lang: typeof LANGUAGES[0]) => {
    localStorage.setItem('vaakya_lang', lang.code)
    i18n.changeLanguage(lang.code)
    setDialect(lang.defaultDialect, lang.code)
    navigate('/worker/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-white text-3xl font-bold text-center">Vaakya</h1>
      <p className="text-gray-400 text-center text-lg">ನಿಮ್ಮ ಭಾಷೆ / మీ భాష / உங்கள் மொழி</p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => pick(lang)}
            className="flex items-center gap-4 bg-gray-800 text-white text-2xl font-semibold rounded-2xl px-6 py-5 active:bg-gray-700 transition-colors"
          >
            <span className="text-4xl">{lang.flag}</span>
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  )
}
