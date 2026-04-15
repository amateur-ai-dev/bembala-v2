import AudioPlayer from './AudioPlayer'

interface Props {
  role: 'user' | 'assistant'
  contentType: 'text' | 'audio_b64'
  content: string
  transcript?: string
  format?: string
}

export default function ChatBubble({ role, contentType, content, transcript, format }: Props) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2 msg-in`}>
      <div
        className={`max-w-[78%] px-4 py-3 rounded-2xl text-base leading-snug ${
          isUser
            ? 'bg-brand-600 text-white rounded-br-sm'
            : 'bg-[var(--agent-bubble)] text-[var(--agent-bubble-text)] rounded-bl-sm'
        }`}
      >
        {contentType === 'audio_b64' ? (
          <div className="flex flex-col gap-1">
            {transcript
              ? <p className="font-medium">{transcript}</p>
              : <p className="opacity-60 italic text-sm">...</p>
            }
            <AudioPlayer audioB64={content} format={format} />
          </div>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </div>
  )
}
