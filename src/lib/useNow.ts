import { useEffect, useState } from 'react'

/** Hora actual que se refresca cada `ms` para mantener el render puro. */
export function useNow(ms = 60_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}
