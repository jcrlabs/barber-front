import { clsx } from 'clsx'
import { CalendarOff, ChevronLeft, ChevronRight, Clock, Lock, Save, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Field, Input, Modal, Select, Skeleton } from '../../components/ui'
import { api, errorMessage } from '../../lib/api'
import { dayParts, hhmmToMinutes, longDate, minutesToHHMM, todayInShop, WEEKDAYS } from '../../lib/format'
import { useAdminBarbers, useAdminMutation, useOverrides } from '../../lib/queries'
import type { Barber, DayOverride, OverrideKind, WorkingHours } from '../../lib/types'
import { HoursEditor } from './AdminBarbers'

const KIND: Record<OverrideKind, { label: string; hint: string; icon: typeof Lock; cls: string }> = {
  closed: {
    label: 'Cerrado',
    hint: 'No se aceptan reservas ese día.',
    icon: CalendarOff,
    cls: 'bg-blood/25 text-[#e2786c] border-blood/50',
  },
  open: {
    label: 'Horario especial',
    hint: 'Sustituye al horario semanal solo ese día.',
    icon: Clock,
    cls: 'bg-brass/20 text-brass border-brass/50',
  },
  block: {
    label: 'Bloquear franja',
    hint: 'Quita unas horas concretas (descanso, recado…).',
    icon: Lock,
    cls: 'bg-smoke text-bone border-line',
  },
}

const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Rejilla mensual (lunes primero) con los días que tienen excepciones marcados. */
function MonthGrid({ month, overrides, onPick }: { month: string; overrides: DayOverride[]; onPick: (ymd: string) => void }) {
  const today = todayInShop()
  const first = `${month}-01`
  const lead = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7
  const daysIn = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate()
  const cells = [...Array<null>(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => addDays(first, i))]
  const byDay = useMemo(() => {
    const m = new Map<string, DayOverride[]>()
    overrides.forEach((o) => m.set(o.day, [...(m.get(o.day) ?? []), o]))
    return m
  }, [overrides])

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
        <span key={d} className="pb-1 text-center font-mono text-[0.65rem] text-dust uppercase">
          {WEEKDAYS[d]}
        </span>
      ))}
      {cells.map((ymd, i) => {
        if (!ymd) return <span key={`e${i}`} />
        const list = byDay.get(ymd) ?? []
        const closed = list.some((o) => o.kind === 'closed')
        const past = ymd < today
        return (
          <button
            key={ymd}
            type="button"
            disabled={past}
            onClick={() => onPick(ymd)}
            className={clsx(
              'relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-colors disabled:opacity-30',
              closed ? KIND.closed.cls : list.length ? KIND.open.cls : 'border-line hover:border-brass',
              ymd === today && 'ring-2 ring-brass/60',
            )}
            aria-label={`${longDate(`${ymd}T12:00:00Z`)}${list.length ? ` · ${list.length} excepciones` : ''}`}
          >
            {Number(ymd.slice(8))}
            {list.length > 0 && !closed && <span className="absolute bottom-1.5 size-1.5 rounded-full bg-current" />}
          </button>
        )
      })}
    </div>
  )
}

