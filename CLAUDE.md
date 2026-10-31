# CLAUDE.md — barber-front

Front de reservas de la barbería Edgar Barber (React 19 + Vite + TypeScript + Tailwind v4).

## CI local

Ejecutar **antes de cada commit**:

```bash
npx tsc -b --noEmit
npm run lint
npm run build
```

## Git

- Ramas: `feature/`, `bugfix/`, `hotfix/`, `release/` — sin prefijos adicionales
- Commits: convencional (`feat:`, `fix:`, `chore:`, etc.) — sin mencionar herramientas externas ni agentes en el mensaje
- PRs: título y descripción propios del cambio — sin mencionar herramientas externas ni agentes
- Comentarios y documentación: redactar en primera persona del equipo — sin atribuir autoría a herramientas

## Reglas del proyecto

- El access token vive solo en memoria (`store/auth.ts`). Nunca en localStorage.
- Todas las llamadas pasan por `lib/api.ts` (añade `X-Requested-With: navaja` y renueva el token en 401).
- Redirecciones post-login siempre con `safeNext()` (evita open redirects).
- Tokens de diseño en `src/index.css` (`@theme`); no hardcodear colores nuevos.
