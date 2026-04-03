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
    <button
      onMouseDown={start}
      onMouseUp={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      disabled={disabled}
      className={`w-36 h-36 rounded-full text-white text-lg font-bold select-none transition-all ${
        recording
          ? 'bg-red-600 scale-110 shadow-lg shadow-red-500/50'
          : 'bg-indigo-600 active:scale-105'
      } disabled:opacity-40`}
    >
      {recording ? '🔴 Recording' : '🎙️ Hold'}
    </button>
  )
}
