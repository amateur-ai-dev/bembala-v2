import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  role: 'worker' | 'employer' | null
  phone: string | null
  login: (token: string, role: 'worker' | 'employer', phone: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      phone: null,
      login: (token, role, phone) => set({ token, role, phone }),
      logout: () => set({ token: null, role: null, phone: null }),
    }),
    { name: 'vaakya_auth' }
  )
)
