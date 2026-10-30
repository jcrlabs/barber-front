import { Skeleton } from '../../components/ui'
import { money } from '../../lib/format'
import { useStats } from '../../lib/queries'

export function AdminOverview() {
  const { data, isLoading } = useStats()
  if (isLoading || !data) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36" />)}</div>
  const cards = [
    { k: 'Hoy', v: String(data.today_count), d: 'citas en agenda' },
    { k: 'Próximas', v: String(data.upcoming_count), d: 'confirmadas' },
    { k: 'Semana', v: money(data.week_revenue_cents), d: 'facturación prevista' },
    { k: 'Mes', v: money(data.month_revenue_cents), d: 'facturación prevista' },
    { k: 'Clientes', v: String(data.clients_count), d: 'registrados' },
    { k: 'No-shows', v: `${data.no_show_rate_pct}%`, d: 'este mes' },
    { k: 'Top', v: data.top_service || '—', d: 'servicio del mes', wide: true },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.k} className={`rounded-3xl border border-line bg-coal p-6 ${c.wide ? 'sm:col-span-2' : ''}`}>
          <p className="label">{c.k}</p>
          <p className="mt-4 truncate font-display text-5xl font-black uppercase">{c.v}</p>
          <p className="mt-1 text-sm text-ash">{c.d}</p>
        </div>
      ))}
    </div>
  )
}
