import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import HoldToTalk from '../components/HoldToTalk'
import ChatBubble from '../components/ChatBubble'
import { createSession, speechToSpeech } from '../api/client'
import { useDialectStore } from '../store/dialect'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content_type: 'text' | 'audio_b64'
  content: string
  transcript?: string
  format?: string
}

export default function VoiceChat() {
  const { t } = useTranslation()
  const { dialectCode, language } = useDialectStore()
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const responseAudioRef = useRef<HTMLAudioElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createSession()
      .then((r) => setSessionId(r.data.id))
      .catch(() => setError('Session start failed. Please restart.'))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleAudio = async (audioB64: string) => {
    if (!sessionId) return
    setLoading(true)
    setError('')
    try {
      const res = await speechToSpeech(audioB64, dialectCode, language, sessionId)
      const { audio_b64, transcript, reply_text, format } = res.data
      const audioFormat = format || 'wav'
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'user', content_type: 'audio_b64', content: audioB64, transcript, format: 'webm' },
        { id: Date.now() + 1, role: 'assistant', content_type: 'audio_b64', content: audio_b64, transcript: reply_text, format: audioFormat },
      ])
      if (responseAudioRef.current) {
        responseAudioRef.current.src = `data:audio/${audioFormat};base64,${audio_b64}`
        responseAudioRef.current.play().catch(() => {})
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => setMessages([])

  return (
    <div className="flex flex-col h-full bg-app">
      <audio ref={responseAudioRef} hidden />

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-12 pb-3 bg-surface border-b border-app">
        <div>
          <p className="text-app font-semibold text-base">{t('voice')}</p>
          <p className="text-muted text-xs">{dialectCode}</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-muted text-xs font-medium py-1.5 px-3 rounded-lg border border-app">
            {t('new_chat')}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 min-h-0">
        {messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
            <svg className="w-10 h-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 016 0v4a3 3 0 01-6 0z" />
            </svg>
            <p className="text-muted text-sm text-center">{t('hold_to_talk')}</p>
          </div>
        )}
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            role={m.role}
            contentType={m.content_type}
            content={m.content}
            transcript={m.transcript}
            format={m.format}
          />
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
        {error && <p className="text-red-500 text-sm text-center py-2">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Bottom — mic hero */}
      <div className="flex-shrink-0 flex items-center justify-center bg-surface border-t border-app py-5 px-4">
        <HoldToTalk onAudioReady={handleAudio} disabled={loading || !sessionId} />
      </div>
    </div>
  )
}
