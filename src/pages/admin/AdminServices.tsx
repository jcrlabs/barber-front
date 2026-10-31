import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button, Field, Input, Modal, Skeleton, Textarea } from '../../components/ui'
import { api, errorMessage } from '../../lib/api'
import { duration } from '../../lib/format'
import { useAdminMutation, useAdminServices } from '../../lib/queries'
import type { Service } from '../../lib/types'

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().max(500),
  duration_min: z.coerce.number<string | number>().int().min(5).max(480),
  sort_order: z.coerce.number<string | number>().int().min(0).max(1000),
  active: z.boolean(),
})
type FormValues = z.output<typeof schema>

function ServiceForm({ initial, onDone }: { initial?: Service; onDone: () => void }) {
  const form = useForm<z.input<typeof schema>, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ? initial : { name: '', description: '', duration_min: 30, sort_order: 0, active: true },
  })
  const save = useAdminMutation((v: FormValues) => {
    const body = {
      name: v.name,
      description: v.description,
      duration_min: v.duration_min,
      price_cents: initial?.price_cents ?? 0,
      sort_order: v.sort_order,
      active: v.active,
    }
    return initial ? api(`/admin/services/${initial.id}`, { method: 'PUT', json: body }) : api('/admin/services', { method: 'POST', json: body })
  })
  const e = form.formState.errors
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async (v) => {
        try {
          await save.mutateAsync(v)
          toast.success('Servicio guardado')
          onDone()
        } catch (err) {
          toast.error(errorMessage(err))
        }
      })}
    >
      <Field label="Nombre" error={e.name && 'Entre 2 y 80 caracteres'}>
        <Input {...form.register('name')} />
      </Field>
      <Field label="Descripción">
        <Textarea {...form.register('description')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Minutos" error={e.duration_min && '5–480'}>
          <Input type="number" step={5} {...form.register('duration_min')} />
        </Field>
        <Field label="Orden">
          <Input type="number" {...form.register('sort_order')} />
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="size-4 accent-[var(--color-brass)]" {...form.register('active')} /> Visible para reservar
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

export function AdminServices() {
  const { data, isLoading } = useAdminServices()
  const [editing, setEditing] = useState<Service | 'new' | null>(null)
  const del = useAdminMutation((id: string) => api(`/admin/services/${id}`, { method: 'DELETE' }))

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Plus className="size-4" /> Nuevo servicio
        </Button>
      </div>
      {isLoading && <Skeleton className="h-40" />}
      <ul className="divide-y divide-line rounded-3xl border border-line">
        {data?.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-3 font-display text-2xl font-bold uppercase">
                {s.name} {!s.active && <span className="rounded-full border border-line px-2 font-mono text-[0.65rem] text-dust normal-case">oculto</span>}
              </p>
              <p className="text-sm text-ash">{s.description}</p>
            </div>
            <span className="font-mono text-sm text-dust">{duration(s.duration_min)}</span>
            <div className="flex gap-1">
              <button onClick={() => setEditing(s)} className="rounded-full p-2 text-ash hover:bg-smoke hover:text-bone" aria-label={`Editar ${s.name}`}>
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar "${s.name}"? Si tiene citas se ocultará.`))
                    del.mutateAsync(s.id).then(
                      () => toast.success('Eliminado'),
                      (e) => toast.error(errorMessage(e)),
                    )
                }}
                className="rounded-full p-2 text-ash hover:bg-blood/20 hover:text-[#e2786c]"
                aria-label={`Eliminar ${s.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo servicio' : 'Editar servicio'}>
        {editing && <ServiceForm initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}
