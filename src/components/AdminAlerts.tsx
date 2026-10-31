import { clsx } from 'clsx'
import { Bell, BellRing, MessageCircle, Phone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { longDate, time } from '../lib/format'
import { dialable, whatsappLink } from '../lib/phone'
import { useNotifications } from '../lib/queries'
import type { Appointment } from '../lib/types'
import { Button, Modal } from './ui'

const SEEN_KEY = 'edgarbarber:alerts-seen'

// Solo guardamos en el navegador hasta dónde ha mirado el admin; las citas siempre vienen del servidor.
const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY)
  } catch {
    return null
  }
}
const writeSeen = (v: string) => {
  try {
    localStorage.setItem(SEEN_KEY, v)
  } catch {
    /* almacenamiento bloqueado: el aviso vuelve a mostrarse, sin más */
  }
}

const canNotify = () => typeof window !== 'undefined' && 'Notification' in window

function systemNotify(a: Appointment) {
  if (!canNotify() || Notification.permission !== 'granted') return
  try {
    const n = new Notification(`Nueva cita · ${time(a.starts_at)}`, {
      body: `${a.client_name} · ${a.service_name}\n${longDate(a.starts_at)} · Tel. ${a.client_phone ?? ''}`,
      icon: '/icons/icon-192.png',
      tag: a.id,
    })
    n.onclick = () => {
      window.focus()
      window.location.href = '/agenda'
    }
  } catch {
    /* algunos navegadores móviles solo notifican desde el service worker */
  }
}

export function AlertRow({ a }: { a: Appointment }) {
  return (
    <li className="space-y-3 rounded-2xl border border-line bg-ink p-4">
      <div>
        <p className="font-bold">{a.client_name}</p>
        <p className="text-sm text-ash">
          {a.service_name} · <span className="first-letter:uppercase">{longDate(a.starts_at)}</span> ·{' '}
          <span className="font-mono text-bone">{time(a.starts_at)}</span>
          {a.barber_name && ` · ${a.barber_name}`}
        </p>
        {a.notes && <p className="mt-1 font-serif text-sm text-ash italic">“{a.notes}”</p>}
      </div>
      {a.client_phone && (
        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${dialable(a.client_phone)}`}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brass px-4 text-sm font-bold text-ink hover:bg-bone"
          >
            <Phone className="size-4" /> Llamar · {a.client_phone}
          </a>
          <a
            href={whatsappLink(
              a.client_phone,
              `Hola ${a.client_name}, te escribimos de Edgar Barber por tu cita del ${longDate(a.starts_at)} a las ${time(a.starts_at)}.`,
            )}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ash hover:border-brass hover:text-brass"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        </div>
      )}
    </li>
  )
}

/** Campana del admin: consulta cada 30 s las reservas nuevas y avisa con toast, notificación del sistema y vibración. */
export function AdminAlerts({ className }: { className?: string }) {
  const [seen, setSeen] = useState(() => readSeen() ?? new Date(Date.now() - 24 * 3600_000).toISOString())
  const [open, setOpen] = useState(false)
  const [perm, setPerm] = useState(() => (canNotify() ? Notification.permission : 'denied'))
  const { data } = useNotifications(seen, true)
  const known = useRef<Set<string> | null>(null)
  const items = data?.items ?? []

  useEffect(() => {
    if (!data) return
    // La primera respuesta solo marca lo que ya había; avisamos de lo que llegue después.
    if (known.current === null) {
      known.current = new Set(data.items.map((a) => a.id))
      return
    }
    const fresh = data.items.filter((a) => !known.current!.has(a.id))
    fresh.forEach((a) => {
      known.current!.add(a.id)
      systemNotify(a)
      toast(`Nueva cita: ${a.client_name}`, {
        description: `${a.service_name} · ${longDate(a.starts_at)} ${time(a.starts_at)}`,
        duration: 15_000,
        action: a.client_phone
          ? {
              label: 'Llamar',
              onClick: () => (window.location.href = `tel:${dialable(a.client_phone!)}`),
            }
          : undefined,
      })
    })
    if (fresh.length) navigator.vibrate?.([120, 60, 120])
  }, [data])

  const markSeen = () => {
    const v = data?.server_time ?? new Date().toISOString()
    writeSeen(v)
    setSeen(v)
    known.current = null
    setOpen(false)
  }

  const ask = async () => {
    if (!canNotify()) return
    setPerm(await Notification.requestPermission())
  }

  const Icon = items.length ? BellRing : Bell
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={clsx('relative rounded-full p-2 text-ash hover:bg-smoke hover:text-bone', items.length > 0 && 'text-brass', className)}
        aria-label={items.length ? `${items.length} reservas nuevas` : 'Avisos de reservas'}
      >
        <Icon className={clsx('size-5', items.length > 0 && 'animate-pulse')} />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-brass px-1 font-mono text-[0.65rem] font-bold text-ink">
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Reservas nuevas">
        <div className="space-y-5">
          {items.length === 0 ? (
            <p className="text-ash">No hay reservas nuevas desde la última vez que miraste.</p>
          ) : (
            <ul className="max-h-[55vh] space-y-3 overflow-y-auto">
              {items.map((a) => (
                <AlertRow key={a.id} a={a} />
              ))}
            </ul>
          )}
          {canNotify() && perm === 'default' && (
            <button onClick={ask} className="w-full rounded-2xl border border-dashed border-brass/50 p-3 text-sm text-brass hover:bg-smoke">
              Activar avisos en este dispositivo mientras el panel esté abierto
            </button>
          )}
          {data && data.channels.length === 0 && (
            <p className="text-xs text-dust">
              Para recibir avisos con la app cerrada, configura ntfy o Telegram en el servidor (ver pestaña Resumen del panel).
            </p>
          )}
          <div className="flex justify-between gap-3">
            <Link
              to="/agenda"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-ash hover:text-bone"
            >
              Ver agenda
            </Link>
            <Button onClick={markSeen} disabled={!items.length}>
              Marcar como vistas
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
