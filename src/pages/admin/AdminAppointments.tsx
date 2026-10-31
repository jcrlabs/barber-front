import { useState } from 'react'
import { Button, Input, Select, Skeleton, StatusBadge } from '../../components/ui'
import { shortDate, statusLabel, time, todayInShop } from '../../lib/format'
import { dialable } from '../../lib/phone'
import { useAdminAppointments, useAdminBarbers } from '../../lib/queries'

export function AdminAppointments() {
  const [f, setF] = useState({ status: '', from: todayInShop(), to: '', barber_id: '', offset: 0 })
  const { data, isLoading } = useAdminAppointments(f)
  const barbers = useAdminBarbers()
  const up = (patch: Partial<typeof f>) => setF((s) => ({ ...s, offset: 0, ...patch }))

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <Input type="date" value={f.from} onChange={(e) => up({ from: e.target.value })} aria-label="Desde" />
        <Input type="date" value={f.to} onChange={(e) => up({ to: e.target.value })} aria-label="Hasta" />
        <Select value={f.status} onChange={(e) => up({ status: e.target.value })} aria-label="Estado">
          <option value="">Todos los estados</option>
          {Object.entries(statusLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select value={f.barber_id} onChange={(e) => up({ barber_id: e.target.value })} aria-label="Barbero">
          <option value="">Todo el equipo</option>
          {barbers.data?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-coal">
            <tr className="label">
              {['Fecha', 'Cliente', 'Teléfono', 'Servicio', 'Estado'].map((h) => (
                <th key={h} className="px-5 py-4 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-5">
                  <Skeleton className="h-10" />
                </td>
              </tr>
            )}
            {data?.items.map((a) => (
              <tr key={a.id} className="hover:bg-coal/60">
                <td className="px-5 py-4 font-mono">
                  {shortDate(a.starts_at)} · {time(a.starts_at)}
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold">{a.client_name}</p>
                  <p className="text-xs text-dust">{a.client_email}</p>
                </td>
                <td className="px-5 py-4 font-mono">
                  {a.client_phone ? (
                    <a href={`tel:${dialable(a.client_phone)}`} className="text-brass hover:text-bone">
                      {a.client_phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-4">{a.service_name}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={a.status}>{statusLabel[a.status]}</StatusBadge>
                </td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ash">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && data.total > 25 && (
        <div className="flex items-center justify-between text-sm text-ash">
          <span>
            {f.offset + 1}–{Math.min(f.offset + 25, data.total)} de {data.total}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={f.offset === 0} onClick={() => setF((s) => ({ ...s, offset: s.offset - 25 }))}>
              Anterior
            </Button>
            <Button size="sm" variant="outline" disabled={f.offset + 25 >= data.total} onClick={() => setF((s) => ({ ...s, offset: s.offset + 25 }))}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
