# barber-front — Edgar Barber

Web de reservas de la barbería **Edgar Barber**: landing con carta y equipo, reserva en 4 pasos con ticket en vivo, área de cliente, agenda de barberos y panel de administración.

**Stack:** React 19 · Vite · TypeScript · Tailwind v4 · TanStack Query · Zustand · React Hook Form + Zod · nginx (unprivileged) · Helm · ArgoCD

## Rutas

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/` | público | Hero, carta de precios, equipo, cómo funciona |
| `/reservar` | público (confirmar requiere sesión) | Servicio → barbero (o "sin preferencia") → día y hora → confirmar. Estado en la URL: sobrevive al login |
| `/login`, `/registro` | público | Email/contraseña y Google/GitHub (solo los proveedores configurados en el back) |
| `/auth/callback` | público | Vuelta del login social: canjea la cookie de refresh por sesión |
| `/mis-citas`, `/perfil` | cliente | Próximas/historial, cancelar dentro de plazo; datos, contraseña, cerrar todas las sesiones |
| `/agenda` | barbero/admin | Timeline del día, marcar completada / no presentado / cancelar |
| `/admin` | admin | Resumen, citas, servicios, equipo (horarios por franjas), usuarios y roles |

## Sesión

- Access token JWT en memoria (Zustand), nunca en `localStorage`.
- Refresh token en cookie `HttpOnly; Secure; SameSite=Strict` limitada a `/api/v1/auth`; al abrir la app se restaura con `POST /auth/refresh`.
- nginx sirve la SPA y proxya `/api/` al servicio `barber-back` del mismo namespace: mismo origen, sin CORS.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173, proxya /api a http://localhost:8080 (VITE_DEV_API)
```

## Despliegue

- `develop` → `ghcr.io/jcrlabs/barber-front:develop-<sha>` → `edgarbarber-test.jcrlabs.net`
- tag `vX.Y.Z` → `ghcr.io/jcrlabs/barber-front:vX.Y.Z` → `edgarbarber.jcrlabs.net`
