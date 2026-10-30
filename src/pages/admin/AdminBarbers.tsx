import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Field, Input, Modal, Monogram, Skeleton, Textarea } from '../../components/ui'
import { api, errorMessage } from '../../lib/api'
import { hhmmToMinutes, minutesToHHMM, WEEKDAYS } from '../../lib/format'
import { useAdminBarbers, useAdminMutation, useAdminUsers } from '../../lib/queries'
import type { Barber, WorkingHours } from '../../lib/types'

const ORDER = [1, 2, 3, 4, 5, 6, 0] // lunes primero

function HoursEditor({ value, onChange }: { value: WorkingHours[]; onChange: (h: WorkingHours[]) => void }) {
  const add = (weekday: number) => onChange([...value, { weekday, start_min: 600, end_min: 840 }])
  const patch = (i: number, p: Partial<WorkingHours>) => onChange(value.map((h, j) => (j === i ? { ...h, ...p } : h)))
  return (
    <div className="space-y-2">
      {ORDER.map((d) => {
        const rows = value.map((h, i) => ({ h, i })).filter(({ h }) => h.weekday === d)
        return (
          <div key={d} className="flex flex-wrap items-center gap-2 rounded-xl border border-line px-3 py-2">
            <span className="w-10 font-mono text-xs text-ash uppercase">{WEEKDAYS[d]}</span>
            {rows.length === 0 && <span className="text-xs text-dust">Libre</span>}
            {rows.map(({ h, i }) => (
              <span key={i} className="flex items-center gap-1 rounded-lg bg-smoke px-2 py-1">
                <input type="time" step={900} value={minutesToHHMM(h.start_min)} onChange={(e) => patch(i, { start_min: hhmmToMinutes(e.target.value) })} className="bg-transparent font-mono text-xs" aria-label="Inicio" />
                –
                <input type="time" step={900} value={minutesToHHMM(h.end_min)} onChange={(e) => patch(i, { end_min: hhmmToMinutes(e.target.value) })} className="bg-transparent font-mono text-xs" aria-label="Fin" />
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Quitar franja" className="text-dust hover:text-[#e2786c]">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <button type="button" onClick={() => add(d)} className="ml-auto rounded-full p-1 text-brass hover:bg-smoke" aria-label={`Añadir franja ${WEEKDAYS[d]}`}>
              <Plus className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function BarberForm({ initial, onDone }: { initial?: Barber; onDone: () => void }) {
  const [b, setB] = useState({
    name: initial?.name ?? '',
    title: initial?.title ?? '',
    bio: initial?.bio ?? '',
    avatar_url: initial?.avatar_url ?? '',
    active: initial?.active ?? true,
    user_id: initial?.user_id ?? null,
    hours: initial?.hours ?? [],
  })
  const [q, setQ] = useState('')
  const users = useAdminUsers({ q, role: '', offset: 0 })
  const save = useAdminMutation(() =>
    initial ? api(`/admin/barbers/${initial.id}`, { method: 'PUT', json: b }) : api('/admin/barbers', { method: 'POST', json: b }),
  )
  const linked = users.data?.items.find((u) => u.id === b.user_id)

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault()
        try {
          await save.mutateAsync(undefined)
          toast.success('Barbero guardado')
          onDone()
        } catch (err) {
          toast.error(errorMessage(err))
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre">
          <Input required minLength={2} maxLength={80} value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} />
        </Field>
        <Field label="Especialidad">
          <Input maxLength={80} value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} />
        </Field>
      </div>
      <Field label="Bio">
        <Textarea maxLength={600} value={b.bio} onChange={(e) => setB({ ...b, bio: e.target.value })} />
      </Field>
      <Field label="Foto (URL https)">
        <Input type="url" value={b.avatar_url} onChange={(e) => setB({ ...b, avatar_url: e.target.value })} placeholder="https://…" />
      </Field>
      <Field label="Cuenta vinculada" hint="El usuario vinculado verá su agenda en /agenda.">
        <div className="space-y-2">
          {b.user_id && (
            <p className="flex items-center justify-between rounded-xl bg-smoke px-3 py-2 text-sm">
              {linked ? `${linked.name} · ${linked.email}` : b.user_id}
              <button type="button" onClick={() => setB({ ...b, user_id: null })} className="text-dust hover:text-bone" aria-label="Desvincular">
                <X className="size-4" />
              </button>
            </p>
          )}
          <Input placeholder="Buscar usuario por nombre o email…" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && (
            <ul className="max-h-36 overflow-y-auto rounded-xl border border-line">
              {users.data?.items.map((u) => (
                <li key={u.id}>
                  <button type="button" onClick={() => (setB({ ...b, user_id: u.id }), setQ(''))} className="w-full px-3 py-2 text-left text-sm hover:bg-smoke">
                    {u.name} <span className="text-dust">· {u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Field>
      <div className="space-y-2">
        <span className="label">Horario semanal</span>
        <HoursEditor value={b.hours} onChange={(hours) => setB({ ...b, hours })} />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="size-4 accent-[var(--color-brass)]" checked={b.active} onChange={(e) => setB({ ...b, active: e.target.checked })} /> Acepta reservas
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          Guardar
        </Button>
      </div>
    </form>
  )
}

export function AdminBarbers() {
  const { data, isLoading } = useAdminBarbers()
  const [editing, setEditing] = useState<Barber | 'new' | null>(null)
  const del = useAdminMutation((id: string) => api(`/admin/barbers/${id}`, { method: 'DELETE' }))
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Plus className="size-4" /> Nuevo barbero
        </Button>
      </div>
      {isLoading && <Skeleton className="h-40" />}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((b) => (
          <div key={b.id} className="space-y-4 rounded-3xl border border-line bg-coal p-6">
            <div className="flex items-start gap-4">
              <Monogram name={b.name} src={b.avatar_url} className="size-14 text-xl" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl font-bold uppercase">{b.name}</p>
                <p className="label text-brass">{b.title}</p>
              </div>
              <div className="flex">
                <button onClick={() => setEditing(b)} className="rounded-full p-2 text-ash hover:bg-smoke" aria-label={`Editar ${b.name}`}>
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => confirm(`¿Eliminar a ${b.name}? Si tiene historial se desactivará.`) && del.mutateAsync(b.id).then(() => toast.success('Eliminado'), (e) => toast.error(errorMessage(e)))}
                  className="rounded-full p-2 text-ash hover:bg-blood/20 hover:text-[#e2786c]"
                  aria-label={`Eliminar ${b.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {ORDER.map((d) => (
                <span key={d} className={`rounded-md border px-2 py-0.5 font-mono text-[0.65rem] ${b.hours.some((h) => h.weekday === d) ? 'border-brass/40 text-brass' : 'border-line text-dust'}`}>
                  {WEEKDAYS[d]}
                </span>
              ))}
            </div>
            <p className="text-xs text-dust">{b.active ? (b.user_id ? 'Cuenta vinculada' : 'Sin cuenta vinculada') : 'Inactivo'}</p>
          </div>
        ))}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo barbero' : 'Editar barbero'}>
        {editing && <BarberForm initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}
