import { clsx } from 'clsx'
import { BellRing, CalendarClock, Check, Copy, ExternalLink, Mail, MessageCircle, Send, Smartphone, Unlink, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button, EmptyState, Field, Input, Monogram, Skeleton } from '../components/ui'
import { api, ApiError, errorMessage } from '../lib/api'
import { longDate, time, todayInShop } from '../lib/format'
import { useAdminMutation, useAgenda, useStaffMe } from '../lib/queries'
import { isAdmin } from '../lib/roles'
import type { ChannelResult, NotifySettings, StaffMe } from '../lib/types'
import { useNow } from '../lib/useNow'
import { useAuth } from '../store/auth'
import { ScheduleBoard } from './admin/AdminSchedule'

const tomorrow = (ymd: string) => {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

const countdown = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60_000))
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`
}

/** Resumen de hoy: citas que quedan y cuenta atrás hasta la siguiente. */
function Today({ me }: { me: StaffMe }) {
  const today = todayInShop()
  const { data } = useAgenda(today, tomorrow(today))
  const now = useNow(30_000)
  const active = (data ?? []).filter((a) => a.status !== 'cancelled')
  const left = active.filter((a) => new Date(a.ends_at).getTime() > now)
  const next = left[0]
  const done = active.length - left.length

  return (
    <section className="grain relative overflow-hidden rounded-[2rem] border border-line bg-coal p-6 sm:p-10">
      <div className="pole animate-pole absolute top-0 left-0 h-1.5 w-full opacity-80" aria-hidden />
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="flex items-center gap-5">
          <Monogram name={me.barber.name} src={me.barber.avatar_url} className="size-20 text-3xl" />
          <div className="space-y-1">
            <p className="label">Hola,</p>
            <h1 className="font-display text-5xl leading-none font-black uppercase sm:text-6xl">{me.barber.name}</h1>
            <p className="text-sm text-ash first-letter:uppercase">{longDate(new Date().toISOString())}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { k: 'Hoy', v: active.length },
            { k: 'Quedan', v: left.length },
            { k: 'Hechas', v: done },
          ].map((s, i) => (
            <div key={s.k} className="animate-rise rounded-2xl border border-line bg-ink/60 px-5 py-4" style={{ animationDelay: `${i * 80}ms` }}>
              <p className="font-display text-4xl leading-none font-black text-brass tabular-nums">{s.v}</p>
              <p className="label mt-1">{s.k}</p>
            </div>
          ))}
        </div>
      </div>
      {next ? (
        <Link
          to="/agenda"
          className="group mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-brass/40 bg-brass/10 p-4 transition-colors hover:bg-brass/15"
        >
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brass opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-brass" />
          </span>
          <span className="font-mono text-xl font-bold">{time(next.starts_at)}</span>
          <span className="min-w-0 flex-1 truncate font-semibold">{next.client_name}</span>
          <span className="label text-brass">
            {new Date(next.starts_at).getTime() <= now ? 'En curso' : `En ${countdown(new Date(next.starts_at).getTime() - now)}`}
          </span>
        </Link>
      ) : (
        <p className="mt-8 text-sm text-ash">No te quedan citas hoy.</p>
      )}
    </section>
  )
}

function CopyField({ value }: { value: string }) {
  const [ok, setOk] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-ink px-3 py-2">
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-bone">{value}</code>
      <button
        type="button"
        onClick={() =>
          navigator.clipboard?.writeText(value).then(() => {
            setOk(true)
            setTimeout(() => setOk(false), 1500)
          })
        }
        className="rounded-full p-1.5 text-ash hover:bg-smoke hover:text-bone"
        aria-label="Copiar"
      >
        {ok ? <Check className="size-4 text-brass" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}

function Channel({ icon, title, on, children }: { icon: ReactNode; title: string; on: boolean; children: ReactNode }) {
  return (
    <section className={clsx('space-y-4 rounded-3xl border bg-coal p-6 transition-colors', on ? 'border-brass/50' : 'border-line')}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-display text-2xl font-bold uppercase">
          <span className="text-brass">{icon}</span> {title}
        </p>
        <span
          className={clsx('rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] tracking-wider uppercase', on ? 'bg-brass/20 text-brass' : 'bg-smoke text-dust')}
        >
          {on ? 'Activo' : 'Apagado'}
        </span>
      </div>
      {children}
    </section>
  )
}

const resultLabel: Record<ChannelResult, string> = { ok: 'enviado', error: 'falló', off: 'apagado' }

function NotifyPanel({ me }: { me: StaffMe }) {
  const user = useAuth((s) => s.user)
  const n = me.notify
  const [form, setForm] = useState({
    email: n.email,
    whatsapp_phone: n.whatsapp_phone || user?.phone || '',
    callmebot_key: n.callmebot_key,
  })
  const [results, setResults] = useState<Record<string, ChannelResult> | null>(null)
  const dirty = form.email !== n.email || form.whatsapp_phone !== n.whatsapp_phone || form.callmebot_key !== n.callmebot_key
  const save = useAdminMutation(() => api<NotifySettings>('/staff/me/notify', { method: 'PUT', json: form }))
  const test = useAdminMutation(() => api<{ results: Record<string, ChannelResult> }>('/staff/me/notify/test', { method: 'POST' }))

  const submit = async () => {
    try {
      await save.mutateAsync(undefined)
      toast.success('Avisos guardados')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }
  const runTest = async () => {
    try {
      if (dirty) await save.mutateAsync(undefined)
      const r = (await test.mutateAsync(undefined)) as { results: Record<string, ChannelResult> }
      setResults(r.results)
      toast.success('Aviso de prueba enviado')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ash">
        Cada vez que alguien reserve o anule una cita contigo te llega un aviso con su nombre, la hora y botones para llamarle o escribirle por WhatsApp. Activa
        los canales que quieras.
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        <Channel icon={<Smartphone className="size-5" />} title="Móvil" on={!!n.ntfy_url}>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ash">
            <li>
              Instala <b className="text-bone">ntfy</b> (gratis) en{' '}
              <a className="text-brass underline" href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noreferrer">
                Android
              </a>{' '}
              o{' '}
              <a className="text-brass underline" href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noreferrer">
                iPhone
              </a>
              .
            </li>
            <li>Pulsa “+” y suscríbete a este canal privado:</li>
          </ol>
          <CopyField value={n.ntfy_topic} />
          <a href={n.ntfy_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-ash hover:text-brass">
            <ExternalLink className="size-3.5" /> O ábrelo en el navegador
          </a>
        </Channel>

        <Channel icon={<Mail className="size-5" />} title="Email" on={n.email_enabled && !!n.email}>
          <Field label="Tu email" hint={n.email_enabled ? undefined : 'El servidor aún no tiene el correo activado; se guardará para cuando lo esté.'}>
            <Input type="email" maxLength={254} placeholder={user?.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          {!form.email && user?.email.includes('@') && (
            <button type="button" className="text-xs text-brass hover:underline" onClick={() => setForm({ ...form, email: user.email })}>
              Usar {user.email}
            </button>
          )}
        </Channel>

        <Channel icon={<MessageCircle className="size-5" />} title="WhatsApp" on={!!n.whatsapp_phone && !!n.callmebot_key}>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ash">
            <li>
              Sigue los pasos de{' '}
              <a className="text-brass underline" href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noreferrer">
                CallMeBot
              </a>{' '}
              (gratis): guarda su número y mándale el mensaje de activación.
            </li>
            <li>Te responde con tu API key: pégala aquí.</li>
          </ol>
          <div className="grid gap-3">
            <Field label="Tu WhatsApp">
              <Input type="tel" inputMode="tel" value={form.whatsapp_phone} onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })} />
            </Field>
            <Field label="API key">
              <Input
                inputMode="numeric"
                maxLength={40}
                value={form.callmebot_key}
                onChange={(e) => setForm({ ...form, callmebot_key: e.target.value.replace(/[^a-zA-Z0-9]/g, '') })}
              />
            </Field>
          </div>
        </Channel>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-3xl border border-line bg-coal p-4">
        {results && (
          <ul className="mr-auto flex flex-wrap gap-2 text-xs">
            {Object.entries(results).map(([ch, r]) => (
              <li
                key={ch}
                className={clsx(
                  'flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono uppercase',
                  r === 'ok' ? 'border-moss/40 text-[#9dc086]' : r === 'error' ? 'border-blood/50 text-[#e2786c]' : 'border-line text-dust',
                )}
              >
                {r === 'ok' ? <Check className="size-3" /> : r === 'error' ? <X className="size-3" /> : null} {ch} · {resultLabel[r]}
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" onClick={runTest} loading={test.isPending}>
          <Send className="size-4" /> Enviar prueba
        </Button>
        <Button onClick={submit} disabled={!dirty} loading={save.isPending}>
          Guardar avisos
        </Button>
      </div>
      <p className="flex items-center gap-2 text-xs text-dust">
        <BellRing className="size-3.5" /> La campana de arriba también suena con el panel abierto.
      </p>
    </div>
  )
}

const tabs = [
  { id: 'horario', label: 'Mi horario', icon: CalendarClock },
  { id: 'avisos', label: 'Avisos', icon: BellRing },
] as const

export default function BarberPanel() {
  const user = useAuth((s) => s.user)
  const me = useStaffMe()
  const [params, setParams] = useSearchParams()
  const current = tabs.find((t) => t.id === params.get('tab')) ?? tabs[0]

  if (me.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-12">
        <Skeleton className="h-56" />
        <Skeleton className="h-96" />
      </div>
    )
  }
  if (me.error || !me.data) {
    const notLinked = me.error instanceof ApiError && me.error.code === 'not_linked'
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <EmptyState icon={<Unlink className="size-8" />} title={notLinked ? 'Sin perfil de barbero' : 'No se pudo cargar'}>
          {notLinked ? (
            <>
              {isAdmin(user) ? (
                <>
                  Enlaza tu cuenta a un barbero en{' '}
                  <Link className="text-brass underline" to="/admin?tab=equipo">
                    Admin → Barbero
                  </Link>{' '}
                  para tener tu propio panel.
                </>
              ) : (
                'Pide al administrador que enlace tu cuenta a tu ficha de barbero.'
              )}
            </>
          ) : (
            errorMessage(me.error)
          )}
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-12">
      <Today me={me.data} />
      <nav className="-mx-5 flex gap-1 overflow-x-auto border-b border-line px-5" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === current.id}
            onClick={() => setParams({ tab: t.id })}
            className={clsx(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
              t.id === current.id ? 'border-brass text-brass' : 'border-transparent text-ash hover:text-bone',
            )}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </nav>
      <div key={current.id} className="animate-rise">
        {current.id === 'horario' ? <ScheduleBoard barbers={[me.data.barber]} self /> : <NotifyPanel key={JSON.stringify(me.data.notify)} me={me.data} />}
      </div>
    </div>
  )
}
