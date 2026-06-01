# CLAUDE.md — Frontend (`frontend/`)

Next.js 16 (App Router) + React 19 + TypeScript web app. Teachers sign in,
browse the textbook catalogue, generate lesson plans / worksheets /
presentations, and export them. See the root [`../CLAUDE.md`](../CLAUDE.md) for
product context and flows. This file is the frontend's working manual.

- **Next `16.2.4`, React `19.2.5`, TS `5.6`, Tailwind `3.4`**, Turbopack.
- UI: Radix primitives (`@radix-ui/*`) + Tailwind + `lucide-react`,
  `class-variance-authority` + `clsx` + `tailwind-merge` for variants/classes.
- Forms: `react-hook-form` + `zod` (`@hookform/resolvers`).
- Server state: `@tanstack/react-query`. Charts: `recharts`. Exports: `jspdf`
  (PDF), `pptxgenjs` (PPTX); DOCX assembled in `lib/*-export.ts`.

## Run / scripts

```bash
npm install
npm run dev        # next dev on http://localhost:3000
npm run build      # next build
npm run lint       # ⚠ this is `tsc --noEmit` (typecheck), NOT eslint
npm run test       # ⚠ this is `next build` — there is no real test suite
npm run icons      # regenerate the favicon/PWA icon set from the master (see below)
```

Set `NEXT_PUBLIC_API_URL` in `.env` to point at the backend. If unset, the
client falls back to the **Render dev backend**
(`https://teacher-ai-backend-dev.onrender.com/api/v1`) — so the app can appear to
"work" against a remote server even with no local backend.

## Favicon / PWA icons

The favicon + PWA icon set is **generated, not hand-made.** Drop a single square
master PNG at `public/assets/teachpad-icon.png` (≥512×512, the brand play-button
"t" mark, brand blue `#0165fd`) and run `npm run icons`
(`scripts/generate-icons.mjs`, uses `sharp`). It emits the full set, all committed:

- `app/favicon.ico` (16/32/48), `app/icon.png` (512), `app/apple-icon.png` (180)
- `public/icons/icon-{192,512}.png` + `icon-maskable-512.png` (Android adaptive)

Next's file conventions auto-inject the `<link>` tags; the web manifest is
`app/manifest.ts`, and `theme-color`/`appleWebApp` metadata live in
`app/layout.tsx`. **⚠ Gotcha:** Next's icon/`.ico` processor rejects non-RGBA
PNGs (`The PNG is not in RGBA format!`), so the generator forces an alpha channel
(`.ensureAlpha()`) — keep that if you edit it. Re-run `npm run icons` whenever the
master changes.

## Structure

```
app/                Next App Router (file = route)
  layout.tsx        root layout → <Providers>; metadata title "TeachPad"
  login/ signup/ reset-password/ auth/confirm/   Supabase auth screens
  dashboard/        teacher area (lesson-plans, worksheets, presentation-generator,
                    notes-generator, activity-generator, live-quiz, textbooks,
                    resources, reports, settings, classroom-tools)
  admin/            admin area (curriculum, textbooks, users, generations, system)
components/         UI; components/ui/* are the Radix-based primitives,
                    components/admin/*, components/live-quiz/*
lib/                non-UI logic (see below)
public/             heavy themed assets (landing/, ai-tools/, assets/teachpad-theme/)
```

Path alias **`@/*` → `./*`** (see `tsconfig.json`), e.g. `@/components/...`,
`@/lib/api`.

## `lib/` — the important non-UI code

- **`api.ts` (~700 lines) is the single backend client and the source of truth
  for API types.** Everything talks to the backend through it. It:
  - resolves the API base (`NEXT_PUBLIC_API_URL` → `…/api/v1`);
  - manages Supabase tokens in `localStorage` (`access_token`/`refresh_token`,
    plus migration from legacy `teacher_ai_*` keys), with proactive refresh
    (`TOKEN_REFRESH_SKEW_SECONDS`) and an auth-change broadcast event;
  - defines the TS types for every entity and generate-payload.

  When adding/changing an endpoint, do it here — don't scatter `fetch`/axios calls
  in components.
- `lesson-plan-export.ts`, `worksheet-export.ts`, `presentation-generator.ts` —
  client-side export/format helpers (PDF/DOCX/PPTX).
- `form-draft-storage.ts`, `pending-lesson-plan.ts`, `worksheet-storage.ts` —
  `localStorage` helpers for draft/in-flight state.
- `profile.ts`, `utils.ts` — small helpers (`utils.ts` has the `cn()` class merger).

## State & data conventions

- **Server data → React Query** (`useQuery`/`useMutation`); the `QueryClient` is
  created in `components/providers.tsx` (which also provides the toast context).
  Query keys are defined alongside the API calls in `lib/api.ts`.
- **Forms → react-hook-form + zod**. **Local/draft UI state → `localStorage`**
  via the `lib/*-storage.ts` helpers. There is no Redux/Zustand/global store.
- **Auth:** tokens live in `localStorage` and are attached/refreshed by `api.ts`;
  Supabase is the issuer. On load, the app validates the session via `GET /me`.

## Conventions

- `"use client"` only where you need interactivity/hooks; prefer server
  components for static/layout. Keep data-fetching in React Query hooks, not in
  components ad hoc.
- Tailwind utilities inline; compose with `cn()` (`clsx` + `tailwind-merge`).
- Reuse `components/ui/*` primitives instead of hand-rolling inputs/dialogs.
- Strict TypeScript is on; `npm run lint` (= `tsc`) must pass.

## Gaps / cruft specific to the frontend

- **Notes & Activity generators are not backed by the API:** the pages
  (`app/dashboard/notes-generator`, `.../activity-generator`) and payload types in
  `api.ts` exist, but the **backend has no notes/activity routes** — treat these
  as WIP until the backend catches up.
- **Live Quiz is a mock prototype:** `components/live-quiz/quiz-data.ts` + hardcoded
  `abc123` routes (`app/quiz/abc123/`, `app/dashboard/live-quiz/.../abc123/`); the
  backend `quiz` route isn't even mounted.
- Default API base points at a **remote Render server** — easy to forget you're
  not hitting local. Set `NEXT_PUBLIC_API_URL` explicitly when developing.
- Committed artifacts to clean up: `login-design-check.png` at the project root,
  `tsconfig.tsbuildinfo` (build output), and many duplicate `-v2/-v3` images under
  `public/landing/`.
- `tsconfig` `target` is `es5` (unusual for Next 16, but harmless — SWC handles
  transpilation).
