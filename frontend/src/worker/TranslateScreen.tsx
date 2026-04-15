import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { translateText } from '../api/client'
import { useDialectStore } from '../store/dialect'

const LANG_OPTIONS = [
  { code: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' },
  { code: 'te', label: 'తెలుగు', sub: 'Telugu' },
  { code: 'ta', label: 'தமிழ்', sub: 'Tamil' },
  { code: 'en', label: 'English', sub: 'English' },
]

export default function TranslateScreen() {
  const { t } = useTranslation()
  const { language } = useDialectStore()
  const [sourceLang, setSourceLang] = useState(language)
  const [targetLang, setTargetLang] = useState('en')
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const swap = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setInputText(result)
    setResult(inputText)
  }

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

  const sourceLangObj = LANG_OPTIONS.find((l) => l.code === sourceLang)
  const targetLangObj = LANG_OPTIONS.find((l) => l.code === targetLang)

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Top bar */}
      <div className="flex-shrink-0 px-4 pt-12 pb-3 bg-surface border-b border-app">
        <p className="text-app font-semibold text-base">{t('translate')}</p>
      </div>

      <div className="flex-1 overflow-auto px-4 py-5 flex flex-col gap-4">
        {/* Language selector row */}
        <div className="flex items-center gap-2">
          {/* Source */}
          <div className="flex-1">
            <p className="text-muted text-xs mb-1.5 font-medium uppercase tracking-wide">{t('from')}</p>
            <div className="flex flex-col gap-1">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setSourceLang(l.code)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium border transition-colors ${
                    sourceLang === l.code
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-surface border-app text-app'
                  }`}
                >
                  <span className="text-base">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Swap */}
          <button
            onClick={swap}
            className="flex-shrink-0 w-9 h-9 rounded-full border border-app bg-surface flex items-center justify-center text-muted active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          {/* Target */}
          <div className="flex-1">
            <p className="text-muted text-xs mb-1.5 font-medium uppercase tracking-wide">{t('to')}</p>
            <div className="flex flex-col gap-1">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setTargetLang(l.code)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium border transition-colors ${
                    targetLang === l.code
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-surface border-app text-app'
                  }`}
                >
                  <span className="text-base">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <p className="text-muted text-xs font-medium uppercase tracking-wide">
            {sourceLangObj?.sub}
          </p>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('type_message')}
            rows={3}
            className="w-full bg-surface border border-app text-app text-lg px-4 py-3 rounded-2xl outline-none focus:border-brand-600 transition-colors resize-none placeholder:text-muted"
          />
        </div>

        <button
          onClick={handleTranslate}
          disabled={loading || !inputText.trim()}
          className="w-full bg-brand-600 text-white text-base font-semibold py-4 rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {loading ? t('loading') : t('translate')}
        </button>

        {/* Result */}
        {result && (
          <div className="flex flex-col gap-2">
            <p className="text-muted text-xs font-medium uppercase tracking-wide">
              {targetLangObj?.sub}
            </p>
            <div className="bg-brand-50 dark:bg-[var(--brand-light)] border border-brand-200 dark:border-brand-800 rounded-2xl px-4 py-4">
              <p className="text-app text-lg leading-relaxed">{result}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
