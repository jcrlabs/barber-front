import { clsx } from 'clsx'
import { ArrowDown, ArrowUp, Check, Copy, Download, MoreHorizontal, PlusSquare, Settings, Share, Smartphone } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Pole } from '../components/ui'
import { APK_URL, iosBrowser, isAndroid, isIOS, isStandalone, type IOSBrowser } from '../lib/platform'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

const APP_URL = 'https://edgarbarber.jcrlabs.net/app'

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="animate-rise flex items-start gap-4" style={{ animationDelay: `${n * 120}ms` }}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-brass/50 font-display text-lg font-black text-brass">{n}</span>
      <span className="pt-1.5 text-bone">{children}</span>
    </li>
  )
}

const Chip = ({ children }: { children: ReactNode }) => (
  <span className="mx-0.5 inline-flex items-center gap-1 rounded-md bg-smoke px-1.5 py-0.5 align-middle text-sm font-semibold">{children}</span>
)

/** Pasos de "Añadir a pantalla de inicio" según el navegador de iOS. */
function IOSSteps({ browser }: { browser: IOSBrowser }) {
  const add = (
    <>
      Elige <Chip>Añadir a pantalla de inicio</Chip> (si no lo ves, desliza la lista hacia arriba) y pulsa <b>Añadir</b>.
    </>
  )
  if (browser === 'inapp') {
    return (
      <ol className="space-y-4">
        <Step n={1}>
          Estás dentro de otra app (Instagram, Google…). Toca <Chip>···</Chip> y elige <Chip>Abrir en Safari</Chip>, o copia el enlace y pégalo en Safari.
        </Step>
        <Step n={2}>Allí verás los pasos para instalarla.</Step>
      </ol>
    )
  }
  return (
    <ol className="space-y-4">
      {browser === 'safari' && (
        <Step n={1}>
          Toca{' '}
          <Chip>
            <Share className="size-4" /> Compartir
          </Chip>{' '}
          en la barra de abajo (en iPad, arriba a la derecha).
        </Step>
      )}
      {browser === 'chrome' && (
        <Step n={1}>
          Toca{' '}
          <Chip>
            <Share className="size-4" /> Compartir
          </Chip>{' '}
          a la derecha de la barra de direcciones, arriba.
        </Step>
      )}
      {(browser === 'edge' || browser === 'firefox') && (
        <Step n={1}>
          Abre el menú{' '}
          <Chip>
            <MoreHorizontal className="size-4" />
          </Chip>{' '}
          y toca{' '}
          <Chip>
            <Share className="size-4" /> Compartir
          </Chip>
          .
        </Step>
      )}
      <Step n={2}>{add}</Step>
      <Step n={3}>
        Listo: abre <b>Edgar Barber</b> desde tu pantalla de inicio, a pantalla completa como cualquier app.
      </Step>
    </ol>
  )
}

/** Flecha que rebota señalando dónde está el botón de compartir. */
function Pointer({ browser }: { browser: IOSBrowser }) {
  if (browser === 'safari') {
    return (
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-50 flex flex-col items-center md:hidden"
        aria-hidden
      >
        <span className="label rounded-full bg-ink/90 px-3 py-1 text-brass">Compartir está aquí abajo</span>
        <ArrowDown className="size-10 animate-bounce text-brass drop-shadow-[0_0_12px_rgb(201_163_106/.7)]" />
      </div>
    )
  }
  if (browser === 'chrome') {
    return (
      <div className="pointer-events-none fixed top-2 right-4 z-50 md:hidden" aria-hidden>
        <ArrowUp className="size-10 animate-bounce text-brass drop-shadow-[0_0_12px_rgb(201_163_106/.7)]" />
      </div>
    )
  }
  return null
}

function CopyLink() {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(APP_URL).then(() => {
          setOk(true)
          setTimeout(() => setOk(false), 1500)
        })
      }
      className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-sm hover:border-brass"
    >
      {ok ? <Check className="size-4 text-brass" /> : <Copy className="size-4" />} edgarbarber.jcrlabs.net/app
    </button>
  )
}

function Card({ title, icon, highlight, children }: { title: string; icon: ReactNode; highlight?: boolean; children: ReactNode }) {
  return (
    <section className={clsx('space-y-6 rounded-[2rem] border bg-coal p-6 sm:p-8', highlight ? 'border-brass/60' : 'border-line')}>
      <h2 className="flex items-center gap-3 font-display text-4xl font-black uppercase">
        <span className="text-brass">{icon}</span> {title}
      </h2>
      {children}
    </section>
  )
}

