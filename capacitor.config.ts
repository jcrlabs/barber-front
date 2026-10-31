import type { CapacitorConfig } from '@capacitor/cli'

// Shell nativo que carga la web desplegada: cada deploy en K8s actualiza la app sin rebuild.
const config: CapacitorConfig = {
  appId: 'net.jcrlabs.edgarbarber',
  appName: 'Edgar Barber',
  webDir: 'dist',
  server: {
    url: 'https://edgarbarber.jcrlabs.net',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0d0c0b',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0d0c0b',
      overlaysWebView: false,
    },
  },
}

export default config
