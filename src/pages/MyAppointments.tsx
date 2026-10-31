import { CalendarClock, CalendarDays, Scissors } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button, EmptyState, Modal, Skeleton, StatusBadge } from '../components/ui'
import { errorMessage } from '../lib/api'
import { useNow } from '../lib/useNow'
import { dayParts, duration, longDate, money, statusLabel, time, ymdInShop } from '../lib/format'
import { useCancel, useMeta, useMyAppointments } from '../lib/queries'
import type { Appointment } from '../lib/types'

function Row({ a, onCancel, cancellable }: { a: Appointment; onCancel?: () => void; cancellable: boolean }) {
  const p = dayParts(ymdInShop(a.starts_at))
  const mins = Math.round((new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60000)
  return (
    <li className="flex flex-wrap items-center gap-5 rounded-2xl border border-line bg-coal p-5">
      <div className="grid w-16 place-items-center rounded-xl border border-line py-2">
        <span className="font-mono text-[0.65rem] text-ash uppercase">{p.weekday}</span>
        <span className="font-display text-3xl leading-none font-black">{p.day}</span>
        <span className="font-mono text-[0.65rem] text-ash uppercase">{p.month}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-2xl font-bold uppercase">{a.service_name}</span>
          <StatusBadge status={a.status}>{statusLabel[a.status]}</StatusBadge>
        </div>
        <p className="text-sm text-ash">
          <span className="font-mono text-bone">{time(a.starts_at)}</span> · {duration(mins)} · con {a.barber_name} · {money(a.price_cents)}
        </p>
      </div>
      {onCancel && (
        <Button variant="danger" size="sm" onClick={onCancel} disabled={!cancellable} title={cancellable ? undefined : 'Fuera del plazo de cancelación online'}>
          Cancelar
        </Button>
      )}
    </li>
  )
}

function countdown(ms: number) {
  const h = Math.floor(ms / 3600_000)
  if (h >= 48) return `en ${Math.round(h / 24)} días`
  if (h >= 1) return `en ${h} h`
  return `en ${Math.max(1, Math.round(ms / 60_000))} min`
}

/** Resumen del cliente: próxima cita destacada y números de su historial. */
function Summary({ list, now }: { list: Appointment[]; now: number }) {
  const next = list.filter((a) => a.status === 'confirmed' && new Date(a.starts_at).getTime() > now).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0]
  const done = list.filter((a) => a.status === 'completed')
  const spent = done.reduce((s, a) => s + a.price_cents, 0)
  const fav = Object.entries(done.reduce<Record<string, number>>((m, a) => ((m[a.service_name] = (m[a.service_name] ?? 0) + 1), m), {})).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0]
  const upcoming = list.filter((a) => a.status === 'confirmed' && new Date(a.starts_at).getTime() > now).length

  return (
    <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <div className="relative overflow-hidden rounded-3xl border border-brass/40 bg-coal p-6">
        <p className="label flex items-center gap-2 text-brass">
          <CalendarClock className="size-3.5" /> Tu próxima cita
        </p>
        {next ? (
          <div className="mt-4 space-y-1">
            <p className="font-display text-4xl leading-none font-black uppercase">{next.service_name}</p>
            <p className="text-ash">
              <span className="text-bone first-letter:uppercase">{longDate(next.starts_at)}</span> a las{' '}
              <span className="font-mono text-bone">{time(next.starts_at)}</span> · con {next.barber_name}
            </p>
            <p className="pt-2 font-mono text-sm text-brass">{countdown(new Date(next.starts_at).getTime() - now)}</p>
          </div>
        ) : (
          <p className="mt-4 text-ash">No tienes ninguna cita pendiente.</p>
        )}
      </div>
      <dl className="grid grid-cols-3 gap-3 md:grid-cols-1 md:gap-2">
        {[
          { k: 'Pendientes', v: String(upcoming) },
          { k: 'Visitas', v: String(done.length) },
          { k: fav ? 'Tu favorito' : 'Invertido', v: fav ?? money(spent) },
        ].map((c) => (
          <div key={c.k} className="rounded-2xl border border-line bg-coal px-4 py-3">
            <dt className="label">{c.k}</dt>
            <dd className="mt-1 truncate font-display text-2xl font-black uppercase">{c.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function MyAppointments() {
  const { data, isLoading } = useMyAppointments()
  const meta = useMeta()
  const cancel = useCancel()
  const [target, setTarget] = useState<Appointment | null>(null)
  const now = useNow()
  const windowMs = (meta.data?.cancel_window_min ?? 120) * 60_000

  const upcoming = (data ?? []).filter((a) => a.status === 'confirmed' && new Date(a.starts_at).getTime() > now).reverse()
  const past = (data ?? []).filter((a) => !upcoming.includes(a))

  const doCancel = async () => {
    if (!target) return
    try {
      await cancel.mutateAsync(target.id)
      toast.success('Cita cancelada')
      setTarget(null)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="font-display text-6xl leading-[0.9] font-black uppercase">
          Mis <em className="font-serif font-normal text-brass normal-case italic">citas</em>
        </h1>
        <Link to="/reservar" className="inline-flex h-11 items-center gap-2 rounded-full bg-brass px-6 font-bold text-ink hover:bg-bone">
          <Scissors className="size-4" /> Nueva reserva
        </Link>
      </div>

      {isLoading && <Skeleton className="h-28" />}

      {!!data?.length && <Summary list={data} now={now} />}

      {!isLoading && !data?.length && (
        <EmptyState icon={<CalendarDays className="size-8" />} title="Aún sin citas">
          Cuando reserves, tus citas aparecerán aquí.
        </EmptyState>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-4">
          <p className="label">Próximas</p>
          <ul className="space-y-3">
            {upcoming.map((a) => (
              <Row key={a.id} a={a} onCancel={() => setTarget(a)} cancellable={new Date(a.starts_at).getTime() - now >= windowMs} />
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-4">
          <p className="label">Historial</p>
          <ul className="space-y-3 opacity-80">
            {past.map((a) => (
              <Row key={a.id} a={a} cancellable={false} />
            ))}
          </ul>
        </section>
      )}

      <Modal open={!!target} onClose={() => setTarget(null)} title="¿Cancelar cita?">
        {target && (
          <div className="space-y-6">
            <p className="text-ash">
              {target.service_name} con {target.barber_name}, <span className="text-bone first-letter:uppercase">{longDate(target.starts_at)}</span> a las{' '}
              <span className="font-mono text-bone">{time(target.starts_at)}</span>. El hueco quedará libre para otra persona.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setTarget(null)}>
                Mantener
              </Button>
              <Button variant="danger" onClick={doCancel} loading={cancel.isPending}>
                Sí, cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
