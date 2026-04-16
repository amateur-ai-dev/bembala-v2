import { useTranslation } from 'react-i18next'
import { useDialectStore } from '../store/dialect'
import { useAuthStore } from '../store/auth'
import i18n from '../i18n'
import { useNavigate } from 'react-router-dom'

const DIALECTS = [
  { code: 'kn-north',      label: 'ಉತ್ತರ ಕರ್ನಾಟಕ',   lang: 'kn', sub: 'North Karnataka' },
  { code: 'kn-coastal',    label: 'ಕರಾವಳಿ ಕನ್ನಡ',     lang: 'kn', sub: 'Coastal Karnataka' },
  { code: 'kn-bengaluru',  label: 'ಬೆಂಗ್ಳೂರು',         lang: 'kn', sub: 'Bengaluru' },
  { code: 'te-coastal-ap', label: 'కోస్తా ఆంధ్ర',       lang: 'te', sub: 'Coastal AP' },
  { code: 'te-rayalaseema',label: 'రాయలసీమ',           lang: 'te', sub: 'Rayalaseema' },
  { code: 'te-north-ap',   label: 'ఉత్తరాంధ్ర',         lang: 'te', sub: 'North AP' },
  { code: 'te-hyderabad',  label: 'హైదరాబాద్',         lang: 'te', sub: 'Hyderabad' },
  { code: 'te-north-tg',   label: 'ఉత్తర తెలంగాణ',      lang: 'te', sub: 'North Telangana' },
  { code: 'te-south-tg',   label: 'దక్షిణ తెలంగాణ',     lang: 'te', sub: 'South Telangana' },
  { code: 'ta-chennai',    label: 'சென்னை',             lang: 'ta', sub: 'Chennai' },
  { code: 'ta-west',       label: 'மேற்கு தமிழ்',       lang: 'ta', sub: 'Western Tamil Nadu' },
  { code: 'ta-south',      label: 'தென் தமிழ்',          lang: 'ta', sub: 'South Tamil Nadu' },
]

const GROUPS = [
  { lang: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' },
  { lang: 'te', label: 'తెలుగు', sub: 'Telugu' },
  { lang: 'ta', label: 'தமிழ்', sub: 'Tamil' },
]

export default function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { dialectCode, language, ttsSpeed, setDialect, setTtsSpeed } = useDialectStore()
  const logout = useAuthStore((s) => s.logout)
  const phone = useAuthStore((s) => s.phone)

  const handleDialectChange = (code: string) => {
    const d = DIALECTS.find((x) => x.code === code)
    if (!d) return
    setDialect(d.code, d.lang)
    localStorage.setItem('vaakya_lang', d.lang)
    i18n.changeLanguage(d.lang)
  }

  const handleLogout = () => {
    logout()
    localStorage.removeItem('vaakya_lang')
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Top bar */}
      <div className="flex-shrink-0 px-4 pt-12 pb-3 bg-surface border-b border-app">
        <p className="text-app font-semibold text-base">{t('settings')}</p>
      </div>

      <div className="flex-1 overflow-auto px-4 py-5 flex flex-col gap-6">
        {/* Account */}
        <section>
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">Account</p>
          <div className="bg-surface border border-app rounded-2xl px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-app font-semibold">{phone || '—'}</p>
              <p className="text-muted text-sm">Worker</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-500 text-sm font-medium"
            >
              {t('logout')}
            </button>
          </div>
        </section>

        {/* Dialect */}
        <section>
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-3">{t('dialect')}</p>
          <div className="flex flex-col gap-4">
            {GROUPS.filter((g) => g.lang === language).map((g) => (
              <div key={g.lang}>
                <p className="text-muted text-xs mb-2">{g.label} · {g.sub}</p>
                <div className="flex flex-col gap-1">
                  {DIALECTS.filter((d) => d.lang === g.lang).map((d) => (
                    <button
                      key={d.code}
                      onClick={() => handleDialectChange(d.code)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
                        dialectCode === d.code
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'bg-surface border-app text-app'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-base">{d.label}</p>
                        <p className={`text-xs ${dialectCode === d.code ? 'text-white/70' : 'text-muted'}`}>{d.sub}</p>
                      </div>
                      {dialectCode === d.code && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TTS Speed */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-muted text-xs font-medium uppercase tracking-wide">{t('speed')}</p>
            <p className="text-app text-sm font-semibold">{ttsSpeed}x</p>
          </div>
          <input
            type="range" min={0.5} max={2} step={0.1}
            value={ttsSpeed}
            onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
            className="w-full accent-brand-600"
          />
          <div className="flex justify-between text-muted text-xs mt-1">
            <span>0.5x</span><span>1x</span><span>2x</span>
          </div>
        </section>
      </div>
    </div>
  )
}
