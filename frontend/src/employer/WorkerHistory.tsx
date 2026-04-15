import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMessages } from '../api/client'
import ChatBubble from '../components/ChatBubble'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content_type: 'text' | 'audio_b64'
  content: string
  transcript?: string
}

export default function WorkerHistory() {
  const { id } = useParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      getMessages(parseInt(id))
        .then((r) => setMessages(r.data))
        .finally(() => setLoading(false))
    }
  }, [id])

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/employer/workers" className="text-muted hover:text-app transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-app text-2xl font-bold">Chat History</h1>
          <p className="text-muted text-sm">Worker #{id}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-surface border border-app rounded-2xl px-6 py-10 text-center">
          <p className="text-muted text-sm">No messages yet.</p>
        </div>
      ) : (
        <div className="bg-surface border border-app rounded-2xl p-4">
          {messages.map((m) => (
            <ChatBubble
              key={m.id}
              role={m.role}
              contentType={m.content_type}
              content={m.content}
              transcript={m.transcript}
            />
          ))}
        </div>
      )}
    </div>
  )
}
