import { clsx } from 'clsx'
import { ArrowLeft, ArrowRight, Check, CircleAlert, Shuffle, Ticket as TicketIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button, EmptyState, Field, Input, Monogram, Skeleton, Textarea } from '../components/ui'
import { ApiError, errorMessage } from '../lib/api'
import { dayParts, duration, hourOf, longDate, time } from '../lib/format'
import { useBarbers, useBook, useDays, useServices, useSlots } from '../lib/queries'
import type { Appointment, Barber, Service, Slot } from '../lib/types'
import { useAuth } from '../store/auth'

const STEPS = ['Servicio', 'Barbero', 'Día y hora', 'Confirmar'] as const

function useBookingParams() {
  const [params, setParams] = useSearchParams()
  const get = (k: string) => params.get(k)
  const set = (patch: Record<string, string | null>) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p)
        Object.entries(patch).forEach(([k, v]) => (v === null ? n.delete(k) : n.set(k, v)))
        return n
      },
      { replace: true },
    )
  return {
    service: get('s'),
    barber: get('b'),
    date: get('d'),
    slot: get('t'),
    step: Number(get('step') ?? 0),
    set,
  }
}

function Progress({ step, onJump, max, first }: { step: number; onJump: (i: number) => void; max: number; first: number }) {
  // Los pasos con una única opción (un solo servicio o un solo barbero) se eligen solos y no se muestran.
  const visible = STEPS.map((s, i) => ({ s, i })).filter(({ i }) => i >= first)
  const pos = visible.findIndex(({ i }) => i === step)
  return (
    <div className="space-y-4">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-smoke">
        <div
          className="pole animate-pole absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${((pos + 1) / visible.length) * 100}%` }}
        />
      </div>
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}>
        {visible.map(({ s, i }, n) => (
          <li key={s}>
            <button
              disabled={i > max}
              onClick={() => onJump(i)}
              className={clsx(
                'w-full text-left font-mono text-[0.6rem] leading-tight tracking-[0.06em] uppercase sm:text-[0.68rem] sm:tracking-[0.14em] transition-colors disabled:cursor-not-allowed',
                i === step ? 'text-brass' : i <= max ? 'text-ash hover:text-bone' : 'text-dust',
              )}
            >
              <span className="hidden sm:inline">{String(n + 1).padStart(2, '0')} · </span>
              {s}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

function ServiceStep({ services, value, onPick }: { services?: Service[]; value: string | null; onPick: (id: string) => void }) {
  if (!services)
    return (
      <div className="grid gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  return (
    <div className="grid gap-3">
      {services.map((s) => (
        <button
          key={s.id}
          onClick={() => onPick(s.id)}
          className={clsx(
            'group flex items-center gap-5 rounded-2xl border p-5 text-left transition-all',
            value === s.id ? 'border-brass bg-brass/5' : 'border-line bg-coal hover:border-ash/40',
          )}
        >
          <span
            className={clsx(
              'grid size-6 shrink-0 place-items-center rounded-full border transition-colors',
              value === s.id ? 'border-brass bg-brass text-ink' : 'border-line',
            )}
          >
            {value === s.id && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <span className="flex-1">
            <span className="block font-display text-2xl font-bold uppercase">{s.name}</span>
            <span className="block text-sm text-ash">{s.description}</span>
          </span>
          <span className="text-right">
            <span className="block font-mono text-lg text-brass">{duration(s.duration_min)}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function BarberStep({ barbers, value, onPick }: { barbers?: Barber[]; value: string | null; onPick: (id: string) => void }) {
  if (!barbers)
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    )
  const card = (active: boolean) =>
    clsx('flex flex-col gap-4 rounded-2xl border p-5 text-left transition-all', active ? 'border-brass bg-brass/5' : 'border-line bg-coal hover:border-ash/40')
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button onClick={() => onPick('any')} className={card(value === 'any')}>
        <span className="grid size-14 place-items-center rounded-full border border-dashed border-brass/60 text-brass">
          <Shuffle className="size-6" />
        </span>
        <span>
          <span className="block font-display text-2xl font-bold uppercase">Sin preferencia</span>
          <span className="block text-sm text-ash">Te asignamos el primer barbero libre. Más huecos.</span>
        </span>
      </button>
      {barbers.map((b) => (
        <button key={b.id} onClick={() => onPick(b.id)} className={card(value === b.id)}>
          <Monogram name={b.name} src={b.avatar_url} className="size-14 text-xl" />
          <span>
            <span className="label text-brass">{b.title}</span>
            <span className="block font-display text-2xl font-bold uppercase">{b.name}</span>
            <span className="line-clamp-2 block text-sm text-ash">{b.bio}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function WhenStep({
  serviceId,
  barberId,
  date,
  slot,
  onDate,
  onSlot,
}: {
  serviceId: string
  barberId: string | null
  date: string | null
  slot: string | null
  onDate: (d: string) => void
  onSlot: (s: Slot) => void
}) {
  const days = useDays(serviceId, barberId)
  const slots = useSlots(serviceId, barberId, date)

  // Selecciona automáticamente el primer día con huecos.
  useEffect(() => {
    if (!date && days.data) {
      const first = days.data.find((d) => d.free > 0)
      if (first) onDate(first.date)
    }
  }, [date, days.data, onDate])

  const groups = useMemo(() => {
    const g: Record<string, Slot[]> = { Mañana: [], Tarde: [] }
    slots.data?.forEach((s) => g[hourOf(s.starts_at) < 14 ? 'Mañana' : 'Tarde']!.push(s))
    return Object.entries(g).filter(([, v]) => v.length)
  }, [slots.data])

  return (
    <div className="space-y-8">
      <div className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:thin]">
        <div className="flex gap-2">
          {days.isLoading && Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28 w-[4.5rem] shrink-0" />)}
          {days.data?.map((d) => {
            const p = dayParts(d.date)
            const disabled = d.free === 0
            const active = d.date === date
            return (
              <button
                key={d.date}
                disabled={disabled}
                onClick={() => onDate(d.date)}
                aria-pressed={active}
                aria-label={`${p.weekday} ${p.day} ${p.month}: ${d.open ? `${d.free} huecos` : 'cerrado'}`}
                className={clsx(
                  'flex w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-2xl border px-2 pt-3 pb-2.5 transition-all',
                  active ? 'border-brass bg-brass text-ink' : disabled ? 'border-line/50 text-dust' : 'border-line bg-coal hover:border-ash/40',
                )}
              >
                <span className="font-mono text-[0.65rem] tracking-widest uppercase">{p.weekday}</span>
                <span className="font-display text-3xl leading-none font-extrabold">{p.day}</span>
                <span className="font-mono text-[0.65rem] uppercase opacity-70">{p.month}</span>
                {/* Medidor de disponibilidad del propio día: lleno = todos sus huecos libres */}
                <span className={clsx('mt-1 h-1 w-full overflow-hidden rounded-full', active ? 'bg-ink/20' : 'bg-smoke')}>
                  <span className={clsx('block h-full rounded-full', active ? 'bg-ink' : 'bg-brass')} style={{ width: `${d.total ? (d.free / d.total) * 100 : 0}%` }} />
                </span>
                {!d.open && <span className="font-mono text-[0.6rem]">cerrado</span>}
              </button>
            )
          })}
        </div>
      </div>

      {date && (
        <div className="space-y-6">
          <p className="font-serif text-2xl text-ash italic first-letter:uppercase">{longDate(`${date}T12:00:00Z`)}</p>
          {slots.isLoading && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          )}
          {slots.data?.length === 0 && (
            <EmptyState icon={<CircleAlert className="size-8" />} title="Día completo">
              Prueba con otro día u otro barbero.
            </EmptyState>
          )}
          {groups.map(([label, list]) => (
            <div key={label} className="space-y-3">
              <p className="label">{label}</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {list.map((s) => (
                  <button
                    key={s.starts_at}
                    onClick={() => onSlot(s)}
                    aria-pressed={slot === s.starts_at}
                    className={clsx(
                      'h-12 rounded-xl border font-mono text-sm transition-all',
                      slot === s.starts_at ? 'border-brass bg-brass font-bold text-ink' : 'border-line bg-coal hover:border-brass hover:text-brass',
                    )}
                  >
                    {time(s.starts_at)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TicketCard({
  service,
  barber,
  slot,
  code,
  printed,
}: {
  service?: Service
  barber?: Barber | 'any'
  slot?: string | null
  code?: string
  printed?: boolean
}) {
  const row = (k: string, v?: React.ReactNode) => (
    <div className="flex items-baseline gap-3 py-2">
      <span className="font-mono text-[0.65rem] tracking-[0.16em] text-ink/50 uppercase">{k}</span>
      <span className="leader !border-ink/15" />
      <span className="text-right font-semibold">{v ?? <span className="text-ink/30">—</span>}</span>
    </div>
  )
  return (
    <div className={clsx('relative text-ink drop-shadow-[0_30px_40px_rgb(0_0_0/.45)]', printed && 'animate-print')}>
      <div className="ticket-edge rotate-180" />
      <div className="bg-bone px-6 pt-5 pb-6">
        <div className="flex items-center justify-between border-b-2 border-dashed border-ink/15 pb-4">
          <span className="font-display text-2xl font-black tracking-[0.12em] uppercase">Edgar Barber</span>
          <span className="font-mono text-xs text-ink/50">{code ? `#${code}` : 'TICKET'}</span>
        </div>
        <div className="divide-y divide-ink/10 pt-2 text-sm">
          {row('Servicio', service?.name)}
          {row('Barbero', barber === 'any' ? 'Primero libre' : barber?.name)}
          {row('Día', slot ? <span className="first-letter:uppercase">{longDate(slot)}</span> : undefined)}
          {row('Hora', slot ? <span className="font-mono">{time(slot)}</span> : undefined)}
          {row('Duración', service ? duration(service.duration_min) : undefined)}
        </div>
        <div className="mt-4 border-t-2 border-ink" />
        {/* Código de barras decorativo */}
        <div className="mt-5 flex h-10 items-end gap-[2px] opacity-80" aria-hidden>
          {Array.from({ length: 46 }, (_, i) => (
            <span
              key={i}
              className="bg-ink"
              style={{
                width: (i * 7) % 3 === 0 ? 3 : 1,
                height: `${60 + ((i * 37) % 40)}%`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="ticket-edge" />
    </div>
  )
}

function Success({ appt, service, barber }: { appt: Appointment; service?: Service; barber?: Barber }) {
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-16 lg:grid-cols-2">
      <div className="animate-rise space-y-6">
        <span className="grid size-14 place-items-center rounded-full bg-[#9dc086] text-ink">
          <Check className="size-7" strokeWidth={3} />
        </span>
        <h1 className="font-display text-6xl leading-[0.9] font-black uppercase sm:text-7xl">
          Silla <em className="font-serif font-normal text-brass normal-case italic">reservada</em>
        </h1>
        <p className="text-lg text-ash">
          Te esperamos el <span className="text-bone">{longDate(appt.starts_at)}</span> a las{' '}
          <span className="font-mono text-bone">{time(appt.starts_at)}</span>.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/mis-citas" className="inline-flex h-12 items-center rounded-full bg-brass px-6 font-bold text-ink hover:bg-bone">
            Ver mis citas
          </Link>
          <Link to="/" className="inline-flex h-12 items-center rounded-full px-6 font-semibold text-ash hover:text-bone">
            Volver al inicio
          </Link>
        </div>
      </div>
      <div className="mx-auto w-full max-w-sm">
        <TicketCard service={service} barber={barber} slot={appt.starts_at} code={appt.id.slice(0, 6).toUpperCase()} printed />
      </div>
    </div>
  )
}

export default function Book() {
  const p = useBookingParams()
  const { set } = p
  const services = useServices()
  const barbers = useBarbers()
  const user = useAuth((s) => s.user)
  const navigate = useNavigate()
  const location = useLocation()
  const book = useBook()
  const [notes, setNotes] = useState('')
  const [phone, setPhone] = useState<string | null>(null)
  const phoneValue = phone ?? user?.phone ?? ''
  const phoneOk = /^\+?[0-9 ()-]{6,30}$/.test(phoneValue.trim())
  const [done, setDone] = useState<Appointment | null>(null)

  // Con un único servicio o barbero no tiene sentido preguntar: lo elegimos y saltamos el paso.
  const onlyService = services.data?.length === 1 ? services.data[0]!.id : null
  const onlyBarber = barbers.data?.length === 1 ? barbers.data[0]!.id : null
  const first = onlyService ? (onlyBarber ? 2 : 1) : 0
  useEffect(() => {
    if (!services.data || !barbers.data) return
    const patch: Record<string, string> = {}
    if (onlyService && !p.service) patch.s = onlyService
    if (onlyBarber && !p.barber) patch.b = onlyBarber
    if (p.step < first) patch.step = String(first)
    if (Object.keys(patch).length) set(patch)
  }, [services.data, barbers.data, onlyService, onlyBarber, first, p.service, p.barber, p.step, set])

  const service = services.data?.find((s) => s.id === p.service)
  const barberParam = p.barber === 'any' ? null : p.barber
  const barber: Barber | 'any' | undefined = p.barber === 'any' ? 'any' : barbers.data?.find((b) => b.id === p.barber)
  const slots = useSlots(p.service, barberParam, p.date)
  const slot = slots.data?.find((s) => s.starts_at === p.slot)

  // Paso máximo alcanzable según lo ya elegido.
  const max = !service ? 0 : !p.barber ? 1 : !p.slot ? 2 : 3
  const step = Math.min(p.step, max)
  const go = (i: number) => set({ step: String(i) })

  const pickDate = useMemo(() => (d: string) => set({ d, t: null }), [set])

  if (done) return <Success appt={done} service={service} barber={barbers.data?.find((b) => b.id === done.barber_id)} />

  const confirm = async () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)
      return
    }
    if (!phoneOk) {
      toast.error('Déjanos un teléfono válido para poder llamarte si hace falta.')
      document.getElementById('book-phone')?.focus()
      return
    }
    const barberId = barberParam ?? slot?.barber_ids[0]
    if (!service || !barberId || !p.slot) {
      toast.error('Ese hueco ya no está disponible. Elige otro.')
      set({ t: null, step: '2' })
      return
    }
    try {
      const appt = await book.mutateAsync({
        service_id: service.id,
        barber_id: barberId,
        starts_at: p.slot,
        notes,
        phone: phoneValue.trim(),
      })
      if (user && user.phone !== phoneValue.trim()) useAuth.getState().setUser({ ...user, phone: phoneValue.trim() })
      setDone(appt)
      window.scrollTo({ top: 0 })
    } catch (e) {
      toast.error(errorMessage(e))
      if (e instanceof ApiError && (e.code === 'slot_taken' || e.code === 'slot_invalid')) set({ t: null, step: '2' })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        <div className="min-w-0 space-y-8">
          <div className="space-y-6">
            <h1 className="font-display text-5xl leading-[0.9] font-black uppercase sm:text-6xl">
              Reserva <em className="font-serif font-normal text-brass normal-case italic">tu silla</em>
            </h1>
            <Progress step={step} max={max} onJump={go} first={first} />
          </div>

          <div key={step} className="animate-rise">
            {step === 0 && <ServiceStep services={services.data} value={p.service} onPick={(id) => set({ s: id, t: null, d: null, step: '1' })} />}
            {step === 1 && <BarberStep barbers={barbers.data} value={p.barber} onPick={(id) => set({ b: id, t: null, d: null, step: '2' })} />}
            {step === 2 && p.service && (
              <WhenStep
                serviceId={p.service}
                barberId={barberParam}
                date={p.date}
                slot={p.slot}
                onDate={pickDate}
                onSlot={(s) => set({ t: s.starts_at, step: '3' })}
              />
            )}
            {step === 3 && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-line bg-coal p-6">
                  <p className="label mb-2">Todo listo</p>
                  <p className="text-ash">Revisa tu ticket y deja tu móvil: Edgar te llamará si hay cualquier cambio.</p>
                </div>
                {user && (
                  <Field label="Teléfono de contacto" error={phoneValue && !phoneOk ? 'Teléfono no válido' : undefined} hint="Obligatorio.">
                    <Input
                      id="book-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      placeholder="+34 600 000 000"
                      value={phoneValue}
                      aria-invalid={!!phoneValue && !phoneOk}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field>
                )}
                <label className="block space-y-2">
                  <span className="label">Notas para el barbero (opcional)</span>
                  <Textarea maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej.: degradado bajo, dejar volumen arriba…" />
                </label>
                <Button size="lg" className="w-full sm:w-auto" onClick={confirm} loading={book.isPending} disabled={!!user && !phoneOk}>
                  {user ? 'Confirmar reserva' : 'Entrar y confirmar'} <ArrowRight className="size-5" />
                </Button>
              </div>
            )}
          </div>

          {step > first && (
            <button onClick={() => go(step - 1)} className="inline-flex items-center gap-2 text-sm font-semibold text-ash hover:text-bone">
              <ArrowLeft className="size-4" /> Paso anterior
            </button>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="label mb-4 flex items-center gap-2">
            <TicketIcon className="size-3.5" /> Tu ticket
          </p>
          <TicketCard
            service={service}
            barber={barber === 'any' && slot ? (barbers.data?.find((b) => b.id === slot.barber_ids[0]) ?? 'any') : barber}
            slot={p.slot}
          />
        </aside>
      </div>
    </div>
  )
}
