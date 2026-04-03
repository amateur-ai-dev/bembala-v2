import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ChatBubble from '../components/ChatBubble'
import { createSession, sendChat } from '../api/client'
import { useDialectStore } from '../store/dialect'

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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createSession().then((r) => setSessionId(r.data.id))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { id: Date.now(), role: 'user' as const, content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      const res = await sendChat(history, dialectCode, 'You are a helpful assistant for blue-collar workers.')
      setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: res.data.content }])
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
      <div className="flex gap-2 p-4 bg-gray-900 border-t border-gray-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t('type_message')}
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
