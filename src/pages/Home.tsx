import { clsx } from 'clsx'
import { ArrowRight, CalendarCheck, Phone, Scissors, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { InstallCard } from '../components/InstallCard'
import { Marquee, Reveal, Spotlight } from '../components/motion'
import { Monogram, Pole, SectionTitle, Skeleton } from '../components/ui'
import { dayParts, duration, minutesToHHMM, time, todayInShop, WEEKDAYS } from '../lib/format'
import { useBarbers, useDays, useServices, useSlots } from '../lib/queries'
import type { Barber } from '../lib/types'

/** Primer servicio y barbero (la barbería tiene uno de cada) y los próximos días con hueco. */
function useAvailability() {
  const services = useServices()
  const barbers = useBarbers()
  const serviceId = services.data?.[0]?.id ?? null
  const barberId = barbers.data?.length === 1 ? barbers.data[0]!.id : null
  // Un mes vista (máximo de la API): así la tira tiene días aunque se abra pocos días a la semana.
  const days = useDays(serviceId, barberId, 31)
  const firstFree = days.data?.find((d) => d.free > 0)
  const slots = useSlots(serviceId, barberId, firstFree?.date ?? null)
  const next = slots.data?.[0]
  return { serviceId, barberId, days: days.data, firstFree, next, loading: days.isLoading || (!!firstFree && slots.isLoading) }
}

const relDay = (ymd: string) => {
  const today = todayInShop()
  if (ymd === today) return 'Hoy'
  const d = new Date(`${today}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  if (ymd === d.toISOString().slice(0, 10)) return 'Mañana'
  const p = dayParts(ymd)
  return `${p.weekday} ${p.day} ${p.month}`
}

/** Ticket flotante con el próximo hueco libre: un toque y vas directo a confirmar. */
function NextSlot() {
  const a = useAvailability()
  const href =
    a.next && a.serviceId
      ? `/reservar?${new URLSearchParams({
          s: a.serviceId,
          ...(a.barberId ? { b: a.barberId } : {}),
          d: a.firstFree!.date,
          t: a.next.starts_at,
          step: '3',
        })}`
      : '/reservar'
  return (
    <Link
      to={href}
      className="group animate-float relative block w-72 rotate-[-3deg] rounded-3xl bg-bone p-6 text-ink shadow-[0_30px_80px_-20px_rgb(0_0_0/.8)] transition-transform hover:rotate-0"
    >
      <p className="font-mono text-[0.65rem] tracking-[0.18em] text-dust uppercase">Próximo hueco libre</p>
      {a.loading ? (
        <div className="mt-3 h-16 animate-pulse rounded-xl bg-ink/10" />
      ) : a.next ? (
        <>
          <p className="mt-2 font-display text-3xl leading-none font-black uppercase">{relDay(a.firstFree!.date)}</p>
          <p className="font-display text-7xl leading-none font-black tabular-nums">{time(a.next.starts_at)}</p>
          <p className="mt-1 text-sm text-dust">{a.firstFree!.free === 1 ? 'Último hueco del día' : `${a.firstFree!.free} huecos ese día`}</p>
        </>
      ) : (
        <p className="mt-3 font-display text-3xl font-black uppercase">Agenda llena</p>
      )}
      <div className="my-4 border-t-2 border-dashed border-ink/15" />
      <span className="flex items-center justify-between font-bold">
        {a.next ? 'Reservar este' : 'Ver otros días'} <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

function Hero() {
  return (
    <section className="grain relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-end gap-12 px-5 pt-14 pb-20 lg:grid-cols-[1.25fr_1fr] lg:pt-24">
        <div className="animate-rise space-y-8">
          <p className="label flex items-center gap-3">
            <span className="size-2 animate-pulse rounded-full bg-[#9dc086]" /> Reservas abiertas
          </p>
          <h1 className="font-display text-[clamp(4.2rem,13vw,10.5rem)] leading-[0.82] font-black tracking-[-0.02em] uppercase">
            Corte
            <br />
            <em className="font-serif text-[0.82em] font-normal tracking-normal text-brass normal-case italic lg:text-[0.68em]">personalizado</em>
          </h1>
          <p className="max-w-md text-lg text-ash">Elige día y hora para tu corte con Edgar. Ves los huecos libres al momento y reservas sin llamar.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/reservar"
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-brass px-8 font-bold text-ink transition-colors hover:bg-bone"
            >
              Reservar mi cita <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#carta" className="inline-flex h-14 items-center rounded-full px-6 font-semibold text-ash hover:text-bone">
              Ver horario
            </a>
          </div>
        </div>

        {/* Poste de barbero gigante con el ticket del próximo hueco encima */}
        <div className="relative justify-self-center lg:hidden">
          <NextSlot />
        </div>
        <div className="relative hidden h-[480px] justify-self-center lg:block">
          <div className="absolute top-1/2 -left-48 z-10 -translate-y-1/2">
            <NextSlot />
          </div>
          <div className="absolute -inset-16 rounded-full bg-brass/10 blur-3xl" aria-hidden />
          <div className="relative flex h-full flex-col items-center" aria-hidden>
            <div className="h-10 w-28 rounded-t-[2rem] border border-brass/60 bg-gradient-to-b from-brass to-brass-deep" />
            <div className="relative h-full w-24 overflow-hidden border-x border-brass/60 bg-bone/90">
              <div className="pole animate-pole absolute inset-0 [background-size:100%_56px] [animation-duration:2.4s]" />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/50 via-transparent to-ink/60" />
            </div>
            <div className="h-10 w-28 rounded-b-[2rem] border border-brass/60 bg-gradient-to-t from-brass to-brass-deep" />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Disponibilidad de los próximos días: cada barra se llena según los huecos libres de ese día. */
function Week() {
  const a = useAvailability()
  // Solo días con horas reservables; los cerrados no se muestran.
  const days = (a.days ?? []).filter((d) => d.total > 0).slice(0, 14)
  if (!a.loading && days.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl px-5 pt-20">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="Disponibilidad" title="Próximos" accent="días" />
          <p className="flex items-center gap-2 text-sm text-ash">
            <Zap className="size-4 text-brass" /> Se actualiza en tiempo real
          </p>
        </div>
      </Reveal>
      <div className="-mx-5 mt-8 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
        {a.loading && Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-40 w-24 shrink-0" />)}
        {days.map((d, i) => {
          const p = dayParts(d.date)
          const pct = d.total ? (d.free / d.total) * 100 : 0
          const href = a.serviceId
            ? `/reservar?${new URLSearchParams({ s: a.serviceId, ...(a.barberId ? { b: a.barberId } : {}), d: d.date, step: '2' })}`
            : '/reservar'
          return (
            <Link
              key={d.date}
              to={d.free ? href : '#'}
              aria-disabled={!d.free}
              className={clsx(
                'group flex w-24 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border p-3 transition-all',
                d.free ? 'border-line bg-coal hover:-translate-y-1 hover:border-brass' : 'pointer-events-none border-line/50 opacity-40',
              )}
              style={{ animation: `rise .5s ${i * 40}ms both cubic-bezier(.2,.7,.2,1)` }}
            >
              <span className="font-mono text-[0.65rem] text-ash uppercase">{p.weekday}</span>
              <span className="font-display text-4xl leading-none font-black group-hover:text-brass">{p.day}</span>
              <span className="font-mono text-[0.6rem] text-dust uppercase">{p.month}</span>
              <span className="relative h-1.5 w-full overflow-hidden rounded-full bg-smoke">
                <span
                  className="animate-fill absolute inset-y-0 left-0 origin-left rounded-full bg-brass"
                  style={{ width: `${pct}%`, animationDelay: `${300 + i * 40}ms` }}
                />
              </span>
              <span className="font-mono text-[0.65rem] text-ash">{d.free ? `${d.free} libres` : 'Lleno'}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function Carta() {
  const { data: services, isLoading } = useServices()
  return (
    <section id="carta" className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <Reveal className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <SectionTitle eyebrow="El servicio" title="Corte" accent="con Edgar" />
          <p className="max-w-sm text-ash">Citas de {services?.[0] ? duration(services[0].duration_min) : '30 min'}.</p>
        </Reveal>
        <ol className="divide-y divide-line border-y border-line">
          {isLoading &&
            Array.from({ length: 1 }).map((_, i) => (
              <li key={i} className="py-6">
                <Skeleton className="h-8" />
              </li>
            ))}
          {services?.map((s, i) => (
            <li key={s.id} className="group">
              <Link to={`/reservar?s=${s.id}`} className="flex flex-col gap-1 py-6 transition-colors">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-xs text-dust">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-3xl font-bold uppercase transition-colors group-hover:text-brass">{s.name}</span>
                  <span className="leader" />
                  <span className="font-mono text-xl text-brass">{duration(s.duration_min)}</span>
                </div>
                <div className="flex items-center justify-between pl-9 text-sm text-ash">
                  <span>{s.description}</span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function schedule(b: Barber) {
  const days = [...new Set(b.hours.map((h) => h.weekday))].sort((a, z) => ((a + 6) % 7) - ((z + 6) % 7))
  const first = b.hours[0]
  return {
    days: days.map((d) => WEEKDAYS[d]),
    from: first && minutesToHHMM(Math.min(...b.hours.map((h) => h.start_min))),
    to: first && minutesToHHMM(Math.max(...b.hours.map((h) => h.end_min))),
  }
}

function Edgar() {
  const { data: barbers, isLoading } = useBarbers()
  const b = barbers?.[0]
  if (isLoading) return <Skeleton className="mx-auto mt-28 h-72 max-w-7xl" />
  if (!b) return null
  const s = schedule(b)
  return (
    <Reveal className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-28">
      <section id="equipo">
        <Spotlight className="grid items-center gap-10 rounded-[2rem] border border-line bg-coal p-8 sm:p-12 md:grid-cols-[auto_1fr_auto]">
          <Monogram name={b.name} src={b.avatar_url} className="size-28 text-5xl" />
          <div className="space-y-3">
            <p className="label text-brass">{b.title || 'Barbero'}</p>
            <h2 className="font-display text-6xl leading-none font-black uppercase">{b.name}</h2>
            {b.bio && <p className="max-w-xl text-ash">{b.bio}</p>}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {s.days.map((d) => (
                <span key={d} className="rounded-md border border-line px-2 py-0.5 font-mono text-[0.7rem] text-ash">
                  {d}
                </span>
              ))}
              {s.from && (
                <span className="px-1 font-mono text-[0.7rem] text-dust">
                  {s.from}–{s.to}
                </span>
              )}
            </div>
          </div>
          <Link to="/reservar" className="inline-flex h-12 items-center gap-2 justify-self-start rounded-full bg-brass px-6 font-bold text-ink hover:bg-bone">
            <Scissors className="size-4" /> Reservar
          </Link>
        </Spotlight>
      </section>
    </Reveal>
  )
}

function Ritual() {
  const steps = [
    { n: 'I', t: 'Elige', d: 'Día y hora entre los huecos libres.', icon: CalendarCheck },
    { n: 'II', t: 'Confirma', d: 'Con tu móvil, por si Edgar necesita avisarte.', icon: Phone },
    { n: 'III', t: 'Ven', d: 'A la hora de tu cita, directo a la silla.', icon: Scissors },
  ]
  return (
    <section className="mx-auto max-w-7xl px-5 pt-28">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-coal p-8 sm:p-14">
        <Pole className="absolute top-0 left-0 h-full w-2 rounded-none" />
        <SectionTitle eyebrow="Cómo funciona" title="Tres pasos." accent="Sin llamadas." />
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120} className="space-y-3">
              <span className="flex items-center gap-3 font-serif text-5xl text-brass italic">
                {s.n} <s.icon className="size-5" aria-hidden />
              </span>
              <h3 className="font-display text-3xl font-bold uppercase">{s.t}</h3>
              <p className="text-ash">{s.d}</p>
            </Reveal>
          ))}
        </div>
        <Link
          to="/reservar"
          className="mt-12 inline-flex h-12 items-center gap-3 rounded-full border border-brass px-7 font-bold text-brass transition-colors hover:bg-brass hover:text-ink"
        >
          <Scissors className="size-4" /> Empezar ahora
        </Link>
      </div>
    </section>
  )
}

export default function Home() {
  const { hash } = useLocation()
  // Enlaces a secciones (/#carta, /#equipo) desde otras pantallas.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])
  return (
    <>
      <InstallCard />
      <Hero />
      <Marquee
        className="border-y border-line bg-coal py-4 font-display text-3xl font-black tracking-wide text-ash uppercase"
        items={['Reserva online', 'Avisos al móvil', 'Sin llamadas']}
      />
      <Week />
      <Carta />
      <Edgar />
      <Ritual />
    </>
  )
}
