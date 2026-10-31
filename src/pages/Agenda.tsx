import { clsx } from 'clsx'
import { Ban, Check, ChevronLeft, ChevronRight, MessageCircle, Phone, UserX } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { EmptyState, Select, Skeleton, StatusBadge } from '../components/ui'
import { errorMessage } from '../lib/api'
import { useNow } from '../lib/useNow'
import { longDate, money, statusLabel, time, todayInShop } from '../lib/format'
import { useAdminBarbers, useAgenda, useSetStatus } from '../lib/queries'
import { dialable, whatsappLink } from '../lib/phone'

const shift = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function Agenda() {
  const [day, setDay] = useState(todayInShop())
  const [barberId, setBarberId] = useState('')
  const barbers = useAdminBarbers()
  const { data, isLoading, error } = useAgenda(day, shift(day, 1), barberId || undefined)
  const setStatus = useSetStatus()
  const now = useNow()

  const act = async (id: string, status: string) => {
    try {
      await setStatus.mutateAsync({ id, status })
      toast.success(`Marcada como ${statusLabel[status]?.toLowerCase()}`)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const active = (data ?? []).filter((a) => a.status !== 'cancelled')
  const revenue = active.reduce((s, a) => s + a.price_cents, 0)

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="label">Agenda</p>
          <h1 className="font-display text-5xl leading-none font-black uppercase first-letter:uppercase sm:text-6xl">{longDate(`${day}T12:00:00Z`)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDay((d) => shift(d, -1))} className="rounded-full border border-line p-2.5 hover:border-brass" aria-label="Día anterior">
            <ChevronLeft className="size-5" />
          </button>
          <button onClick={() => setDay(todayInShop())} className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-brass">
            Hoy
          </button>
          <button onClick={() => setDay((d) => shift(d, 1))} className="rounded-full border border-line p-2.5 hover:border-brass" aria-label="Día siguiente">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {(barbers.data?.length ?? 0) > 1 && (
          <div className="w-64">
            <Select value={barberId} onChange={(e) => setBarberId(e.target.value)} aria-label="Filtrar por barbero">
              <option value="">Todo el equipo</option>
              {barbers.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <span className="label">
          {active.length} citas · {money(revenue)}
        </span>
      </div>

      {error && (
        <EmptyState icon={<UserX className="size-8" />} title="No se pudo cargar la agenda">
          {errorMessage(error)}
        </EmptyState>
      )}
      {isLoading && <Skeleton className="h-40" />}
      {data?.length === 0 && (
        <EmptyState icon={<Check className="size-8" />} title="Día libre">
          No hay citas para este día.
        </EmptyState>
      )}

      <ol className="relative space-y-3 border-l border-line pl-6">
        {data?.map((a) => {
          const started = new Date(a.starts_at).getTime() <= now
          const isNow = started && new Date(a.ends_at).getTime() > now
          return (
            <li
              key={a.id}
              className={clsx('relative rounded-2xl border bg-coal p-5', isNow ? 'border-brass' : 'border-line', a.status === 'cancelled' && 'opacity-50')}
            >
              <span className={clsx('absolute top-6 -left-[1.95rem] size-3 rounded-full border-2 border-ink', isNow ? 'bg-brass' : 'bg-line')} />
              <div className="flex flex-wrap items-start gap-4">
                <div className="w-20 font-mono">
                  <p className="text-xl text-bone">{time(a.starts_at)}</p>
                  <p className="text-xs text-dust">{time(a.ends_at)}</p>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-bold">{a.client_name}</span>
                    <StatusBadge status={a.status}>{statusLabel[a.status]}</StatusBadge>
                  </div>
                  <p className="text-sm text-ash">
                    {a.service_name} · {money(a.price_cents)} {(barbers.data?.length ?? 0) > 1 && `· ${a.barber_name}`}
                  </p>
                  {a.notes && <p className="mt-2 rounded-lg bg-smoke px-3 py-2 font-serif text-ash italic">“{a.notes}”</p>}
                </div>
                {a.status === 'confirmed' && (
                  <div className="flex gap-2">
                    {started && (
                      <>
                        <button
                          onClick={() => act(a.id, 'completed')}
                          className="rounded-full border border-moss/40 p-2.5 text-[#9dc086] hover:bg-moss/20"
                          aria-label="Completada"
                          title="Completada"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          onClick={() => act(a.id, 'no_show')}
                          className="rounded-full border border-blood/40 p-2.5 text-[#e2786c] hover:bg-blood/20"
                          aria-label="No se presentó"
                          title="No se presentó"
                        >
                          <UserX className="size-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => act(a.id, 'cancelled')}
                      className="rounded-full border border-line p-2.5 text-ash hover:border-blood hover:text-[#e2786c]"
                      aria-label="Cancelar"
                      title="Cancelar"
                    >
                      <Ban className="size-4" />
                    </button>
                  </div>
                )}
                {a.client_phone && (
                  <div className="flex w-full flex-wrap items-center gap-2 sm:pl-24">
                    <a
                      href={`tel:${dialable(a.client_phone)}`}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-brass whitespace-nowrap sm:flex-none px-4 text-sm font-bold text-ink hover:bg-bone"
                    >
                      <Phone className="size-3.5" /> Llamar · {a.client_phone}
                    </a>
                    <a
                      href={whatsappLink(a.client_phone, `Hola ${a.client_name}, te escribimos de Edgar Barber por tu cita de las ${time(a.starts_at)}.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border whitespace-nowrap sm:flex-none border-line px-4 text-sm font-semibold text-ash hover:border-brass hover:text-brass"
                    >
                      <MessageCircle className="size-3.5" /> WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
