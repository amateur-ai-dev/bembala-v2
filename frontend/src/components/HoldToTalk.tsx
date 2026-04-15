import { useState, useRef } from 'react'

interface Props {
  onAudioReady: (audioB64: string) => void
  disabled?: boolean
}

export default function HoldToTalk({ onAudioReady, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = async () => {
    if (disabled) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const reader = new FileReader()
      reader.onloadend = () => {
        const b64 = (reader.result as string).split(',')[1]
        onAudioReady(b64)
      }
      reader.readAsDataURL(blob)
      stream.getTracks().forEach((t) => t.stop())
    }
    recorder.start()
    mediaRef.current = recorder
    setRecording(true)
  }

  const stop = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse ring — only when recording */}
      {recording && (
        <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
      )}

      <button
        onMouseDown={start}
        onMouseUp={stop}
        onTouchStart={(e) => { e.preventDefault(); start() }}
        onTouchEnd={(e) => { e.preventDefault(); stop() }}
        disabled={disabled}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center select-none transition-all duration-150 shadow-lg ${
          recording
            ? 'bg-red-500 scale-110 shadow-red-500/40'
            : disabled
            ? 'bg-brand-600/40'
            : 'bg-brand-600 active:scale-95 shadow-brand-600/30'
        }`}
      >
        {recording ? (
          /* Waveform bars */
          <div className="flex items-center gap-0.5">
            {[3, 5, 4, 6, 3].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-white rounded-full animate-pulse"
                style={{ height: `${h * 3}px`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 016 0v4a3 3 0 01-6 0z" />
          </svg>
        )}
      </button>
    </div>
  )
}
