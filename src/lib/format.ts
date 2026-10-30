let shopTz = 'Europe/Madrid'
export const setShopTimezone = (tz: string) => {
  shopTz = tz
}

export const money = (cents: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: cents % 100 ? 2 : 0 }).format(
    cents / 100,
  )

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-ES', { timeZone: shopTz, ...opts })

export const time = (iso: string) => fmt({ hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
export const longDate = (iso: string) => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso))
export const shortDate = (iso: string) => fmt({ day: '2-digit', month: 'short' }).format(new Date(iso))
export const hourOf = (iso: string) => Number(fmt({ hour: 'numeric', hourCycle: 'h23' }).format(new Date(iso)))

/** Fecha YYYY-MM-DD (día civil) → partes para la tira de días; se evalúa a mediodía UTC para no saltar de día. */
export const dayParts = (ymd: string) => {
  const d = new Date(`${ymd}T12:00:00Z`)
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', ...o }).format(d)
  return { weekday: f({ weekday: 'short' }).replace('.', ''), day: f({ day: 'numeric' }), month: f({ month: 'short' }).replace('.', '') }
}

export const ymdInShop = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: shopTz }).format(new Date(iso))
export const todayInShop = () => ymdInShop(new Date().toISOString())

export const minutesToHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const hhmmToMinutes = (v: string) => {
  const [h, m] = v.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const duration = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60}′` : ''}` : `${min} min`)

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

export const statusLabel: Record<string, string> = {
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No presentado',
}
