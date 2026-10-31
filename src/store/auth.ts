import { create } from 'zustand'
import type { Session, User } from '../lib/types'

type Status = 'loading' | 'authed' | 'anon'

interface AuthState {
  status: Status
  user: User | null
  accessToken: string | null
  /** La sesión se abrió con una contraseña débil: pedimos cambiarla. */
  weakPassword: boolean
  setSession: (s: Session) => void
  setUser: (u: User) => void
  clear: () => void
}

// El access token vive solo en memoria; el refresh token en cookie httpOnly.
export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  weakPassword: false,
  // Los refresh no traen el aviso; solo el login lo activa y se mantiene hasta cerrar sesión.
  setSession: (s) =>
    set((st) => ({
      status: 'authed',
      user: s.user,
      accessToken: s.access_token,
      weakPassword: s.weak_password ?? (st.user?.id === s.user.id && st.weakPassword),
    })),
  setUser: (user) => set({ user }),
  clear: () => set({ status: 'anon', user: null, accessToken: null, weakPassword: false }),
}))
