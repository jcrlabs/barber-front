/** Deja solo dígitos y el + inicial, apto para enlaces tel:. */
export const dialable = (p: string) => p.trim().replace(/(?!^\+)[^0-9]/g, '')

/** Número para wa.me: sin +, y con prefijo de España si viene un móvil nacional de 9 cifras. */
export const whatsappNumber = (p: string) => {
  const d = dialable(p)
  if (d.startsWith('+')) return d.slice(1)
  return d.length === 9 ? `34${d}` : d
}

export const whatsappLink = (p: string, text?: string) => `https://wa.me/${whatsappNumber(p)}${text ? `?text=${encodeURIComponent(text)}` : ''}`
