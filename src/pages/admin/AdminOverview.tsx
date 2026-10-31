import { BellRing, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { AlertRow } from '../../components/AdminAlerts'
import { Skeleton } from '../../components/ui'
import { useNotifications, useStats } from '../../lib/queries'

function RecentBookings() {
  const [since] = useState(() => new Date(Date.now() - 7 * 24 * 3600_000).toISOString())
  const { data, isLoading } = useNotifications(since, true)
  const channels = data?.channels ?? []
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <section className="space-y-3 rounded-3xl border border-line bg-coal p-6">
        <p className="label">Reservas de los últimos 7 días</p>
        {isLoading && <Skeleton className="h-24" />}
        {data?.items.length === 0 && <p className="text-sm text-ash">Aún no hay reservas nuevas esta semana.</p>}
        <ul className="space-y-3">
          {data?.items.slice(0, 8).map((a) => (
            <AlertRow key={a.id} a={a} />
          ))}
        </ul>
      </section>
      <section className="space-y-4 rounded-3xl border border-line bg-coal p-6">
        <p className="label flex items-center gap-2">
          <BellRing className="size-3.5" /> Avisos al móvil
        </p>
        {channels.length > 0 ? (
          <p className="flex items-start gap-2 text-sm text-ash">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brass" />
            Activos por {channels.join(' y ')}. Cada reserva nueva te llega con botón para llamar o escribir por WhatsApp al cliente.
          </p>
        ) : (
          <p className="text-sm text-ash">Sin canal externo configurado: solo verás los avisos con el panel abierto.</p>
        )}
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ash">
          <li>
            Instala la app gratuita <b className="text-bone">ntfy</b> en tu móvil (Android o iPhone).
          </li>
          <li>Suscríbete al topic privado de la barbería que te pasó el administrador del servidor.</li>
          <li>
            Cada barbero tiene además sus propios avisos (móvil, email o WhatsApp) en <b className="text-bone">Mi panel → Avisos</b>.
          </li>
          <li>Listo: cada cita suena en el móvil aunque la app esté cerrada.</li>
        </ol>
        <p className="text-xs text-dust">La campana de arriba también avisa mientras el panel está abierto.</p>
      </section>
    </div>
  )
}

export function AdminOverview() {
  const { data, isLoading } = useStats()
  if (isLoading || !data)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    )
  const cards = [
    { k: 'Hoy', v: String(data.today_count), d: 'citas en agenda' },
    { k: 'Próximas', v: String(data.upcoming_count), d: 'confirmadas' },
    { k: 'Clientes', v: String(data.clients_count), d: 'registrados' },
    { k: 'No-shows', v: `${data.no_show_rate_pct}%`, d: 'este mes' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.k} className="rounded-3xl border border-line bg-coal p-6">
            <p className="label">{c.k}</p>
            <p className="mt-4 truncate font-display text-5xl font-black uppercase">{c.v}</p>
            <p className="mt-1 text-sm text-ash">{c.d}</p>
          </div>
        ))}
      </div>
      <RecentBookings />
    </div>
  )
}
