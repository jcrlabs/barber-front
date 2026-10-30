import { clsx } from 'clsx'
import { CalendarDays, LayoutDashboard, Scissors, Users, UsersRound } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { AdminAppointments } from './AdminAppointments'
import { AdminBarbers } from './AdminBarbers'
import { AdminOverview } from './AdminOverview'
import { AdminServices } from './AdminServices'
import { AdminUsers } from './AdminUsers'

const tabs = [
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard, el: AdminOverview },
  { id: 'citas', label: 'Citas', icon: CalendarDays, el: AdminAppointments },
  { id: 'servicios', label: 'Servicios', icon: Scissors, el: AdminServices },
  { id: 'equipo', label: 'Equipo', icon: UsersRound, el: AdminBarbers },
  { id: 'usuarios', label: 'Usuarios', icon: Users, el: AdminUsers },
] as const

export default function Admin() {
  const [params, setParams] = useSearchParams()
  const current = tabs.find((t) => t.id === params.get('tab')) ?? tabs[0]
  const View = current.el
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="font-display text-6xl leading-[0.9] font-black uppercase">
          Panel <em className="font-serif font-normal text-brass normal-case italic">de la casa</em>
        </h1>
      </div>
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
        <View />
      </div>
    </div>
  )
}
