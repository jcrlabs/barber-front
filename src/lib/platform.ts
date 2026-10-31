import { Capacitor } from '@capacitor/core'

/** true dentro del APK/IPA (shell Capacitor que carga la web). */
export const isNativeApp = () => Capacitor.isNativePlatform()

/** true si se abrió como app instalada (PWA en pantalla de inicio o shell nativo). */
export const isStandalone = () =>
  isNativeApp() || window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

/** iPhone/iPad. El iPad moderno se presenta como Mac, pero con pantalla táctil. */
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
export const isAndroid = () => /android/i.test(navigator.userAgent)

export type IOSBrowser = 'safari' | 'chrome' | 'edge' | 'firefox' | 'inapp'

/** Navegador en iOS, para dar las instrucciones exactas de "Añadir a pantalla de inicio". */
export const iosBrowser = (): IOSBrowser => {
  const ua = navigator.userAgent
  if (/CriOS/i.test(ua)) return 'chrome'
  if (/EdgiOS/i.test(ua)) return 'edge'
  if (/FxiOS/i.test(ua)) return 'firefox'
  if (/FBAN|FBAV|Instagram|Line\/|GSA\//i.test(ua)) return 'inapp'
  return 'safari'
}

/** Enlace público a la última APK en el NAS. */
export const APK_URL = 'https://nas.jcrlabs.net/s/GbDLq7GLPN5C8Lm/download?path=/&files=edgar-barber-latest.apk'
