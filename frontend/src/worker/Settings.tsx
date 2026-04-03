import { useTranslation } from 'react-i18next'
import { useDialectStore } from '../store/dialect'
import i18n from '../i18n'

const DIALECTS = [
  { code: 'kn-north', label: 'ಉತ್ತರ ಕರ್ನಾಟಕ', lang: 'kn' },
  { code: 'kn-coastal', label: 'ಕರಾವಳಿ ಕನ್ನಡ', lang: 'kn' },
  { code: 'kn-bengaluru', label: 'ಬೆಂಗಳೂರು ಕನ್ನಡ', lang: 'kn' },
  { code: 'te-coastal-ap', label: 'కోస్తా ఆంధ్ర', lang: 'te' },
  { code: 'te-rayalaseema', label: 'రాయలసీమ', lang: 'te' },
  { code: 'te-north-ap', label: 'ఉత్తరాంధ్ర', lang: 'te' },
  { code: 'te-hyderabad', label: 'హైదరాబాద్', lang: 'te' },
  { code: 'te-north-tg', label: 'ఉత్తర తెలంగాణ', lang: 'te' },
  { code: 'te-south-tg', label: 'దక్షిణ తెలంగాణ', lang: 'te' },
  { code: 'ta-chennai', label: 'சென்னை தமிழ்', lang: 'ta' },
  { code: 'ta-west', label: 'மேற்கு தமிழ்', lang: 'ta' },
  { code: 'ta-south', label: 'தென் தமிழ்', lang: 'ta' },
]

export default function Settings() {
  const { t } = useTranslation()
  const { dialectCode, ttsSpeed, setDialect, setTtsSpeed } = useDialectStore()

  const handleDialectChange = (code: string) => {
    const d = DIALECTS.find((x) => x.code === code)
    if (!d) return
    setDialect(d.code, d.lang)
    localStorage.setItem('vaakya_lang', d.lang)
    i18n.changeLanguage(d.lang)
  }

  return (
    <div className="min-h-full bg-gray-950 p-6 flex flex-col gap-6">
      <h2 className="text-white text-2xl font-bold">{t('settings')}</h2>
      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-lg">{t('dialect')}</label>
        <select value={dialectCode} onChange={(e) => handleDialectChange(e.target.value)}
          className="bg-gray-800 text-white text-xl p-4 rounded-xl">
          {DIALECTS.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-lg">{t('speed')}: {ttsSpeed}x</label>
        <input type="range" min={0.5} max={2} step={0.1} value={ttsSpeed}
          onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
          className="w-full accent-indigo-500" />
      </div>
    </div>
  )
}
