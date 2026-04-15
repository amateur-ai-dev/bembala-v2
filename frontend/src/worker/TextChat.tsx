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
  const inputRef = useRef<HTMLInputElement>(null)

  const tLang = langFromDialect(dialectCode)
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
      const res = await sendChat(history, dialectCode, 'You are a helpful assistant for blue-collar workers.')
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'assistant', content: res.data.content },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-12 pb-3 bg-surface border-b border-app">
        <div>
          <p className="text-app font-semibold text-base">{t('chat')}</p>
          <p className="text-muted text-xs">{dialectCode}</p>
        </div>
        {/* Transliteration toggle */}
        <button
          onClick={() => setTranslitOn((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            translitOn
              ? 'bg-brand-600 border-brand-600 text-white'
              : 'border-app text-muted bg-surface'
          }`}
        >
          <span>{translitOn ? scriptLabel : 'A'}</span>
          <span>{translitOn ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
            <p className="text-muted text-sm">{t('type_message')}</p>
          </div>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} contentType="text" content={m.content} />
        ))}
        {loading && (
          <div className="flex justify-start mb-2">
            <div className="bg-[var(--agent-bubble)] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-bounce"
                  style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-surface border-t border-app">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={translitOn ? `abc → ${scriptLabel}` : t('type_message')}
          className="flex-1 bg-app border border-app text-app text-base px-4 py-3 rounded-xl outline-none focus:border-brand-600 transition-colors placeholder:text-muted"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-brand-600 text-white disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