function IPhoneCard({ browser, highlight }: { browser: IOSBrowser; highlight?: boolean }) {
  return (
    <Card title="iPhone" icon={<Smartphone className="size-8" />} highlight={highlight}>
      <IOSSteps browser={browser} />
      <details className="group rounded-2xl border border-line p-4 text-sm text-ash">
        <summary className="cursor-pointer font-semibold text-bone marker:text-brass">¿No te sale? Instálala con un perfil</summary>
        <div className="mt-3 space-y-3">
          <p>Descarga este perfil (mejor desde Safari) y añade el icono de Edgar Barber a tu pantalla de inicio:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Toca el botón y luego “Permitir”.</li>
            <li>
              Abre{' '}
              <Chip>
                <Settings className="size-3.5" /> Ajustes
              </Chip>{' '}
              → <b>Perfil descargado</b> → <b>Instalar</b>.
            </li>
            <li>
              iOS dirá que el perfil no está verificado: es normal, solo añade el icono. Se quita cuando quieras en Ajustes → General → VPN y gestión de
              dispositivos.
            </li>
          </ol>
          <a
            href="/edgar-barber.mobileconfig"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-brass px-5 font-bold text-brass hover:bg-brass hover:text-ink"
          >
            <PlusSquare className="size-4" /> Descargar perfil
          </a>
        </div>
      </details>
    </Card>
  )
}

function AndroidCard({ highlight }: { highlight?: boolean }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', on)
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])
  return (
    <Card title="Android" icon={<Smartphone className="size-8" />} highlight={highlight}>
      <a
        href={APK_URL}
        className="group flex h-16 items-center justify-center gap-3 rounded-full bg-brass px-8 text-lg font-bold text-ink transition-colors hover:bg-bone"
      >
        <Download className="size-6 transition-transform group-hover:translate-y-0.5" /> Descargar la app
      </a>
      <ol className="space-y-4">
        <Step n={1}>Descarga el archivo y ábrelo desde la notificación o desde Descargas.</Step>
        <Step n={2}>
          Si Android lo pide, permite <Chip>Instalar apps desconocidas</Chip> para tu navegador.
        </Step>
        <Step n={3}>
          Pulsa <b>Instalar</b>. Las mejoras de la web te llegan solas, sin reinstalar.
        </Step>
      </ol>
      {prompt && (
        <button type="button" onClick={() => prompt.prompt()} className="text-sm text-ash underline hover:text-brass">
          O instálala como app web, sin descargar nada
        </button>
      )}
    </Card>
  )
}

export default function GetApp() {
  const ios = isIOS()
  const android = isAndroid()
  const browser = iosBrowser()

  if (isStandalone()) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-5 text-center">
        <div className="space-y-6">
          <Check className="mx-auto size-14 text-brass" />
          <h1 className="font-display text-5xl font-black uppercase">Ya tienes la app</h1>
          <Link to="/reservar" className="inline-flex h-12 items-center rounded-full bg-brass px-6 font-bold text-ink">
            Reservar mi cita
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-5 py-12">
      {ios && <Pointer browser={browser} />}
      <header className="animate-rise space-y-5">
        <Pole className="h-12 w-3" />
        <h1 className="font-display text-[clamp(3.5rem,11vw,7rem)] leading-[0.85] font-black uppercase">
          Edgar Barber <em className="font-serif font-normal text-brass normal-case italic">en tu móvil</em>
        </h1>
        <p className="max-w-lg text-lg text-ash">
          {ios
            ? 'En iPhone se instala desde el navegador, en dos toques. Sigue los pasos:'
            : android
              ? 'Descarga la app y reserva tu corte en segundos.'
              : 'Abre esta página en tu móvil para instalar la app:'}
        </p>
        {!ios && !android && <CopyLink />}
      </header>

      {ios ? (
        <IPhoneCard browser={browser} highlight />
      ) : android ? (
        <AndroidCard highlight />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <AndroidCard />
          <IPhoneCard browser="safari" />
        </div>
      )}

      {(ios || android) && (
        <p className="text-center text-sm text-dust">
          ¿Tienes otro móvil? {ios ? 'En Android' : 'En iPhone'} abre <b className="text-ash">edgarbarber.jcrlabs.net/app</b> y te saldrán sus pasos.
        </p>
      )}
    </div>
  )
}
