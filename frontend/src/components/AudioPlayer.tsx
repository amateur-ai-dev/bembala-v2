import { useRef } from 'react'

interface Props {
  audioB64: string
  format?: string
}

export default function AudioPlayer({ audioB64, format = 'wav' }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const play = () => {
    if (!audioRef.current) return
    audioRef.current.src = `data:audio/${format};base64,${audioB64}`
    audioRef.current.play().catch(() => {})
  }

  return (
    <>
      <audio ref={audioRef} hidden />
      <button
        onClick={play}
        className="flex items-center gap-1.5 text-xs font-medium opacity-70 hover:opacity-100 transition-opacity mt-1"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        Play again
      </button>
    </>
  )
}
