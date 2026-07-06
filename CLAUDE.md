# montanari-os-frontend

Complementa el `CLAUDE.md` de la raíz del workspace (`Montanari OS/CLAUDE.md`) — ese define las
invariantes de producto y los comandos; acá va solo el detalle específico de este repo. No repetir
reglas de la raíz al editarlos.

## Estructura

- `src/app/` — shell de aplicación: `router/` (mapa de rutas), `layout/` (`AppShell`),
  `providers/`.
- `src/features/<feature>/` — vertical por dominio: `pages/`, `components/`, `hooks.ts`,
  `api/<feature>Api.ts`, `labels.ts`, `index.ts` (barrel). Nada de una feature importa internals
  de otra: solo vía su barrel o vía `shared`.
- `src/shared/` — `api/` (client, tipos, tokenStore), `components/` (librería UI),
  `design/` (tokens), `utils/`.
- Alias de import: `@/` → `src/`.

## Tipos de API — generados, no manuales

`npm run gen:api` regenera `src/shared/api/schema.ts` desde el OpenAPI del backend corriendo
(`localhost:8080`). **Nunca escribir a mano tipos de request/response del backend** — si el
contrato cambió, levantar el stack y regenerar. Los tipos de dominio (`UserRole`, `ModelTier`,
etc.) se re-exportan desde `@/shared/api`.

## Capa de API y auth — no tocar sin cuidado

`src/shared/api/client.ts` concentra lógica delicada, con bugs ya pagados:

- `AUTH_BYPASS` es una lista de URLs con **match exacto** (no substring) — al agregar un endpoint
  público nuevo, agregar la URL literal. `/api/auth/register` NO va ahí (es admin-gated).
- El refresh de token es single-flight; cualquier código que necesite el refresh token estable
  (ej. logout) debe `await awaitPendingRefresh()` antes de leerlo.
- `localStorage` solo a través de `tokenStore` (`safeGet`/`safeSet`/`safeRemove`) — nunca acceso
  directo (revienta en modo privado/storage bloqueado).
- Errores: siempre `AppError`; en catch usar los helpers `isForbidden` / `isNotEnoughCredits` /
  `isExecutionBlocked` para mensajes específicos antes del fallback genérico.

## Data fetching (TanStack Query)

- Hooks por feature en `hooks.ts` (`useMaterials`, `useExecuteStage`, …) con factories de query
  keys — invalidar por key factory, nunca por string suelta.
- Polling/side-effects que deben sobrevivir a la navegación van en el layout que persiste
  (`ProjectLayout` llama `useExecutions(projectId)` por esto), no solo en el componente que los
  dispara.
- Estado local editable (drafts, formularios de policy) se siembra **una sola vez por clave** con
  un ref (`initializedForKey` en el editor de stages, `initialized` en ModelPolicies) — un
  refetch de fondo jamás pisa una edición sin guardar. Replicar el patrón en pantallas nuevas.

## Formularios y UI

- Formularios: react-hook-form + `zodResolver`, schema `z.object(...)` arriba del componente.
- Usar la librería de `@/shared/components` antes de crear nada: `Button`, `Badge`, `Icon`,
  `Modal`, `ConfirmDialog`, `DataTable`, `Pagination` (¡no duplicar pagers!), `LoadingState` /
  `ErrorState` / `EmptyState`, `useToast`, `MarkdownPreview`, `StageStatusBadge`, `ModelTierPill`,
  `FileUploadDropzone`.
- Toda pantalla con datos remotos cubre los tres estados: loading, error (con retry), empty.
- Lookups sobre `Record<Enum, …>` (labels, tonos de badge) siempre con fallback
  (`?? META.DEFAULT`) — un valor nuevo del backend no puede tirar la pantalla.
- Feedback de mutaciones: toast de éxito/error con el mensaje del `AppError` cuando exista.
- Copy de UI en inglés.

## Estilos

- CSS Modules (`*.module.css`) por feature + variables de diseño (`var(--color-*)`,
  `var(--radius-*)`); tokens en `src/shared/design/`. **Nunca hex hardcodeado** — la paleta es
  monocromo + acento indigo y semánticos, todo vía tokens. Tipografía Inter; `font-mono` para
  ids/keys técnicos.

## Rutas y roles

- Todas las rutas en `src/app/router/index.tsx`, envueltas en `RoleGuard` con el array de roles
  correcto (`CLIENT_ROLES` / `INTERNAL_ROLES` / `ADMIN_ROLES`). Ruta nueva = decidir zona y guard
  primero.
- Rutas de proyecto van como children de `ProjectLayout` (usan `useProjectContext()`).

## Tests y verificación

- Tests colocados junto al código (`*.test.tsx`, vitest + testing-library). `npm test` corre todo.
- Antes de dar por terminado un cambio: `npm run typecheck && npm run lint && npm test`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
