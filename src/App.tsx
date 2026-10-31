import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, Link, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { Spinner } from './components/ui'
import { refreshSession } from './lib/api'
import { setShopTimezone } from './lib/format'
import { useMeta } from './lib/queries'
import { AuthCallback, Login, Register } from './pages/Auth'
import Book from './pages/Book'
import Home from './pages/Home'
import { useAuth } from './store/auth'

// Las vistas de staff no las necesita un cliente: se cargan bajo demanda.
const MyAppointments = lazy(() => import('./pages/MyAppointments'))
const Profile = lazy(() => import('./pages/Profile'))
const Agenda = lazy(() => import('./pages/Agenda'))
const Admin = lazy(() => import('./pages/admin/Admin'))
const BarberPanel = lazy(() => import('./pages/BarberPanel'))

const fallback = (
  <div className="grid min-h-[50vh] place-items-center">
    <Spinner />
  </div>
)
const lazyEl = (el: React.ReactNode) => <Suspense fallback={fallback}>{el}</Suspense>

function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-5 text-center">
      <div className="space-y-6">
        <p className="font-display text-[10rem] leading-none font-black text-smoke">404</p>
        <p className="font-serif text-3xl italic">Este pasillo no lleva a ninguna silla.</p>
        <Link to="/" className="inline-flex h-12 items-center rounded-full bg-brass px-6 font-bold text-ink">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/reservar', element: <Book /> },
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Register /> },
      { path: '/auth/callback', element: <AuthCallback /> },
      { path: '/mis-citas', element: <RequireAuth>{lazyEl(<MyAppointments />)}</RequireAuth> },
      { path: '/perfil', element: <RequireAuth>{lazyEl(<Profile />)}</RequireAuth> },
      { path: '/agenda', element: <RequireAuth roles={['barber', 'admin']}>{lazyEl(<Agenda />)}</RequireAuth> },
      { path: '/mi-panel', element: <RequireAuth roles={['barber', 'admin']}>{lazyEl(<BarberPanel />)}</RequireAuth> },
      { path: '/admin', element: <RequireAuth roles={['admin']}>{lazyEl(<Admin />)}</RequireAuth> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  const meta = useMeta()
  if (meta.data) setShopTimezone(meta.data.timezone)

  // Restaura la sesión desde la cookie httpOnly al abrir la app.
  useEffect(() => {
    if (useAuth.getState().status === 'loading' && window.location.pathname !== '/auth/callback') {
      refreshSession()
    }
  }, [])

  return <RouterProvider router={router} />
}
