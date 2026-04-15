import { useNavigate } from 'react-router-dom'
import i18n from '../i18n'
import { useDialectStore } from '../store/dialect'

const LANGUAGES = [
  {
    code: 'kn',
    defaultDialect: 'kn-bengaluru',
    script: 'ಕನ್ನಡ',
    roman: 'Kannada',
    region: 'Karnataka',
    bg: 'from-yellow-900/30 to-yellow-800/10',
  },
  {
    code: 'te',
    defaultDialect: 'te-hyderabad',
    script: 'తెలుగు',
    roman: 'Telugu',
    region: 'Andhra · Telangana',
    bg: 'from-orange-900/30 to-orange-800/10',
  },
  {
    code: 'ta',
    defaultDialect: 'ta-chennai',
    script: 'தமிழ்',
    roman: 'Tamil',
    region: 'Tamil Nadu',
    bg: 'from-red-900/30 to-red-800/10',
  },
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
    <div className="min-h-screen bg-app flex flex-col">
      {/* Header */}
      <div className="px-6 pt-14 pb-8">
        <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center mb-6">
          <span className="text-white text-xl font-bold">V</span>
        </div>
        <h1 className="text-app text-3xl font-bold tracking-tight">Vaakya</h1>
        <p className="text-muted text-base mt-1">ಯಾವ ಭಾಷೆ? · ఏ భాష? · எந்த மொழி?</p>
      </div>

      {/* Language cards */}
      <div className="flex-1 px-4 flex flex-col gap-3 pb-8">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => pick(lang)}
            className={`w-full bg-gradient-to-br ${lang.bg} bg-surface border border-app rounded-2xl px-5 py-5 text-left active:scale-[0.98] transition-transform`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-app text-3xl font-bold leading-tight">{lang.script}</p>
                <p className="text-muted text-sm mt-0.5">{lang.roman} · {lang.region}</p>
              </div>
              <div className="w-9 h-9 rounded-full border border-app flex items-center justify-center">
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
