import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { translateText } from '../api/client'
import { useDialectStore } from '../store/dialect'

const LANG_OPTIONS = [
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'en', label: 'English' },
]

export default function TranslateScreen() {
  const { t } = useTranslation()
  const { language } = useDialectStore()
  const [sourceLang, setSourceLang] = useState(language)
  const [targetLang, setTargetLang] = useState('en')
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTranslate = async () => {
    if (!inputText.trim()) return
    setLoading(true)
    try {
      const res = await translateText(inputText, sourceLang, targetLang)
      setResult(res.data.translated_text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-gray-950 p-4 flex flex-col gap-4">
      <h2 className="text-white text-2xl font-bold text-center">{t('translate')}</h2>
      <div className="flex gap-2">
        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}
          className="flex-1 bg-gray-800 text-white p-3 rounded-xl text-lg">
          {LANG_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <span className="text-white text-2xl self-center">→</span>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
          className="flex-1 bg-gray-800 text-white p-3 rounded-xl text-lg">
          {LANG_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      <textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
        placeholder={t('type_message')} rows={4}
        className="bg-gray-800 text-white text-xl p-4 rounded-xl" />
      <button onClick={handleTranslate} disabled={loading || !inputText.trim()}
        className="bg-indigo-600 text-white text-xl font-bold py-4 rounded-2xl disabled:opacity-50">
        {loading ? t('loading') : t('translate')}
      </button>
      {result && <div className="bg-gray-800 rounded-xl p-4"><p className="text-white text-xl">{result}</p></div>}
    </div>
  )
}
