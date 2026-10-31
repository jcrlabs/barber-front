import { Capacitor } from '@capacitor/core'

/** true dentro del APK/IPA (shell Capacitor que carga la web). */
export const isNativeApp = () => Capacitor.isNativePlatform()

/** true si se abrió como app instalada (PWA en pantalla de inicio o shell nativo). */
export const isStandalone = () =>
  isNativeApp() ||
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
