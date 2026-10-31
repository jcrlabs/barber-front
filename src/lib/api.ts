import { useAuth } from '../store/auth'
import type { Session } from './types'

export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string>

  constructor(status: number, message: string, code = 'error', fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

const BASE = '/api/v1'

// Cabecera anti-CSRF que exige el backend en los endpoints basados en cookie.
const CSRF = { 'X-Requested-With': 'navaja' }

let refreshing: Promise<Session | null> | null = null

/** Canjea la cookie httpOnly de refresh por un access token nuevo (una sola petición en vuelo). */
export function refreshSession(): Promise<Session | null> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'same-origin', headers: CSRF })
    .then(async (res) => {
      if (!res.ok) {
        useAuth.getState().clear()
        return null
      }
      const s = (await res.json()) as Session
      useAuth.getState().setSession(s)
      return s
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? res.statusText, body.code, body.fields)
  }
  return body as T
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init
  const doFetch = () => {
    const token = useAuth.getState().accessToken
    const headers: Record<string, string> = { ...CSRF, ...(rest.headers as Record<string, string>) }
    if (json !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    return fetch(`${BASE}${path}`, {
      ...rest,
      credentials: 'same-origin',
      headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    })
  }

  let res = await doFetch()
  if (res.status === 401 && useAuth.getState().accessToken && !path.startsWith('/auth/refresh')) {
    const s = await refreshSession()
    if (s) res = await doFetch()
  }
  return parse<T>(res)
}

const messages: Record<string, string> = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_taken: 'Ya existe una cuenta con ese email.',
  weak_password: 'La contraseña necesita 8+ caracteres con letras y números.',
  slot_taken: 'Alguien acaba de reservar ese hueco. Elige otro.',
  slot_invalid: 'Ese hueco ya no está disponible.',
  too_many_active: 'Has alcanzado el máximo de citas pendientes.',
  phone_required: 'Necesitamos un teléfono para poder contactarte.',
  not_linked: 'Tu cuenta aún no está enlazada a un barbero.',
  too_late_to_cancel: 'Ya no se puede cancelar online. Llámanos.',
  invalid_state: 'La cita ya no admite ese cambio.',
  not_found: 'No encontrado.',
  validation: 'Revisa los campos marcados.',
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 429) return 'Demasiados intentos. Espera un momento.'
    return messages[e.code] ?? 'Algo ha fallado. Inténtalo de nuevo.'
  }
  return 'Sin conexión con el servidor.'
}
