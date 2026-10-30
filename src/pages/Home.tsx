import { ArrowRight, CalendarCheck, Scissors, Sparkles, Timer } from 'lucide-react'
import { Link } from 'react-router'
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
            <span className="size-2 animate-pulse rounded-full bg-[#9dc086]" /> Reservas abiertas · respuesta inmediata
          </p>
          <h1 className="font-display text-[clamp(4.2rem,13vw,10.5rem)] leading-[0.82] font-black tracking-[-0.02em] uppercase">
            Corte
            <br />
            <span className="text-stroke">de</span>{' '}
            <em className="font-serif font-normal tracking-normal text-brass normal-case italic">precisión</em>
          </h1>
          <p className="max-w-md text-lg text-ash">
            Elige servicio, barbero y hora en menos de 30 segundos. Sin llamadas, sin esperas, con recordatorio de tu ticket.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/reservar" className="group inline-flex h-14 items-center gap-3 rounded-full bg-brass px-8 font-bold text-ink transition-colors hover:bg-bone">
              Reservar mi cita <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#carta" className="inline-flex h-14 items-center rounded-full px-6 font-semibold text-ash hover:text-bone">
              Ver la carta
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

      <div className="border-y border-line bg-coal/60">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-line px-5 sm:grid-cols-3 sm:divide-x">
          {[
            { icon: Timer, k: '30 s', v: 'para reservar' },
            { icon: CalendarCheck, k: '2 h', v: 'cancelación gratuita' },
            { icon: Sparkles, k: '100%', v: 'toalla caliente incluida' },
          ].map((s) => (
            <div key={s.v} className="flex items-center gap-4 py-6 sm:px-8">
              <s.icon className="size-5 text-brass" aria-hidden />
              <span className="font-display text-3xl font-extrabold">{s.k}</span>
              <span className="text-sm text-ash">{s.v}</span>
            </div>
          ))}
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
          <SectionTitle eyebrow="La carta" title="Servicios" accent="de la casa" />
          <p className="max-w-sm text-ash">Precios cerrados, sin sorpresas. Todos los servicios incluyen lavado, toalla caliente y el acabado que prefieras.</p>
        </div>
        <ol className="divide-y divide-line border-y border-line">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
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
  return { days: days.map((d) => WEEKDAYS[d]), from: first && minutesToHHMM(Math.min(...b.hours.map((h) => h.start_min))), to: first && minutesToHHMM(Math.max(...b.hours.map((h) => h.end_min))) }
}

function Equipo() {
  const { data: barbers, isLoading } = useBarbers()
  return (
    <section id="equipo" className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionTitle eyebrow="El equipo" title="Manos" accent="que saben" />
        <Link to="/reservar" className="inline-flex items-center gap-2 font-semibold text-brass hover:text-bone">
          Elegir barbero <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
        {barbers?.map((b, i) => {
          const s = schedule(b)
          return (
            <Link
              key={b.id}
              to={`/reservar?b=${b.id}`}
              style={{ animationDelay: `${i * 80}ms` }}
              className="group animate-rise relative flex flex-col overflow-hidden rounded-3xl border border-line bg-coal p-7 transition-all hover:-translate-y-1 hover:border-brass/60"
            >
              <span className="pointer-events-none absolute -top-6 -right-2 font-display text-[9rem] leading-none font-black text-smoke transition-colors group-hover:text-brass/10">
                {String(i + 1).padStart(2, '0')}
              </span>
              <Monogram name={b.name} src={b.avatar_url} className="relative size-20 text-3xl" />
              <div className="relative mt-8 space-y-1">
                <p className="label text-brass">{b.title}</p>
                <h3 className="font-display text-4xl font-extrabold uppercase">{b.name}</h3>
              </div>
              <p className="relative mt-3 flex-1 text-ash">{b.bio}</p>
              <div className="relative mt-6 flex flex-wrap gap-1.5">
                {s.days.map((d) => (
                  <span key={d} className="rounded-md border border-line px-2 py-0.5 font-mono text-[0.7rem] text-ash">
                    {d}
                  </span>
                ))}
                {s.from && <span className="px-1 font-mono text-[0.7rem] text-dust">{s.from}–{s.to}</span>}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function Ritual() {
  const steps = [
    { n: 'I', t: 'Elige', d: 'Servicio y barbero, o deja que te asignemos el primero libre.' },
    { n: 'II', t: 'Reserva', d: 'Huecos en tiempo real. Lo que ves, está libre.' },
    { n: 'III', t: 'Siéntate', d: 'Llega, toalla caliente y a la silla. Así de simple.' },
  ]
  return (
    <section className="mx-auto max-w-7xl px-5 pt-28">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-coal p-8 sm:p-14">
        <Pole className="absolute top-0 left-0 h-full w-2 rounded-none" />
        <SectionTitle eyebrow="El ritual" title="Tres pasos." accent="Cero llamadas." />
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="space-y-3">
              <span className="font-serif text-5xl text-brass italic">{s.n}</span>
              <h3 className="font-display text-3xl font-bold uppercase">{s.t}</h3>
              <p className="text-ash">{s.d}</p>
            </div>
          ))}
        </div>
        <Link to="/reservar" className="mt-12 inline-flex h-12 items-center gap-3 rounded-full border border-brass px-7 font-bold text-brass transition-colors hover:bg-brass hover:text-ink">
          <Scissors className="size-4" /> Empezar ahora
        </Link>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Carta />
      <Equipo />
      <Ritual />
    </>
  )
}
