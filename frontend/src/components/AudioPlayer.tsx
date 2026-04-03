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
    audioRef.current.play()
  }

  return (
    <div>
      <audio ref={audioRef} />
      <button
        onClick={play}
        className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
      >
        🔊 Play
      </button>
    </div>
  )
}
