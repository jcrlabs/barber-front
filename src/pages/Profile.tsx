import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, LogOut } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button, Field, Input, Monogram } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import type { User } from '../lib/types'
import { useAuth } from '../store/auth'

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  phone: z.union([z.literal(''), z.string().regex(/^\+?[0-9 ()-]{6,30}$/, 'Teléfono no válido')]),
})

const passwordSchema = z.object({
  current_password: z.string().max(72),
  new_password: z.string().min(8, 'Mínimo 8 caracteres').max(72).regex(/\p{L}/u, 'Incluye una letra').regex(/\d/, 'Incluye un número'),
})

export default function Profile() {
  const { user, setUser, clear } = useAuth()
  const navigate = useNavigate()
  const profile = useForm({ resolver: zodResolver(profileSchema), values: { name: user?.name ?? '', phone: user?.phone ?? '' } })
  const pw = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { current_password: '', new_password: '' } })
  if (!user) return null

  const saveProfile = profile.handleSubmit(async (v) => {
    try {
      setUser(await api<User>('/auth/me', { method: 'PATCH', json: v }))
      toast.success('Perfil actualizado')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  })

  const savePassword = pw.handleSubmit(async (v) => {
    try {
      await api('/auth/me/password', { method: 'POST', json: v })
      toast.success('Contraseña guardada. Vuelve a entrar.')
      clear()
      navigate('/login')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  })

  const logoutAll = async () => {
    await api('/auth/logout-all', { method: 'POST' }).catch(() => undefined)
    clear()
    navigate('/login')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-5 py-12">
      <div className="flex items-center gap-6">
        <Monogram name={user.name} src={user.avatar_url} className="size-20 text-3xl" />
        <div className="space-y-1">
          <h1 className="font-display text-5xl leading-none font-black uppercase">{user.name}</h1>
          <p className="flex items-center gap-2 text-ash">
            {user.email} {user.email_verified && <BadgeCheck className="size-4 text-brass" aria-label="Email verificado" />}
          </p>
          {user.providers.length > 0 && <p className="label">Vinculado con {user.providers.join(', ')}</p>}
        </div>
      </div>

      <form onSubmit={saveProfile} className="space-y-4 rounded-3xl border border-line bg-coal p-6 sm:p-8" noValidate>
        <p className="label">Datos personales</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" error={profile.formState.errors.name?.message}>
            <Input {...profile.register('name')} aria-invalid={!!profile.formState.errors.name} />
          </Field>
          <Field label="Teléfono" error={profile.formState.errors.phone?.message}>
            <Input type="tel" {...profile.register('phone')} aria-invalid={!!profile.formState.errors.phone} />
          </Field>
        </div>
        <Button type="submit" loading={profile.formState.isSubmitting}>
          Guardar
        </Button>
      </form>

      <form onSubmit={savePassword} className="space-y-4 rounded-3xl border border-line bg-coal p-6 sm:p-8" noValidate>
        <p className="label">{user.has_password ? 'Cambiar contraseña' : 'Crear contraseña'}</p>
        {!user.has_password && <p className="text-sm text-ash">Entras con tu cuenta social. Añade una contraseña si quieres entrar también con email.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {user.has_password && (
            <Field label="Actual">
              <Input type="password" autoComplete="current-password" {...pw.register('current_password')} />
            </Field>
          )}
          <Field label="Nueva" error={pw.formState.errors.new_password?.message}>
            <Input type="password" autoComplete="new-password" {...pw.register('new_password')} aria-invalid={!!pw.formState.errors.new_password} />
          </Field>
        </div>
        <Button type="submit" variant="outline" loading={pw.formState.isSubmitting}>
          Guardar contraseña
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line p-6 sm:p-8">
        <div>
          <p className="font-semibold">Cerrar sesión en todos los dispositivos</p>
          <p className="text-sm text-ash">Útil si has perdido un móvil o usaste un ordenador ajeno.</p>
        </div>
        <Button variant="danger" onClick={logoutAll}>
          <LogOut className="size-4" /> Cerrar todas
        </Button>
      </div>
    </div>
  )
}
