import { CalendarDays, Scissors } from 'lucide-react'
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

      {!isLoading && !data?.length && (
        <EmptyState icon={<CalendarDays className="size-8" />} title="Aún sin citas">
          Tu primera reserva te lleva 30 segundos.
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
