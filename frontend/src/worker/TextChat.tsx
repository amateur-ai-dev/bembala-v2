import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ChatBubble from '../components/ChatBubble'
import { createSession, sendChat } from '../api/client'
import { useDialectStore } from '../store/dialect'
import { transliterate, langFromDialect } from '../utils/transliterate'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

export default function TextChat() {
  const { t } = useTranslation()
  const { dialectCode } = useDialectStore()
  const [_sessionId, setSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [translitOn, setTranslitOn] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const tLang = langFromDialect(dialectCode)

  // Script labels for the toggle badge
  const SCRIPT_LABEL: Record<string, string> = { kn: 'ಕ', te: 'క', ta: 'த' }
  const scriptLabel = SCRIPT_LABEL[tLang] ?? 'ಕ'

  useEffect(() => {
    createSession().then((r) => setSessionId(r.data.id))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const resolveText = (raw: string) =>
    translitOn ? transliterate(raw.trim(), tLang) : raw.trim()

  const send = async () => {
    if (!input.trim() || loading) return
    const resolved = resolveText(input)
    const userMsg: Message = { id: Date.now(), role: 'user', content: resolved }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      const res = await sendChat(
        history,
        dialectCode,
        'You are a helpful assistant for blue-collar workers.',
      )
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'assistant', content: res.data.content },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex-1 overflow-auto p-4">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} contentType="text" content={m.content} />
        ))}
        {loading && <p className="text-gray-500 text-center text-sm">{t('loading')}</p>}
        <div ref={bottomRef} />
      </div>

      {/* transliteration mode hint */}
      {translitOn && (
        <div className="px-4 pb-1">
          <span className="text-xs text-indigo-400">
            abc → {scriptLabel} &nbsp;·&nbsp; type english, send as {tLang === 'kn' ? 'ಕನ್ನಡ' : tLang === 'te' ? 'తెలుగు' : 'தமிழ்'}
          </span>
        </div>
      )}

      <div className="flex gap-2 p-4 bg-gray-900 border-t border-gray-800">
        {/* transliteration toggle */}
        <button
          onClick={() => setTranslitOn((v) => !v)}
          title={translitOn ? 'Transliteration ON — click to use native keyboard' : 'Transliteration OFF — click to enable'}
          className={`flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold border-2 transition-colors ${
            translitOn
              ? 'bg-indigo-700 border-indigo-500 text-white'
              : 'bg-gray-800 border-gray-600 text-gray-400'
          }`}
        >
          {translitOn ? scriptLabel : 'A'}
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={translitOn ? `type in english → ${scriptLabel}` : t('type_message')}
          lang={translitOn ? 'en' : tLang === 'kn' ? 'kn-IN' : tLang === 'te' ? 'te-IN' : 'ta-IN'}
          className="flex-1 bg-gray-800 text-white text-xl px-4 py-3 rounded-xl"
        />

        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xl font-bold disabled:opacity-50"
        >
          {t('send')}
        </button>
      </div>
    </div>
  )
}
