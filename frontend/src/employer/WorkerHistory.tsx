import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMessages } from '../api/client'
import ChatBubble from '../components/ChatBubble'

interface Message { id: number; role: 'user' | 'assistant'; content_type: 'text' | 'audio_b64'; content: string; transcript?: string }

export default function WorkerHistory() {
  const { id } = useParams()
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (id) getMessages(parseInt(id)).then((r) => setMessages(r.data))
  }, [id])

  return (
    <div>
      <h1 className="text-white text-3xl font-bold mb-6">Chat History</h1>
      <div className="max-w-2xl">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} contentType={m.content_type} content={m.content} transcript={m.transcript} />
        ))}
        {messages.length === 0 && <p className="text-gray-500">No messages yet.</p>}
      </div>
    </div>
  )
}
