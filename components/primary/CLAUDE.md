# CLAUDE.md — TeachPad Primary, frontend (`frontend/components/primary/`)

The pre-primary/primary day planner UI. A teacher picks a level and theme and
gets a timed teaching day assembled from an admin-authored curriculum, with a
printable attached to each step.

Backend counterpart — the domain model, the assembly pipeline and the DPDP
constraints — is
[`../../../backend/app/services/CLAUDE.md`](../../../backend/app/services/CLAUDE.md).
Read it before changing anything about students, observations or day assembly.

**Primary has no textbooks and no RAG.** Everything it renders is authored
content plus one optional Gemini adaptation pass.

## Where the code lives

```
components/primary/
  primary-app.tsx      ~640 lines — the shell: routing, section switching, layout
  primary.css          Primary-only styles (this product looks different on purpose)
  pages/
    primary-home-page.tsx          landing / section picker
    primary-today-page.tsx         the day view — the main screen
    primary-activity-detail-page.tsx
    activity_drawer.tsx            step detail drawer
    primary-plan-setup-modal.tsx   first-run level/theme setup
    primary-library-page.tsx       printable catalogue
    primary-coverage-page.tsx      what has been taught
    primary-roster-page.tsx        sections and children
    primary-student-profile.tsx    per-child observations
    primary-settings-page.tsx
```

Routes live in `app/primary/*` (`/primary`, `/today`, `/roster`, `/library`,
`/coverage`, `/settings`, `/[section]`, `/resource-library/[category]`,
`/today/activity/[activityId]`). Authoring lives on the platform-admin side
at `app/admin/master-curriculum` (components in
`components/admin/master-curriculum/`) — that surface owns the *master*
curriculum schools adopt from, and is not part of this directory. The route
files are thin — the real components are here.

## The 21 `lib/primary-*` modules

More Primary logic lives in `lib/` than in this directory. Grouped by job:

| Concern | Modules |
|---|---|
| **Teaching context** (level/subject/theme the teacher is on) | `primary-teaching-context.tsx` (React context), `primary-context-helpers.ts` |
| **Day / activities** | `primary-activity.ts`, `primary-today-view-state.ts` |
| **Themes** | `primary-theme-engine.ts`, `primary-theme-content.ts`, `primary-hero-library.ts` |
| **Resources** | `primary-resource-catalog.ts`, `primary-resource-adapter.ts`, `primary-library-taxonomy.ts`, `use-primary-resources.ts` |
| **Saved resources** | `primary-saved-resources.ts`, `primary-saved-resources-helpers.ts` |
| **Roster** | `primary-roster.ts`, `use-primary-section.ts` |
| **Coverage** | `primary-coverage.ts`, `primary-coverage-export.ts` |
| **Authoring (admin)** | `primary-authoring.ts`, `primary-step-fields.ts`, `primary-step-images.ts` |
| **Feedback** | `primary-feedback.ts` |

`primary-teaching-context.tsx` is the one with a `.tsx` extension because it
exports a React context provider — the teacher's current level/subject/theme
selection, mirrored server-side in `primary_teaching_contexts` (one row per
user). Changing selection semantics means changing both ends.

`primary-step-fields.ts` maps step types to their editable fields. It pairs with
the backend's free-form `details` JSONB on `primary_curriculum_steps` — new step
types are added here, **not** via a migration.

## Testing

Primary is the best-tested part of the frontend. In `tests/workspace/`:

```
primary-generate            primary-today-view-state     primary-authoring
primary-roster              primary-coverage             primary-coverage-export
primary-feedback            primary-admin-curriculum     resource-matching
resource-catalogue          saved-resource-safety        teaching-context-sync
planner-assessment          v2-today-flow                v2-routing
v2-context                  audit-regressions
```

```bash
npm run test                          # all 27 files
node --experimental-strip-types --test tests/workspace/primary-generate.test.ts
```

`teaching-context-sync` and `v2-context` guard the context/server round-trip;
`audit-regressions` exists to stop previously-fixed bugs coming back. Add to
them rather than starting a parallel suite.

## Conventions and traps

- **`PrimaryResource.id` is a catalog string key, not a UUID.** Don't generate,
  validate or route it as a UUID.
- **Two backend routers share the `/primary` prefix** (`primary` and
  `primary_roster`). If an endpoint seems missing, check both before adding one.
- **Never send a child's name.** `PrimaryStudent` is identified by a
  teacher-chosen **code**. The backend has a `display_name` column that is
  deliberately never written, pending a DPDP 2023 consent flow — no schema
  accepts it and no route returns it. Don't add a name field to a form, a type,
  or a payload.
- **Errors still go through `getErrorMessage`.** Primary is not exempt from the
  gateway rule in [`../../CLAUDE.md`](../../CLAUDE.md).
- **Generation is metered and gated** as `GenerationKind.PRIMARY_DAY` — the same
  trial gate and past-due block as every other tool. A day generation can come
  back 402; handle it through the shared upgrade-modal seam.
- Primary carries its own `primary.css` and its own visual language. Don't
  "unify" it with the dashboard styling without asking — the divergence is
  intentional.

## Assets

On `feature/primary`, `public/primary-resources` holds ~901 MB of committed
print assets (including a 50 MB PDF), and `public/assets/primary/` holds the
library imagery. This is why pushing that branch takes minutes rather than
seconds — run those pushes in the background with a long timeout.

`primary-assets-staging/` (another 1.1 GB) is deliberately **not** in the repo.
Don't commit it.
