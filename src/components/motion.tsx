import { clsx } from 'clsx'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

/** Aparece al entrar en pantalla (una sola vez). Sin IntersectionObserver se muestra directamente. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown])
  return (
    <div ref={ref} className={clsx('reveal', shown && 'reveal-in', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/** Cinta de texto en bucle infinito. Repite los textos para cubrir pantallas anchas aunque sean pocos. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const list = Array.from({ length: Math.max(1, Math.ceil(12 / items.length)) }, () => items).flat()
  const row = (hidden?: boolean) => (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden}>
      {list.map((t, i) => (
        <span key={i} className="flex items-center gap-10">
          {t}
          <span className="size-2 rotate-45 bg-brass" />
        </span>
      ))}
    </div>
  )
  return (
    <div className={clsx('flex overflow-hidden select-none', className)}>
      {/* Duración proporcional a la longitud: misma velocidad tenga los textos que tenga. */}
      <div className="animate-marquee flex" style={{ animationDuration: `${list.length * 5.6}s` }}>
        {row()}
        {row(true)}
      </div>
    </div>
  )
}

/** Palabras que se van turnando con un pequeño giro. */
export function Rotator({ words, ms = 2400, className }: { words: string[]; ms?: number; className?: string }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % words.length), ms)
    return () => clearInterval(t)
  }, [words.length, ms])
  return (
    <span className={clsx('inline-grid', className)} aria-live="polite">
      <span key={i} className="animate-flip [grid-area:1/1]">
        {words[i]}
      </span>
    </span>
  )
}

/** Tarjeta con foco de luz que sigue al cursor. */
export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const [pos, setPos] = useState<CSSProperties>({})
  return (
    <div
      className={clsx('spotlight', className)}
      style={pos}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setPos({ '--x': `${e.clientX - r.left}px`, '--y': `${e.clientY - r.top}px` } as CSSProperties)
      }}
    >
      {children}
    </div>
  )
}

/** Número que cuenta hasta su valor al montarse. */
export function CountUp({ value, ms = 700 }: { value: number; ms?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      setN(Math.round(value * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return <>{n}</>
}
