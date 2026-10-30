import { clsx } from 'clsx'
import { LoaderCircle } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'outline' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-brass text-ink hover:bg-bone shadow-[0_0_0_1px_rgb(201_163_106/.4),0_10px_30px_-10px_rgb(201_163_106/.5)]',
  ghost: 'text-bone hover:bg-smoke',
  outline: 'border border-line text-bone hover:border-brass hover:text-brass',
  danger: 'border border-blood/50 text-[#e2786c] hover:bg-blood hover:text-bone',
}

export function Button({
  variant = 'primary',
  loading,
  className,
  children,
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-200 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'h-9 px-4 text-sm',
        size === 'md' && 'h-11 px-6 text-sm',
        size === 'lg' && 'h-14 px-8 text-base',
        variants[variant],
        className,
      )}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

const fieldBase =
  'w-full rounded-xl border border-line bg-coal px-4 py-3 text-bone placeholder:text-dust transition-colors focus:border-brass focus:outline-none aria-[invalid=true]:border-blood'

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="label">{label}</span>
      {children}
      {error ? <span className="block text-sm text-[#e2786c]">{error}</span> : hint && <span className="block text-xs text-dust">{hint}</span>}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} {...p} className={clsx(fieldBase, className)} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} {...p} className={clsx(fieldBase, 'min-h-24 resize-y', className)} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} {...p} className={clsx(fieldBase, 'appearance-none pr-10', className)} />
})

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={clsx('animate-spin text-brass', className ?? 'size-6')} aria-label="Cargando" />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-xl bg-smoke', className)} />
}

export function Pole({ className }: { className?: string }) {
  return <span aria-hidden className={clsx('pole animate-pole block rounded-full', className)} />
}

export function Monogram({ name, src, className }: { name: string; src?: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
  if (src) return <img src={src} alt="" referrerPolicy="no-referrer" className={clsx('rounded-full object-cover', className)} />
  return (
    <span
      aria-hidden
      className={clsx('grid place-items-center rounded-full border border-brass/40 bg-smoke font-display font-bold text-brass uppercase', className)}
    >
      {letters}
    </span>
  )
}

const statusStyles: Record<string, string> = {
  confirmed: 'bg-brass/15 text-brass border-brass/30',
  completed: 'bg-moss/15 text-[#9dc086] border-moss/30',
  cancelled: 'bg-smoke text-dust border-line line-through',
  no_show: 'bg-blood/15 text-[#e2786c] border-blood/30',
}

export function StatusBadge({ status, children }: { status: string; children: ReactNode }) {
  return <span className={clsx('inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[0.68rem] tracking-wider uppercase', statusStyles[status])}>{children}</span>
}

export function SectionTitle({ eyebrow, title, accent }: { eyebrow: string; title: string; accent?: string }) {
  return (
    <div className="space-y-3">
      <p className="label flex items-center gap-3">
        <span className="h-px w-8 bg-brass" /> {eyebrow}
      </p>
      <h2 className="font-display text-5xl leading-[0.9] font-extrabold tracking-tight uppercase sm:text-6xl">
        {title} {accent && <em className="font-serif font-normal tracking-normal text-brass normal-case italic">{accent}</em>}
      </h2>
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      <div className="text-brass">{icon}</div>
      <p className="font-display text-2xl font-bold uppercase">{title}</p>
      {children && <div className="max-w-sm text-ash">{children}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/80 backdrop-blur-sm sm:place-items-center" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="animate-rise max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-coal p-6 sm:max-w-lg sm:rounded-3xl sm:p-8"
      >
        <h3 className="mb-6 font-display text-3xl font-extrabold uppercase">{title}</h3>
        {children}
      </div>
    </div>
  )
}
