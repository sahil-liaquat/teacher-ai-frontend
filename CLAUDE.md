# CLAUDE.md — Frontend (`frontend/`)

Next.js 16 (App Router) + React 19 + TypeScript. Teachers sign in, browse the
textbook catalogue, generate lesson plans / worksheets / presentations / notes /
activities, and export them. A second product line, **TeachPad Primary**, lives
under `/primary` — see
[`components/primary/CLAUDE.md`](components/primary/CLAUDE.md).

See the root [`../CLAUDE.md`](../CLAUDE.md) for product context and the deploy
topology. This file is the frontend's working manual.

- **Next `16.x`, React `19.x`, TS `5.x`, Tailwind `3.x`**.
- UI: Radix primitives + Tailwind + `lucide-react`,
  `class-variance-authority` + `clsx` + `tailwind-merge` for variants/classes.
  `framer-motion` and `lottie-web` for motion.
- Forms: `react-hook-form` + `zod` (`@hookform/resolvers`).
- Server state: `@tanstack/react-query`. Charts: `recharts`. Exports: `jspdf`
  (PDF), `pptxgenjs` (PPTX); DOCX assembled in `lib/*-export.ts`.
- Auth: `@supabase/supabase-js` — Supabase is the token issuer.
- **Scale:** 79 routes, ~49 `lib/` modules, 27 test files.

## Run / scripts

```bash
npm install
npm run dev        # next dev -p 3000 --webpack
npm run build      # next build
npm run lint       # ⚠ this is `tsc --noEmit` (typecheck), NOT eslint
npm run typecheck  # same thing, honestly named
npm run test       # node --experimental-strip-types --test tests/**/*.test.ts
npm run test:routes# route smoke check (scripts/smoke-routes.mjs)
npm run icons      # regenerate the favicon/PWA icon set from the master
```

`npm run test` is a **real suite** — 27 files on the node test runner. Run it
alongside `npm run lint`; neither covers the other.

Set `NEXT_PUBLIC_API_URL` in `.env` to point at the backend. If unset, the
client falls back to the **Render backend** — so the app can appear to "work"
against a remote server even with no local backend running.

Port `:3000` is often taken by an unrelated app on this machine. Verify the real
port before doing runtime checks.

### ⚠ Stale `.next/` type artifacts produce phantom typecheck errors

After a branch change that deletes routes, `tsc --noEmit` can report
`Cannot find module '../../../app/<deleted-route>/page.js'` from files under
`.next/dev/types/` and `.next/types/`. These are **generated**, not source.

```bash
rm -rf .next && npx tsc --noEmit
```

If the errors are all under `.next/`, the source was always clean.

## Structure

```
app/                Next App Router (file = route), 79 routes
  layout.tsx        root layout → <Providers>; metadata title "TeachPad"
  (legal)/          contact, privacy, refund, terms
  login/ signup/ reset-password/ auth/confirm/  auth screens
  dashboard/        teacher area — lesson-plans, worksheets,
                    presentation-generator, notes-generator,
                    activity-generator, writing-assistant, textbooks,
                    resources, reports, settings, classroom-tools, streak,
                    workshops, my-workspace, recent-generations, billing
  primary/          TeachPad Primary (today, roster, library, coverage,
                    settings, resource-library, [section])
  admin/            curriculum, textbooks, users, activity, usage, billing,
                    feedback, influencers, payouts, notifications, workshops,
                    primary-curriculum, system
  influencer/       influencer portal (dashboard, commissions, payouts)
  academy/ ai-tools/ featured-teachers/ boards-curriculums/   marketing
components/         UI; components/ui/* are the Radix-based primitives
  admin/ auth/ billing/ dashboard/ feedback/ influencer/ legal/
  notifications/ onboarding/ primary/ profile/ streak/ ui/ workspace/
lib/                non-UI logic (see below)
tests/              node test runner suites (auth/, workspace/)
public/             heavy themed assets
```

Path alias **`@/*` → `./*`** (see `tsconfig.json`), e.g. `@/components/...`,
`@/lib/api`.

## `lib/` — the important non-UI code

- **`api.ts` is the single backend client and the source of truth for API
  types.** Everything talks to the backend through it. It:
  - resolves the API base (`NEXT_PUBLIC_API_URL` → `…/api/v1`);
  - manages Supabase tokens in `localStorage` (`access_token`/`refresh_token`,
    plus migration from legacy `teacher_ai_*` keys), with proactive refresh and
    an auth-change broadcast event;
  - defines the TS types for every entity and generate-payload.

  When adding or changing an endpoint, do it **here** — don't scatter
  `fetch`/axios calls through components.

- **`errors.ts` — the only sanctioned path from a caught error to the UI.**
  See the rule below.
- **Exports:** `lesson-plan-export.ts`, `worksheet-export.ts`,
  `presentation-export.ts`, `presentation-generator.ts`,
  `generated-text-pdf.ts`, `primary-coverage-export.ts`.
- **Localisation:** `localized-text.ts`, `worksheet-localization.ts`,
  `legal.ts`.
- **Storage helpers** (`localStorage`): `safe-storage.ts` (use this, not raw
  `localStorage`), `form-draft-storage.ts`, `pending-lesson-plan.ts`,
  `saved-resources.ts`.
- **Hooks:** `use-billing.ts`, `use-motion.ts`, `use-resend-cooldown.ts`,
  `use-primary-resources.ts`, `use-primary-section.ts`.
