const NEXT_KEY = 'navaja:next'

/** Solo aceptamos rutas internas para evitar open redirects. */
export function safeNext(v: string | null | undefined, fallback = '/'): string {
  return v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : fallback
}

export const rememberNext = (next: string) => {
  try {
    sessionStorage.setItem(NEXT_KEY, safeNext(next))
  } catch {
    /* almacenamiento no disponible */
  }
}

export const popNext = () => {
  try {
    const v = sessionStorage.getItem(NEXT_KEY)
    sessionStorage.removeItem(NEXT_KEY)
    return safeNext(v)
  } catch {
    return '/'
  }
}
