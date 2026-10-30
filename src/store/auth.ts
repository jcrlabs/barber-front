import { create } from 'zustand'
import type { Session, User } from '../lib/types'

type Status = 'loading' | 'authed' | 'anon'

interface AuthState {
  status: Status
  user: User | null
  accessToken: string | null
  setSession: (s: Session) => void
  setUser: (u: User) => void
  clear: () => void
}

// El access token vive solo en memoria; el refresh token en cookie httpOnly.
export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  setSession: (s) => set({ status: 'authed', user: s.user, accessToken: s.access_token }),
  setUser: (user) => set({ user }),
  clear: () => set({ status: 'anon', user: null, accessToken: null }),
}))
