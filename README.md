# Montanari OS — Frontend

React + TypeScript web app for Montanari OS (client workspace + internal Montanari Tech console),
implementing the approved Claude Design system against the finished backend.

## Stack

- React 18 · TypeScript (strict) · Vite 6
- React Router 6 · TanStack Query 5 · React Hook Form + Zod · Axios
- react-markdown + remark-gfm (stage documents)
- Vitest + Testing Library

Base import alias: `@/` → `src/`.

## Getting started

```bash
cp .env.example .env      # leave VITE_API_BASE_URL empty in dev (Vite proxies /api → :8080)
npm install
npm run dev               # http://localhost:5173  (needs the backend on :8080 for real data)
npm run build             # tsc -b + vite build
npm run test              # vitest
npm run typecheck         # tsc -b --noEmit
npm run gen:api           # regenerate API types from the running backend's OpenAPI (see below)
```

## Architecture

Feature-based (see `03_product_specs/FRONTEND_APP_STRUCTURE.md` in the specs repo):

```
src/
  app/         router (nested project layout), providers (QueryClient/Auth/Toast), layout (AppShell)
  shared/      api client (JWT + refresh + ApiError), design tokens, design-system components, utils
  features/    auth, dashboard, projects, stages, executions, materials, credits, reviews,
               team, auditLogs, admin, exports
  test/        vitest setup + render helpers
```

- **Server state** lives in TanStack Query; **client state** is minimal (session + UI).
- **One API layer**: `shared/api` (Axios instance with JWT attach, single-flight refresh on 401,
  and normalization of every failure to a typed `AppError`). Features never call Axios directly.
- **Two zones, one app**: client (`/app/*`) and internal (`/internal/*`), separated by routes +
  `RoleGuard`. Registration is admin-only — there is no public signup route.

### API types

`src/shared/api/types.ts` is hand-derived from the backend DTOs/enums as an **interim**. Once the
backend is running, regenerate the canonical types from its OpenAPI spec:

```bash
npm run gen:api    # openapi-typescript http://localhost:8080/v3/api-docs -o src/shared/api/schema.ts
```

## Status

All 22 screens from the approved design are implemented and wired to real backend endpoints
(client zone + internal zone). 22 tests (Vitest + Testing Library) pass, covering the 7
acceptance-criteria cases from `FRONTEND_APP_STRUCTURE.md`. `npx tsc -b --noEmit`, `npm run build`,
and `npm run lint` are all clean.

Manually verified end-to-end against a real backend + MySQL (via `docker compose up` in
`montanari-os-backend/`): login, dashboard, project creation, materials upload, stage timeline,
stage execution with the Fable Gate, human review (request → cross-org document read → resolve),
execution cost preview, org user listing, and a test `CLIENT_ADMIN` account created via Team →
Invite. Bootstrap `SYSTEM_ADMIN` credentials live in `montanari-os-backend/.env` (gitignored,
local dev only).

**Bugs found and fixed while dogfooding the running app** (both were wrong assumptions in the
hand-derived API types, not backend issues):

- `Dashboard` originally shipped as a static placeholder (never fetched real data) from the first
  vertical-slice pass — completed with real project stats + recent-projects list once other
  screens made the gap obvious.
- `StageDocumentResponse.content` is `null` for a freshly provisioned, not-yet-executed stage —
  the type declared it as a non-nullable `string`, which crashed `DiscoveryPage` and the stage
  editor with `Cannot read properties of null (reading 'trim')`. Fixed (`content: string | null`
  + guards at every call site) with a regression test (`DiscoveryPage.test.tsx`) covering the
  exact null-content case.

