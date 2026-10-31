import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isIOS, isStandalone } from '../lib/platform'
import { Pole } from './ui'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const KEY = 'eb:install-dismissed'
const dismissed = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Invita a instalar la app: prompt nativo en Android/Chrome, instrucciones en iOS Safari. */
export function InstallCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(() => isStandalone() || dismissed())

  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', on)
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])

  if (hidden || (!deferred && !isIOS())) return null

  const close = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* sin almacenamiento */
    }
    setHidden(true)
  }

  return (
    <div className="animate-rise relative mx-5 mt-6 flex items-center gap-4 overflow-hidden rounded-2xl border border-brass/40 bg-coal p-4 md:hidden">
      <Pole className="h-12 w-3 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl font-bold uppercase">Llévanos en el móvil</p>
        {deferred ? (
          <p className="text-sm text-ash">Instala la app y reserva en dos toques.</p>
        ) : (
          <p className="text-sm text-ash">
            Pulsa <Share className="inline size-4 text-brass" aria-label="Compartir" /> y luego «Añadir a pantalla de inicio».
          </p>
        )}
      </div>
      {deferred && (
        <button
          onClick={async () => {
            await deferred.prompt()
            const { outcome } = await deferred.userChoice
            if (outcome === 'accepted') setHidden(true)
            setDeferred(null)
          }}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-brass px-4 text-sm font-bold text-ink"
        >
          <Download className="size-4" /> Instalar
        </button>
      )}
      <button onClick={close} className="absolute top-2 right-2 p-1 text-dust" aria-label="Cerrar">
        <X className="size-4" />
      </button>
    </div>
  )
}
