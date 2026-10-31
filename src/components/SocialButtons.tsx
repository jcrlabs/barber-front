import { rememberNext } from '../lib/nav'
import { isNativeApp } from '../lib/platform'
import { useProviders } from '../lib/queries'

const icons: Record<string, React.ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.24 1.4-1.66 4.1-5.4 4.1-3.25 0-5.9-2.7-5.9-6s2.65-6 5.9-6c1.85 0 3.1.8 3.8 1.47l2.6-2.5C16.74 3.6 14.6 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.73 8.8-8.98 0-.6-.07-1.06-.15-1.52z" />
      <path fill="#4285F4" d="M21.65 12.32c0-.6-.07-1.06-.15-1.52H12v3.9h5.4c-.11.67-.5 1.67-1.33 2.42l3.07 2.38c1.8-1.66 2.51-4.1 2.51-7.18z" />
      <path fill="#FBBC05" d="M6.1 12c0-.68.12-1.33.32-1.94L3.2 7.6A9.3 9.3 0 0 0 2.8 12c0 1.5.36 2.92 1 4.18l3.2-2.48A5.8 5.8 0 0 1 6.1 12z" />
      <path fill="#34A853" d="M12 21.3c2.6 0 4.78-.86 6.38-2.32l-3.07-2.38c-.82.57-1.94.97-3.31.97-2.54 0-4.7-1.67-5.47-3.98L3.33 16.1A9.3 9.3 0 0 0 12 21.3z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" className="size-5 fill-bone" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
    </svg>
  ),
}

export function SocialButtons({ next }: { next: string }) {
  const { data } = useProviders()
  // Google no permite OAuth dentro de WebViews: en la app nativa se ofrece email (y GitHub).
  const providers = (data?.providers ?? []).filter((p) => !(isNativeApp() && p.name === 'google'))
  if (!providers.length) return null
  return (
    <div className="space-y-3">
      {providers.map((p) => (
        <a
          key={p.name}
          href={`/api/v1/auth/oauth/${p.name}/start`}
          onClick={() => rememberNext(next)}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-coal font-semibold transition-colors hover:border-brass"
        >
          {icons[p.name]} Continuar con {p.label}
        </a>
      ))}
      <div className="flex items-center gap-4 py-2 text-xs text-dust">
        <span className="h-px flex-1 bg-line" /> o con tu email <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  )
}
