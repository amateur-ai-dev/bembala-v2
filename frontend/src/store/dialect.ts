import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DialectState {
  dialectCode: string
  language: string
  ttsSpeed: number
  setDialect: (code: string, language: string) => void
  setTtsSpeed: (speed: number) => void
}

export const useDialectStore = create<DialectState>()(
  persist(
    (set) => ({
      dialectCode: 'kn-north',
      language: 'kn',
      ttsSpeed: 1.0,
      setDialect: (dialectCode, language) => set({ dialectCode, language }),
      setTtsSpeed: (ttsSpeed) => set({ ttsSpeed }),
    }),
    { name: 'vaakya_dialect' }
  )
)
