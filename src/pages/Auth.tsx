import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { Logo } from '../components/Layout'
import { SocialButtons } from '../components/SocialButtons'
import { Button, Field, Input, Pole, Spinner } from '../components/ui'
import { api, ApiError, errorMessage, refreshSession } from '../lib/api'
import { popNext, safeNext } from '../lib/nav'
import type { Session } from '../lib/types'
import { useAuth } from '../store/auth'

const oauthErrors: Record<string, string> = {
  state: 'La sesión de inicio expiró. Vuelve a intentarlo.',
  denied: 'Has cancelado el acceso.',
  email: 'Tu cuenta social no tiene un email verificado.',
  exchange: 'No pudimos validar tu cuenta social.',
  server: 'Algo ha fallado. Inténtalo de nuevo.',
}

function AuthShell({ title, accent, children, footer }: { title: string; accent: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-6xl lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-x border-line lg:block">
        <div className="pole animate-pole absolute inset-0 opacity-[0.07] [background-size:100%_120px] [animation-duration:6s]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <blockquote className="space-y-4">
            <p className="font-serif text-4xl leading-tight italic">“Un buen corte no se nota. Se nota cuando no lo llevas.”</p>
            <footer className="label">— Edgar, fundador</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex items-center px-5 py-12 sm:px-12">
        <div className="animate-rise w-full max-w-sm space-y-8">
          <div className="space-y-3">
            <Pole className="h-1.5 w-16" />
            <h1 className="font-display text-5xl leading-[0.9] font-black uppercase">
              {title} <em className="font-serif font-normal text-brass normal-case italic">{accent}</em>
            </h1>
          </div>
          {children}
          <p className="text-sm text-ash">{footer}</p>
        </div>
      </div>
    </div>
  )
}

function useAfterLogin() {
  const setSession = useAuth((s) => s.setSession)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  return {
    next,
    done: (s: Session) => {
      setSession(s)
      toast.success(`Hola, ${s.user.name.split(' ')[0]}`)
      navigate(next, { replace: true })
    },
  }
}

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Introduce tu email o usuario').max(254),
  password: z.string().min(1, 'Introduce tu contraseña'),
})

export function Login() {
  const { next, done } = useAfterLogin()
  const [params] = useSearchParams()
  const oauthError = params.get('error')
  const form = useForm({ resolver: zodResolver(loginSchema) })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      done(await api<Session>('/auth/login', { method: 'POST', json: v }))
    } catch (e) {
      toast.error(errorMessage(e))
    }
  })

  return (
    <AuthShell
      title="Bienvenido"
      accent="de vuelta"
      footer={
        <>
          ¿Primera vez?{' '}
          <Link to={`/registro?next=${encodeURIComponent(next)}`} className="font-semibold text-brass hover:text-bone">
            Crea tu cuenta
          </Link>
        </>
      }
    >
      {oauthError && (
        <p role="alert" className="flex gap-3 rounded-xl border border-blood/40 bg-blood/10 p-4 text-sm">
          <CircleAlert className="size-5 shrink-0 text-[#e2786c]" /> {oauthErrors[oauthError] ?? oauthErrors.server}
        </p>
      )}
      <SocialButtons next={next} />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email o usuario" error={errors.email?.message}>
          <Input type="text" inputMode="email" autoCapitalize="none" autoComplete="username" aria-invalid={!!errors.email} {...form.register('email')} />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register('password')} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Entrar
        </Button>
      </form>
    </AuthShell>
  )
}

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  email: z.email('Email no válido').max(254),
  phone: z
    .string()
    .trim()
    .min(1, 'El móvil es obligatorio')
    .regex(/^\+?[0-9 ()-]{6,30}$/, 'Móvil no válido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72, 'Máximo 72 caracteres')
    .regex(/\p{L}/u, 'Incluye al menos una letra')
    .regex(/\d/, 'Incluye al menos un número'),
})

export function Register() {
  const { next, done } = useAfterLogin()
  const form = useForm({ resolver: zodResolver(registerSchema), defaultValues: { phone: '' } })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      done(await api<Session>('/auth/register', { method: 'POST', json: v }))
    } catch (e) {
      if (e instanceof ApiError && e.code === 'email_taken') form.setError('email', { message: 'Ya existe una cuenta con este email' })
      else toast.error(errorMessage(e))
    }
  })

  return (
    <AuthShell
      title="Tu silla"
      accent="te espera"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brass hover:text-bone">
            Entra
          </Link>
        </>
      }
    >
      <SocialButtons next={next} />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Nombre" error={errors.name?.message}>
          <Input autoComplete="name" aria-invalid={!!errors.name} {...form.register('name')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register('email')} />
        </Field>
        <Field label="Móvil" error={errors.phone?.message}>
          <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="600 000 000" aria-invalid={!!errors.phone} {...form.register('phone')} />
        </Field>
        <Field label="Contraseña" error={errors.password?.message} hint="8+ caracteres, con letras y números.">
          <Input type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register('password')} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Crear cuenta
        </Button>
        <p className="text-center text-xs text-dust">
          Al crear la cuenta aceptas la{' '}
          <Link to="/privacidad" className="underline hover:text-brass">
            política de privacidad
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  )
}

/** Vuelta del login social: el backend dejó la cookie de refresh; la canjeamos por sesión. */
export function AuthCallback() {
  const navigate = useNavigate()
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    refreshSession().then((s) => {
      if (s) {
        toast.success(`Hola, ${s.user.name.split(' ')[0]}`)
        navigate(popNext(), { replace: true })
      } else {
        navigate('/login?error=server', { replace: true })
      }
    })
  }, [navigate])
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner className="size-8" />
    </div>
  )
}