function OverrideForm({ day, barbers, existing, onDone }: { day: string; barbers: Barber[]; existing: DayOverride[]; onDone: () => void }) {
  const [kind, setKind] = useState<OverrideKind>('closed')
  const [scope, setScope] = useState('')
  const [start, setStart] = useState('10:00')
  const [end, setEnd] = useState('14:00')
  const [note, setNote] = useState('')
  const create = useAdminMutation(() =>
    api('/admin/overrides', {
      method: 'POST',
      json: {
        day,
        kind,
        barber_id: scope || null,
        note,
        ...(kind === 'closed' ? {} : { start_min: hhmmToMinutes(start), end_min: hhmmToMinutes(end) }),
      },
    }),
  )
  const del = useAdminMutation((id: string) => api(`/admin/overrides/${id}`, { method: 'DELETE' }))
  const name = (id: string | null) => (id ? (barbers.find((b) => b.id === id)?.name ?? 'Barbero') : 'Toda la barbería')

  return (
    <div className="space-y-6">
      {existing.length > 0 && (
        <ul className="space-y-2">
          {existing.map((o) => {
            const K = KIND[o.kind]
            return (
              <li key={o.id} className={clsx('flex items-center gap-3 rounded-xl border px-3 py-2 text-sm', K.cls)}>
                <K.icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <b>{K.label}</b>
                  {o.start_min !== null && o.end_min !== null && ` · ${minutesToHHMM(o.start_min)}–${minutesToHHMM(o.end_min)}`} · {name(o.barber_id)}
                  {o.note && <span className="block text-xs opacity-80">{o.note}</span>}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    del.mutateAsync(o.id).then(
                      () => toast.success('Excepción eliminada'),
                      (e) => toast.error(errorMessage(e)),
                    )
                  }
                  className="rounded-full p-1.5 hover:bg-ink/40"
                  aria-label="Eliminar excepción"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (kind !== 'closed' && hhmmToMinutes(start) >= hhmmToMinutes(end)) {
            toast.error('La hora de inicio debe ser anterior a la de fin')
            return
          }
          try {
            await create.mutateAsync(undefined)
            toast.success('Horario actualizado')
            onDone()
          } catch (err) {
            toast.error(errorMessage(err))
          }
        }}
      >
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tipo de excepción">
          {(Object.keys(KIND) as OverrideKind[]).map((k) => {
            const K = KIND[k]
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={clsx(
                  'space-y-1 rounded-2xl border p-3 text-left transition-colors',
                  kind === k ? 'border-brass bg-smoke' : 'border-line hover:border-ash',
                )}
              >
                <K.icon className={clsx('size-5', kind === k ? 'text-brass' : 'text-ash')} />
                <p className="text-sm font-bold">{K.label}</p>
                <p className="text-xs text-dust">{K.hint}</p>
              </button>
            )
          })}
        </div>
        {kind !== 'closed' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde">
              <Input type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} required />
            </Field>
            <Field label="Hasta">
              <Input type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} required />
            </Field>
          </div>
        )}
        {barbers.length > 1 && (
          <Field label="Aplica a">
            <Select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="">Toda la barbería</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Nota (opcional)">
          <Input maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Festivo, vacaciones, formación…" />
        </Field>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cerrar
          </Button>
          <Button type="submit" loading={create.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </div>
  )
}

function WeeklyHours({ barber }: { barber: Barber }) {
  const [hours, setHours] = useState<WorkingHours[]>(barber.hours)
  const dirty = JSON.stringify(hours) !== JSON.stringify(barber.hours)
  const save = useAdminMutation(() =>
    api(`/admin/barbers/${barber.id}`, {
      method: 'PUT',
      json: {
        name: barber.name,
        title: barber.title,
        bio: barber.bio,
        avatar_url: barber.avatar_url,
        active: barber.active ?? true,
        user_id: barber.user_id ?? null,
        hours,
      },
    }),
  )
  return (
    <div className="space-y-4">
      <HoursEditor value={hours} onChange={setHours} />
      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-dust">Cambios sin guardar</span>}
        <Button
          size="sm"
          disabled={!dirty}
          loading={save.isPending}
          onClick={() =>
            save.mutateAsync(undefined).then(
              () => toast.success('Horario semanal guardado'),
              (e) => toast.error(errorMessage(e)),
            )
          }
        >
          <Save className="size-4" /> Guardar horario
        </Button>
      </div>
    </div>
  )
}

export function AdminSchedule() {
  const barbers = useAdminBarbers()
  const overrides = useOverrides()
  const [barberId, setBarberId] = useState('')
  const [month, setMonth] = useState(todayInShop().slice(0, 7))
  const [day, setDay] = useState<string | null>(null)

  const list = barbers.data ?? []
  const barber = list.find((b) => b.id === barberId) ?? list[0]
  const shiftMonth = (n: number) => {
    const d = new Date(`${month}-15T12:00:00Z`)
    d.setUTCMonth(d.getUTCMonth() + n)
    setMonth(d.toISOString().slice(0, 7))
  }
  const thisMonth = todayInShop().slice(0, 7)
  const upcoming = (overrides.data ?? []).slice(0, 12)
  const monthLabel = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-15T12:00:00Z`))

  if (barbers.isLoading) return <Skeleton className="h-80" />

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-4 rounded-3xl border border-line bg-coal p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label">Horario semanal</p>
            <p className="text-sm text-ash">Los días y horas en que se puede reservar cada semana.</p>
          </div>
          {list.length > 1 && (
            <div className="w-48">
              <Select value={barber?.id ?? ''} onChange={(e) => setBarberId(e.target.value)} aria-label="Barbero">
                {list.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
        {barber ? (
          <WeeklyHours key={barber.id + JSON.stringify(barber.hours)} barber={barber} />
        ) : (
          <p className="text-sm text-dust">Crea primero un barbero en la pestaña Equipo.</p>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-line bg-coal p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="label">Días especiales</p>
            <p className="text-sm text-ash">Toca un día para cerrarlo, cambiar su horario o bloquear horas.</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftMonth(-1)}
              disabled={month <= thisMonth}
              className="rounded-full p-2 hover:bg-smoke disabled:opacity-30"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => shiftMonth(1)} className="rounded-full p-2 hover:bg-smoke" aria-label="Mes siguiente">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <p className="font-display text-2xl font-bold uppercase">{monthLabel}</p>
        <MonthGrid month={month} overrides={overrides.data ?? []} onPick={setDay} />
        <div className="flex flex-wrap gap-3 pt-1 text-xs text-ash">
          <span className="flex items-center gap-1.5">
            <span className={clsx('size-3 rounded border', KIND.closed.cls)} /> Cerrado
          </span>
          <span className="flex items-center gap-1.5">
            <span className={clsx('size-3 rounded border', KIND.open.cls)} /> Horario cambiado
          </span>
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-3 lg:col-span-2">
          <p className="label">Próximas excepciones</p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((o) => {
              const K = KIND[o.kind]
              const p = dayParts(o.day)
              return (
                <li key={o.id}>
                  <button
                    onClick={() => setDay(o.day)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-line bg-coal p-3 text-left hover:border-brass"
                  >
                    <span className="grid w-12 place-items-center rounded-lg border border-line py-1">
                      <span className="font-mono text-[0.6rem] text-ash uppercase">{p.weekday}</span>
                      <span className="font-display text-xl leading-none font-black">{p.day}</span>
                    </span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="flex items-center gap-1.5 font-bold">
                        <K.icon className="size-3.5" /> {K.label}
                      </span>
                      <span className="block truncate text-xs text-dust">
                        {o.start_min !== null && o.end_min !== null ? `${minutesToHHMM(o.start_min)}–${minutesToHHMM(o.end_min)} · ` : ''}
                        {o.barber_id ? list.find((b) => b.id === o.barber_id)?.name : 'Toda la barbería'}
                        {o.note && ` · ${o.note}`}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <Modal open={!!day} onClose={() => setDay(null)} title={day ? longDate(`${day}T12:00:00Z`) : ''}>
        {day && <OverrideForm key={day} day={day} barbers={list} existing={(overrides.data ?? []).filter((o) => o.day === day)} onDone={() => setDay(null)} />}
      </Modal>
    </div>
  )
}
