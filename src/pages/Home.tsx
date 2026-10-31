import { ArrowRight, CalendarCheck, Phone, Scissors } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { InstallCard } from '../components/InstallCard'
import { Monogram, Pole, SectionTitle, Skeleton } from '../components/ui'
import { duration, minutesToHHMM, money, WEEKDAYS } from '../lib/format'
import { useBarbers, useServices } from '../lib/queries'
import type { Barber } from '../lib/types'

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
            <span className="text-stroke">de</span> <em className="font-serif font-normal tracking-normal text-brass normal-case italic">precisión</em>
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
              Precio y horario
            </a>
          </div>
        </div>

        {/* Poste de barbero gigante: elemento de marca */}
        <div className="relative hidden h-[480px] justify-self-center lg:block" aria-hidden>
          <div className="absolute -inset-16 rounded-full bg-brass/10 blur-3xl" />
          <div className="relative flex h-full flex-col items-center">
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

function Carta() {
  const { data: services, isLoading } = useServices()
  return (
    <section id="carta" className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <SectionTitle eyebrow="El servicio" title="Corte" accent="con Edgar" />
          <p className="max-w-sm text-ash">Precio cerrado y citas de {services?.[0] ? duration(services[0].duration_min) : '30 min'}.</p>
        </div>
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
                  <span className="font-mono text-xl text-brass">{money(s.price_cents)}</span>
                </div>
                <div className="flex items-center justify-between pl-9 text-sm text-ash">
                  <span>{s.description}</span>
                  <span className="shrink-0 pl-4 font-mono text-xs">{duration(s.duration_min)}</span>
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
    <section id="equipo" className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-28">
      <div className="grid items-center gap-10 rounded-[2rem] border border-line bg-coal p-8 sm:p-12 md:grid-cols-[auto_1fr_auto]">
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
      </div>
    </section>
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
          {steps.map((s) => (
            <div key={s.n} className="space-y-3">
              <span className="flex items-center gap-3 font-serif text-5xl text-brass italic">
                {s.n} <s.icon className="size-5" aria-hidden />
              </span>
              <h3 className="font-display text-3xl font-bold uppercase">{s.t}</h3>
              <p className="text-ash">{s.d}</p>
            </div>
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
      <Carta />
      <Edgar />
      <Ritual />
    </>
  )
}
