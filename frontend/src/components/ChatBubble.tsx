import AudioPlayer from './AudioPlayer'

interface Props {
  role: 'user' | 'assistant'
  contentType: 'text' | 'audio_b64'
  content: string
  transcript?: string
}

export default function ChatBubble({ role, contentType, content, transcript }: Props) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-white text-lg ${
          isUser ? 'bg-indigo-600 rounded-br-sm' : 'bg-gray-700 rounded-bl-sm'
        }`}
      >
        {contentType === 'audio_b64' ? (
          <div className="flex flex-col gap-1">
            <AudioPlayer audioB64={content} />
            {transcript && <p className="text-sm text-gray-300 mt-1">{transcript}</p>}
          </div>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </div>
  )
}
