import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input, Monogram, Select, Skeleton } from '../../components/ui'
import { api, errorMessage } from '../../lib/api'
import { shortDate } from '../../lib/format'
import { useAdminMutation, useAdminUsers } from '../../lib/queries'
import type { Role } from '../../lib/types'
import { useAuth } from '../../store/auth'

const roles: Record<Role, string> = { client: 'Usuario', admin: 'Admin' }

export function AdminUsers() {
  const me = useAuth((s) => s.user)
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQ(input), 300)
    return () => clearTimeout(t)
  }, [input])
  const { data, isLoading } = useAdminUsers({ q, role, offset: 0 })
  const setUserRole = useAdminMutation(({ id, role }: { id: string; role: Role }) => api(`/admin/users/${id}/role`, { method: 'PATCH', json: { role } }))

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-dust" />
          <Input className="pl-11" placeholder="Buscar por nombre o email" maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Rol">
          <option value="">Todos los roles</option>
          {Object.entries(roles).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      {isLoading && <Skeleton className="h-40" />}
      <ul className="divide-y divide-line rounded-3xl border border-line">
        {data?.items.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-4 p-4">
            <Monogram name={u.name} src={u.avatar_url} className="size-10 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{u.name}</p>
              <p className="truncate text-sm text-ash">
                {u.email} {u.providers.length > 0 && <span className="text-dust">· {u.providers.join(', ')}</span>}
              </p>
            </div>
            <span className="hidden font-mono text-xs text-dust sm:block">{shortDate(u.created_at)}</span>
            <div className="w-36">
              <Select
                value={u.role}
                disabled={u.id === me?.id}
                aria-label={`Rol de ${u.name}`}
                onChange={(e) =>
                  setUserRole.mutateAsync({ id: u.id, role: e.target.value as Role }).then(
                    () => toast.success('Rol actualizado'),
                    (err) => toast.error(errorMessage(err)),
                  )
                }
              >
                {Object.entries(roles).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
          </li>
        ))}
        {data?.items.length === 0 && <li className="p-8 text-center text-ash">Sin resultados.</li>}
      </ul>
      {data && <p className="text-sm text-dust">{data.total} usuarios</p>}
    </div>
  )
}
