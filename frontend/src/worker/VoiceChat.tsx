import { useState, useEffect } from 'react'
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
}

export default function VoiceChat() {
  const { t } = useTranslation()
  const { dialectCode, language } = useDialectStore()
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createSession().then((r) => setSessionId(r.data.id))
  }, [])

  const handleAudio = async (audioB64: string) => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await speechToSpeech(audioB64, dialectCode, language, sessionId)
      const { audio_b64, transcript, reply_text } = res.data
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'user', content_type: 'audio_b64', content: audioB64, transcript },
        { id: Date.now() + 1, role: 'assistant', content_type: 'audio_b64', content: audio_b64, transcript: reply_text },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex-1 overflow-auto p-4">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} contentType={m.content_type} content={m.content} transcript={m.transcript} />
        ))}
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-16 text-lg">{t('hold_to_talk')}</p>
        )}
      </div>
      <div className="flex justify-center py-8 bg-gray-900">
        <HoldToTalk onAudioReady={handleAudio} disabled={loading || !sessionId} />
      </div>
    </div>
  )
}