- **`workspace/`** — the my-workspace domain: `aggregation`, `readiness`,
  `recommendations`, `mission-control`, `routes`, `formatters`,
  `subject-images`, `types`.
- **21 `primary-*` modules** — documented in
  [`components/primary/CLAUDE.md`](components/primary/CLAUDE.md).
- Small helpers: `utils.ts` (the `cn()` class merger), `profile.ts`, `phone.ts`,
  `email-typo.ts`, `auth-redirect.ts`, `tools.ts`, `supabase.ts`.

## The error gateway — never surface a raw message

Backend errors arrive as `{detail, code}`. **Always** render through
`getErrorMessage(error, fallback, overrides?)` from `lib/errors.ts`.

The trust rule: a `code` property proves the backend's error layer authored the
message, so `error.message` is safe to show. Without a code, a 5xx collapses to a
generic message and a fetch-level `TypeError` becomes a network message.

- `UNTRUSTED_CODES` (currently `SCHEMA_VALIDATION`) carry pydantic's field-level
  wording — accurate, useless to a teacher — and fall back instead.
- `CODE_OVERRIDES` supplies friendlier page-agnostic wording per code; the
  `overrides` argument does it per call site.
- A new backend code needs **no** frontend change to display correctly. Only add
  a mapping when the backend's wording is genuinely wrong for the surface.

Never render `error.message` or `String(e)` directly.

## State & data conventions

- **Server data → React Query** (`useQuery`/`useMutation`); the `QueryClient` is
  created in `components/providers.tsx` (which also provides the toast context).
  Query keys are defined alongside the API calls in `lib/api.ts`.
- **Forms → react-hook-form + zod.**
- **Local/draft UI state → `localStorage`** via `lib/safe-storage.ts` and the
  `lib/*-storage.ts` helpers. Raw `localStorage` throws in private-mode Safari —
  `safe-storage` exists for that reason.
- There is no Redux/Zustand/global store.
- **Auth:** tokens live in `localStorage` and are attached/refreshed by
  `api.ts`; Supabase is the issuer. On load, the app validates via `GET /me`.

## Billing surfaces

`components/billing/` renders subscription state from `GET /billing/me`.

- `trial-status-pill.tsx` — the `past_due` branch must sit **before** the
  `!is_pro` fallback. Otherwise a paying customer whose bank balance was short
  is told "Your trial has ended".
- `upgrade-modal.tsx` — the seam every generator 402 routes through. For a
  past-due user it offers to clear the outstanding charge, not to buy a second
  subscription against the same account.
- `app/dashboard/billing/page.tsx` — the past-due banner and plan card.
- `past_due` is `null` whenever the subscription is healthy, so older clients
  are unaffected and new surfaces simply stay hidden if the backend is behind.

## Exports — the non-ASCII trap

**PDF export strips every non-ASCII character.** Hindi and Urdu documents
download blank. Fonts do not fix it — it needs complex-script shaping that the
PDF path doesn't do. Non-Latin scripts must route to `window.print()` instead.

Before changing an export path, check `worksheet-localization.ts` /
`localized-text.ts` for which scripts are affected.

## Favicon / PWA icons

Generated, not hand-made. Drop a square master PNG at
`public/assets/teachpad-icon.png` (≥512×512, brand blue `#0165fd`) and run
`npm run icons` (`scripts/generate-icons.mjs`, uses `sharp`). It emits, all
committed:

- `app/favicon.ico` (16/32/48), `app/icon.png` (512), `app/apple-icon.png` (180)
- `public/icons/icon-{192,512}.png` + `icon-maskable-512.png`

Next's file conventions auto-inject the `<link>` tags; the manifest is
`app/manifest.ts`, and `theme-color`/`appleWebApp` metadata live in
`app/layout.tsx`. **⚠ Gotcha:** Next's icon/`.ico` processor rejects non-RGBA
PNGs (`The PNG is not in RGBA format!`), so the generator forces an alpha
channel (`.ensureAlpha()`) — keep that if you edit it.

## Conventions

- `"use client"` only where you need interactivity/hooks; prefer server
  components for static/layout.
- Tailwind utilities inline; compose with `cn()`.
- Reuse `components/ui/*` primitives instead of hand-rolling inputs/dialogs.
- Strict TypeScript; `npm run lint` (= `tsc`) must pass.

## Gaps / cruft specific to the frontend

- **Live Quiz pages run on mock data.** The backend's `quiz.py` is empty and
  unmounted — there is no quiz API. Don't wire these up expecting one.
- Default API base points at a **remote server** — easy to forget you're not
  hitting local. Set `NEXT_PUBLIC_API_URL` explicitly when developing.
- `frontend/.env` **is** committed upstream. Not a leak — only `NEXT_PUBLIC_*`
  values that ship to the browser anyway and are guarded by RLS. Don't put
  anything else in it.
- Committed artifacts worth cleaning: `login-design-check.png` at the project
  root, `tsconfig.tsbuildinfo`, and duplicate `-v2/-v3` images under
  `public/landing/`.
- `tsconfig` `target` is `es5` (unusual for Next 16, but harmless — SWC handles
  transpilation).
- On `feature/primary`, `public/primary-resources` carries ~901 MB of committed
  print assets. That is why pushes of that branch take minutes.
