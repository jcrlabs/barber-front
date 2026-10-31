import { clsx } from 'clsx'
import { BookOpen, CalendarDays, House, LayoutDashboard, LogOut, Menu, Scissors, User as UserIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'
import { Monogram, Pole } from './ui'

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="Edgar Barber, inicio">
      <Pole className="h-8 w-2.5 ring-1 ring-brass/60" />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="font-display text-2xl font-extrabold tracking-[0.12em] uppercase">Edgar</span>
        <em className="font-serif text-xl text-brass">barber</em>
      </span>
    </Link>
  )
}

function useLogout() {
  const clear = useAuth((s) => s.clear)
  const navigate = useNavigate()
  return async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined)
    clear()
    navigate('/')
  }
}

function Header() {
  const { user, status } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const logout = useLogout()

  // Cierra el menú móvil al navegar (ajuste de estado durante el render, sin efecto).
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const links = [
    user && { to: '/mis-citas', label: 'Mis citas', icon: CalendarDays },
    (user?.role === 'barber' || user?.role === 'admin') && { to: '/agenda', label: 'Agenda', icon: Scissors },
    user?.role === 'admin' && { to: '/admin', label: 'Admin', icon: LayoutDashboard },
  ].filter(Boolean) as { to: string; label: string; icon: typeof Scissors }[]

  const navCls = ({ isActive }: { isActive: boolean }) =>
    clsx('flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors', isActive ? 'bg-smoke text-brass' : 'text-ash hover:text-bone')

  return (
    <header className={clsx('pt-safe sticky top-0 z-40 transition-all', scrolled ? 'border-b border-line bg-ink/85 backdrop-blur-xl' : 'border-b border-transparent')}>
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-5">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navCls}>
              <l.icon className="size-4" aria-hidden /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {status === 'authed' && user ? (
            <>
              <Link to="/perfil" className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm text-ash hover:bg-smoke hover:text-bone">
                <Monogram name={user.name} src={user.avatar_url} className="size-8 text-sm" />
                {user.name.split(' ')[0]}
              </Link>
              <button onClick={logout} className="rounded-full p-2 text-ash hover:bg-smoke hover:text-bone" aria-label="Cerrar sesión">
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            status === 'anon' && (
              <Link to="/login" className="text-sm font-semibold text-ash hover:text-bone">
                Entrar
              </Link>
            )
          )}
          <Link
            to="/reservar"
            className="rounded-full bg-brass px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-bone"
          >
            Reservar
          </Link>
        </div>
        <button className="rounded-full p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menú" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="animate-rise space-y-1 border-t border-line bg-coal px-5 py-4 md:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navCls}>
              <l.icon className="size-4" aria-hidden /> {l.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/perfil" className={navCls}>
                <UserIcon className="size-4" /> Perfil
              </NavLink>
              <button onClick={logout} className="flex w-full items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ash">
                <LogOut className="size-4" /> Salir
              </button>
            </>
          ) : (
            <NavLink to="/login" className={navCls}>
              <UserIcon className="size-4" /> Entrar
            </NavLink>
          )}
          <Link to="/reservar" className="mt-2 block rounded-full bg-brass px-5 py-3 text-center font-bold text-ink">
            Reservar cita
          </Link>
        </div>
      )}
    </header>
  )
}

/** Barra inferior tipo app en móvil: navegación con el pulgar y botón central de reserva. */
function TabBar() {
  const { user } = useAuth()
  const staff = user?.role === 'barber' || user?.role === 'admin'
  const tab = ({ isActive }: { isActive: boolean }) =>
    clsx('flex flex-1 flex-col items-center gap-1 pt-2.5 pb-2 font-mono text-[0.6rem] tracking-wider uppercase transition-colors', isActive ? 'text-brass' : 'text-dust')
  return (
    <nav aria-label="Navegación móvil" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-end">
        <NavLink to="/" end className={tab}>
          <House className="size-5" /> Inicio
        </NavLink>
        <NavLink to={staff ? '/agenda' : '/mis-citas'} className={tab}>
          {staff ? <Scissors className="size-5" /> : <CalendarDays className="size-5" />} {staff ? 'Agenda' : 'Citas'}
        </NavLink>
        <NavLink to="/reservar" className="-mt-5 flex flex-1 flex-col items-center gap-1 pb-2" aria-label="Reservar">
          {({ isActive }) => (
            <>
              <span className={clsx('grid size-14 place-items-center overflow-hidden rounded-full ring-4 ring-ink transition-transform', isActive && 'scale-105')}>
                <span className="pole animate-pole size-full" />
              </span>
              <span className={clsx('font-mono text-[0.6rem] tracking-wider uppercase', isActive ? 'text-brass' : 'text-bone')}>Reservar</span>
            </>
          )}
        </NavLink>
        {user?.role === 'admin' ? (
          <NavLink to="/admin" className={tab}>
            <LayoutDashboard className="size-5" /> Admin
          </NavLink>
        ) : (
          <Link to="/#carta" className={tab({ isActive: false })}>
            <BookOpen className="size-5" /> Carta
          </Link>
        )}
        <NavLink to={user ? '/perfil' : '/login'} className={tab}>
          <UserIcon className="size-5" /> {user ? 'Perfil' : 'Entrar'}
        </NavLink>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-line pb-24 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-ash">Barbería de autor. Navaja, tijera y conversación desde el primer día, de la mano de Edgar.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="label">Visítanos</p>
          <p>Calle Mayor 12</p>
          <p className="text-ash">Mar – Sáb · 10:00 – 20:30</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="label">Reservas</p>
          <Link to="/reservar" className="block hover:text-brass">
            Reservar online →
          </Link>
          <p className="text-ash">Cancelación gratuita hasta 2 h antes.</p>
        </div>
      </div>
      <div className="pole h-1.5 opacity-80" aria-hidden />
    </footer>
  )
}

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-brass focus:px-4 focus:py-2 focus:text-ink">
        Saltar al contenido
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <TabBar />
    </div>
  )
}