**Visual identity fixes — done 2026-07-05.** The favicon was the entire wordmark logo (a wide
strip, meaningless as a square tab icon) — cropped the "M" out of `logo-black.png` into a
standalone isotype asset (`src/assets/isotype-black.png`/`isotype-white.png`, 128×128, transparent
background) and set it as `public/favicon.png`. Separately, the login screen's brand-pane logo
rendered stretched to ~608px wide instead of its natural ~169×22px — root cause was
`.brandPane`'s `display: flex; flex-direction: column` triggering the default `align-items:
stretch` on the `<img>`'s cross axis (width), since `width: auto` doesn't opt an element out of
stretch. Fixed with `align-self: flex-start` on `.brandPane img` in `authLayout.module.css`.

**Fase 7 QA pass — done.** `/app/settings` (the last placeholder screen) is now a real read-only
account page (`SettingsPage.tsx`) sourced from `/api/auth/me` — no profile-edit/change-password
endpoint exists yet, so nothing is invented; the page says so explicitly. Full QA matrix +
execution results (role×zone permissions, cross-org isolation, materials, export, stage lifecycle)
in `../00_strategy/QA_REPORT_FASE7.md`; one HIGH backend auth finding came out of it, tracked in
`../montanari-os-backend/README.md`, not a frontend issue.

## Backend gaps surfaced during implementation (`FUTURE_BACKEND_REQUIRED`)

The design outran the V1 backend in a few places. 5 gaps were flagged; the Fase 7 pre-triage
closed 3 of them with real backend endpoints (all verified end-to-end against a live
`docker compose up` stack), deferring the other 2 to V2:

**Closed:**

1. **Pre-execution estimate / recommended tier** — `GET
   /api/projects/{projectId}/stages/{stageKey}/execution-preview` returns the real Fable Gate
   decision, model tier, and estimated cost with zero side effects (no reservation, no persisted
   evaluation/delegation row). The execution panel shows it before the user confirms, and the real
   result after running. (`features/executions/components/ExecutionPanel.tsx`,
   `features/executions/hooks.ts` → `useExecutionPreview`)
2. **Team: listing users** — `GET /api/users` (org-scoped) backs a real table in the Team page.
   Role changes and deactivation still have no endpoint — deferred to V2 per the triage.
   (`features/team/TeamPage.tsx`, `features/team/hooks.ts` → `useOrgUsers`)
3. **Reviewer document preview** — `GET /api/internal/reviews/{reviewId}/document` (cross-org,
   reviewer-only) now backs a real document preview in the review detail screen.
   (`features/reviews/pages/ReviewDetailPage.tsx`, `features/reviews/hooks.ts` →
   `useReviewDocument`)

4. **Stage templates — real admin editor.** `GET/PUT /api/internal/stage-templates` backs a real
   table + edit modal (name, description, template content, default tier, cost/cap, review and
   gate flags, active status). `stageKey`, `dependsOn` and ordering stay migration-only — editing
   the dependency graph itself is out of scope, this is config tuning, not schema editing.
   (`features/admin/StageTemplatesPage.tsx`, `features/admin/hooks.ts` → `useStageTemplates`)
5. **Model policies — real admin editor.** `GET/PUT /api/internal/model-policies` backs a real
   settings form (escalation threshold, disabled tiers) — these used to be static
   `application.yml` config, now a DB-backed singleton row editable without a deploy. The Fable
   Gate's own safety rules (G1-G10) are deliberately NOT here and never will be — non-negotiable
   per OPEN_DECISIONS.md. (`features/admin/ModelPoliciesPage.tsx`, `features/admin/hooks.ts` →
   `useModelPolicy`)

**Still deferred to V2** (confirmed in the triage, not implemented):

6. **Client "request top-up"** — no client-initiated endpoint (top-up/adjust are MT_ADMIN only).
   The button still opens an informational modal. (`features/credits/pages/WorkspaceCreditsPage.tsx`)
   Deliberately not touched in this pass — no credits-related work happens until there's a real
   (non-fictional) credits API to call.

## Design deltas vs the handoff

- `STAGE_STATUS` tokens completed with `DRAFT` and `REJECTED` (handoff shipped 6 of the backend's 8).
- Model-tier names use the real backend `ModelTier` keys (handoff used placeholder names in v1).
- Mobile variants: the shell is responsive (collapsed rail at tablet, bottom nav at mobile); the
  handoff described mobile but only shipped desktop/tablet artboards.
