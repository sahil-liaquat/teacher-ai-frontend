"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Rocket,
  Sparkles,
} from "lucide-react";
import {
  backendApi,
  type AcademicProfile,
  type CurriculumStartingPoint,
  type OnboardingState,
  type PrimaryAcademicYear,
  type SchoolLevel,
  type SchoolProgramme,
} from "@/lib/api";
import {
  CURRICULUM_SOURCES,
  SETUP_SCREENS,
  clearDeferredSetup,
  gatingScreens,
  resumeScreenKey,
  screenIndex,
} from "@/lib/school-admin-onboarding";
import { SCHOOL_LEVELS_QUERY_KEY } from "@/lib/use-school-levels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

/**
 * Guided school setup.
 *
 * ⚠ This wizard STORES NO CONFIGURATION. Every screen writes through the
 * service that already owns that concept; what the wizard adds is a path and a
 * progress marker. A wizard keeping its own copy of the answers drifts the
 * moment someone changes a setting from Settings.
 *
 * ⚠ SCREENS ARE NOT BACKEND STEPS. The backend tracks five and rejects
 * `advance()` outside 1–5. The wizard shows eight screens — a welcome, a
 * working-days screen and a review that the backend has no step for — so each
 * screen declares the tracked step it satisfies, and the extra ones declare
 * none. See `lib/school-admin-onboarding.ts`.
 *
 * ⚠ Progress is resumable and DERIVED. The resume point comes from the
 * backend's readiness computation over real rows, so a school that set its
 * framework in Settings resumes at Programmes rather than at the beginning.
 */
export function SetupWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const onboarding = useQuery<OnboardingState>({
    queryKey: ["school-admin", "onboarding"],
    queryFn: backendApi.schoolAdminOnboarding,
  });
  const profile = useQuery<AcademicProfile>({
    queryKey: ["school-admin", "academic-profile"],
    queryFn: backendApi.schoolAdminAcademicProfile,
  });

  const readiness = onboarding.data?.readiness;

  /**
   * The URL owns the screen, so a step is linkable and Back works.
   *
   * ⚠ Accepts BOTH forms. The Overview prompt links `?step=<n>` with the
   * backend's numeric `resume_step`, and Settings links `?step=3`. Those links
   * predate this rewrite and still have to land on the right screen, so a
   * numeric value is resolved through the screen that satisfies that tracked
   * step rather than being treated as an index into the new screen list —
   * which would silently send `?step=3` to the wrong place.
   */
  const raw = params.get("step");
  const numeric = Number(raw);
  const screenKey = (() => {
    if (raw && !Number.isNaN(numeric) && numeric >= 1 && numeric <= 5) {
      return SETUP_SCREENS.find((screen) => screen.backendStep === numeric)?.key ?? "welcome";
    }
    if (raw && SETUP_SCREENS.some((screen) => screen.key === raw)) return raw;
    return resumeScreenKey(readiness);
  })();
  const index = screenIndex(screenKey);
  const screen = SETUP_SCREENS[index];

  function goto(nextIndex: number) {
    const target = SETUP_SCREENS[Math.min(Math.max(nextIndex, 0), SETUP_SCREENS.length - 1)];
    router.replace(`/school-admin/setup?step=${target.key}`, { scroll: false });
    // Only tracked screens advance the backend marker, and `advance()` is
    // monotonic server-side, so revisiting an earlier screen cannot rewind it.
    if (target.backendStep && target.backendStep > (onboarding.data?.step ?? 0)) {
      void backendApi
        .schoolAdminAdvanceOnboarding(target.backendStep)
        .then(() => queryClient.invalidateQueries({ queryKey: ["school-admin", "onboarding"] }));
    }
  }

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["school-admin", "academic-profile"] }),
      queryClient.invalidateQueries({ queryKey: ["school-admin", "onboarding"] }),
      queryClient.invalidateQueries({ queryKey: ["school-admin", "programmes"] }),
      queryClient.invalidateQueries({ queryKey: ["school-admin", "levels"] }),
      // The canonical level list every other surface selects from. Without this
      // a level added here would not appear in Curriculum until a hard reload.
      queryClient.invalidateQueries({ queryKey: SCHOOL_LEVELS_QUERY_KEY }),
    ]);

  const finish = useMutation({
    mutationFn: backendApi.schoolAdminCompleteOnboarding,
    onSuccess: async () => {
      // The school is configured; a stale "I'll do it later" must not outlive it.
      clearDeferredSetup();
      await invalidate();
      toast({ title: "Your school is ready" });
      router.replace("/school-admin");
    },
    onError: (error) =>
      toast({
        title: "Setup isn't finished yet",
        // The backend names the unmet steps; showing them beats a generic error.
        description: getErrorMessage(error, "Some steps still need attention."),
        variant: "error",
      }),
  });

  if (onboarding.isLoading || profile.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-14" /><Skeleton className="h-[420px]" /></div>;
  }

  const isWelcome = screen.key === "welcome";
  const isReview = screen.key === "review";

  return (
    <div>
      {!isWelcome ? (
        <ProgressRail activeIndex={index} readiness={readiness} onSelect={goto} />
      ) : null}

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-3xl">
          {screen.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{screen.blurb}</p>
      </header>

      <div className={cn(isWelcome ? "" : "rounded-3xl border border-slate-200 bg-white p-6")}>
        {screen.key === "welcome" ? <WelcomeScreen onStart={() => goto(1)} /> : null}
        {screen.key === "framework" ? <FrameworkStep profile={profile.data} onDone={invalidate} /> : null}
        {screen.key === "programmes" ? <ProgrammesStep hasFramework={Boolean(profile.data?.framework)} onDone={invalidate} /> : null}
        {screen.key === "levels" ? <LevelsStep onDone={invalidate} /> : null}
        {screen.key === "year" ? <AcademicYearStep onDone={invalidate} /> : null}
        {screen.key === "calendar" ? <WorkingDaysStep /> : null}
        {screen.key === "curriculum" ? <CurriculumStep profile={profile.data} onDone={invalidate} /> : null}
        {screen.key === "review" ? (
          <ReviewScreen
            readiness={readiness}
            profile={profile.data}
            onFix={(key) => goto(screenIndex(key))}
          />
        ) : null}
      </div>

      {!isWelcome ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => goto(index - 1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {isReview ? (
            <Button disabled={finish.isPending} onClick={() => finish.mutate()}>
              {finish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              Activate school
            </Button>
          ) : (
            <Button onClick={() => goto(index + 1)}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** The map. Ticks come from server readiness, never from "screens visited". */
function ProgressRail({
  activeIndex,
  readiness,
  onSelect,
}: {
  activeIndex: number;
  readiness: Record<string, boolean> | undefined;
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="mb-7 flex flex-wrap gap-1.5" aria-label="Setup progress">
      {SETUP_SCREENS.map((screen, index) => {
        if (screen.key === "welcome") return null;
        const done = screen.readinessKey ? readiness?.[screen.readinessKey] : false;
        const active = index === activeIndex;
        return (
          <li key={screen.key}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                active
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-slate-900",
              )}
            >
              <span
                className={cn(
                  "grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold",
                  done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
                )}
              >
                {done ? <Check className="h-2.5 w-2.5" /> : index}
              </span>
              {screen.title}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white">
        <Sparkles className="h-6 w-6" />
      </span>
      <h2 className="mt-6 text-xl font-semibold text-slate-950">Let&rsquo;s set up your school</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Six short steps. You are telling TeachPad how your school is organised so it can
        plan curriculum against your real levels, your real year and your real teaching days.
      </p>
      <ul className="mt-6 space-y-2.5">
        {gatingScreens().map((screen) => (
          <li key={screen.key} className="flex items-start gap-2.5 text-sm text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <span>
              <span className="font-semibold text-slate-900">{screen.title}</span>
              <span className="text-slate-500"> — {screen.blurb}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button className="mt-7" onClick={onStart}>
        Get started <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="mt-3 text-xs text-slate-500">
        Nothing here is permanent — every choice can be changed later from Settings.
      </p>
    </div>
  );
}

function FrameworkStep({ profile, onDone }: { profile?: AcademicProfile; onDone: () => Promise<unknown> }) {
  const { toast } = useToast();
  const frameworks = useQuery({
    queryKey: ["school-admin", "frameworks"],
    queryFn: backendApi.schoolAdminFrameworks,
  });
  const choose = useMutation({
    mutationFn: (id: string) => backendApi.schoolAdminSetFramework(id),
    onSuccess: async () => { await onDone(); },
    onError: (error) => toast({ title: "Could not set that framework", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  if (frameworks.isLoading) return <Skeleton className="h-40" />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {(frameworks.data ?? []).map((framework) => {
        const active = profile?.framework?.id === framework.id;
        return (
          <button
            key={framework.id}
            type="button"
            disabled={choose.isPending}
            onClick={() => choose.mutate(framework.id)}
            className={cn(
              "rounded-2xl border p-4 text-left transition disabled:opacity-60",
              active ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 hover:border-blue-200",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
              {framework.name}
              {active ? <CheckCircle2 className="h-4 w-4 text-blue-600" /> : null}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">{framework.full_name}</span>
          </button>
        );
      })}
      {!frameworks.data?.length ? (
        <p className="text-sm text-slate-500">No frameworks are configured yet.</p>
      ) : null}
    </div>
  );
}

function ProgrammesStep({ hasFramework, onDone }: { hasFramework: boolean; onDone: () => Promise<unknown> }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const enabled = useQuery<SchoolProgramme[]>({
    queryKey: ["school-admin", "programmes", "enabled"],
    queryFn: backendApi.schoolAdminEnabledProgrammes,
    enabled: hasFramework,
  });
  const available = useQuery<SchoolProgramme[]>({
    queryKey: ["school-admin", "programmes", "available"],
    queryFn: backendApi.schoolAdminAvailableProgrammes,
    enabled: hasFramework,
  });
  const toggle = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on ? backendApi.schoolAdminEnableProgramme(id) : backendApi.schoolAdminDisableProgramme(id),
    onSuccess: async () => {
      await Promise.all([enabled.refetch(), available.refetch()]);
      await onDone();
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "programmes"] });
    },
    onError: (error) =>
      toast({ title: "Could not change that programme", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  // Programmes belong to the framework, so this is a real dependency rather
  // than a validation message — there is nothing to list until one is chosen.
  if (!hasFramework) {
    return <p className="text-sm font-semibold text-amber-700">Choose your framework first — programmes belong to it.</p>;
  }
  if (enabled.isLoading || available.isLoading) return <Skeleton className="h-40" />;

  const rows = [...(enabled.data ?? []), ...(available.data ?? [])];
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((row) => {
        const on = row.status === "enabled";
        return (
          <li key={row.programme_id} className="flex items-center justify-between gap-4 py-3">
            <span>
              <span className="block text-sm font-bold text-slate-900">{row.name}</span>
              {row.description ? <span className="block text-xs text-slate-500">{row.description}</span> : null}
              {on && row.in_use ? (
                <span className="mt-1 block text-xs font-semibold text-amber-700">Levels reference this programme</span>
              ) : null}
            </span>
            <Button
              variant={on ? "outline" : "default"}
              disabled={toggle.isPending}
              onClick={() => toggle.mutate({ id: row.programme_id, on: !on })}
            >
              {on ? "Offered" : "Offer this"}
            </Button>
          </li>
        );
      })}
      {rows.length === 0 ? <li className="py-3 text-sm text-slate-500">This framework has no programmes yet.</li> : null}
    </ul>
  );
}

function LevelsStep({ onDone }: { onDone: () => Promise<unknown> }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [programmeId, setProgrammeId] = useState("");
  const enabled = useQuery<SchoolProgramme[]>({
    queryKey: ["school-admin", "programmes", "enabled"],
    queryFn: backendApi.schoolAdminEnabledProgrammes,
  });
  const levels = useQuery<SchoolLevel[]>({
    queryKey: ["school-admin", "levels"],
    queryFn: () => backendApi.schoolAdminLevels(),
  });
  const catalogue = useQuery<SchoolLevel[]>({
    queryKey: ["school-admin", "levels", "catalogue"],
    queryFn: backendApi.schoolAdminLevelCatalogue,
  });

  const refresh = async () => { await levels.refetch(); await onDone(); };
  const onError = (error: unknown) =>
    toast({ title: "Could not save that level", description: getErrorMessage(error, "Try again."), variant: "error" });

  const create = useMutation({
    mutationFn: () => backendApi.schoolAdminCreateLevel({
      name, programme_id: programmeId || null, sort_order: (levels.data?.length ?? 0) * 10,
    }),
    onSuccess: async () => { setName(""); await refresh(); },
    onError,
  });
  const adopt = useMutation({
    mutationFn: (code: string) => backendApi.schoolAdminAdoptLevel(code, programmeId),
    onSuccess: refresh,
    onError,
  });
  const archive = useMutation({
    mutationFn: (id: string) => backendApi.schoolAdminArchiveLevel(id),
    onSuccess: refresh,
    onError,
  });

  const programmes = enabled.data ?? [];
  if (!programmes.length) {
    return <p className="text-sm font-semibold text-amber-700">Offer at least one programme first — every level sits inside one.</p>;
  }
  const existingCodes = new Set((levels.data ?? []).map((level) => level.code));

  return (
    <div className="space-y-6">
      <label className="block text-sm font-semibold text-slate-700">
        Programme
        <select
          value={programmeId}
          onChange={(event) => setProgrammeId(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
        >
          <option value="">Not in a programme yet</option>
          {programmes.map((programme) => (
            <option key={programme.programme_id} value={programme.programme_id}>{programme.name}</option>
          ))}
        </select>
      </label>

      <div>
        <p className="text-sm font-bold text-slate-900">Your levels</p>
        {levels.isLoading ? <Skeleton className="mt-3 h-20" /> : (
          <ul className="mt-3 divide-y divide-slate-100">
            {(levels.data ?? []).map((level) => (
              <li key={level.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm font-semibold text-slate-800">{level.name}</span>
                <Button variant="outline" disabled={archive.isPending} onClick={() => archive.mutate(level.id)}>
                  Remove
                </Button>
              </li>
            ))}
            {!levels.data?.length ? (
              <li className="py-2 text-sm text-slate-500">
                No levels yet. Adopt TeachPad&rsquo;s below, or add your own.
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-900">Add a level</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            className="min-w-[200px] flex-1 bg-white"
            placeholder="e.g. Grade 4"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>Add</Button>
        </div>
        {catalogue.data?.length ? (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Or use TeachPad&rsquo;s levels
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {catalogue.data
                .filter((level) => !existingCodes.has(level.code))
                .map((level) => (
                  <button
                    key={level.code}
                    type="button"
                    disabled={!programmeId || adopt.isPending}
                    onClick={() => adopt.mutate(level.code)}
                    title={programmeId ? undefined : "Choose a programme first"}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 disabled:opacity-50"
                  >
                    + {level.name}
                  </button>
                ))}
            </div>
          </>
        ) : null}
        {/* ⚠ Honest about a real constraint. `primary_curriculum_lessons` pins
            `level` to TeachPad's eight codes with a CHECK constraint, so a
            level a school invents can hold classes and teachers but cannot yet
            hold curriculum. Saying so here beats a 422 three screens later. */}
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Levels you create yourself can hold classes, sections and teachers. Curriculum
          authoring currently supports TeachPad&rsquo;s own levels only.
        </p>
      </div>
    </div>
  );
}

function AcademicYearStep({ onDone }: { onDone: () => Promise<unknown> }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", starts_on: "", ends_on: "" });
  const years = useQuery({
    queryKey: ["school-admin", "academic-years"],
    queryFn: backendApi.schoolAdminAcademicYears,
  });
  // Uses the existing academic-year service — no parallel calendar system.
  const create = useMutation({
    mutationFn: () => backendApi.schoolAdminCreateAcademicYear({ ...form, is_active: true }),
    onSuccess: async () => { await years.refetch(); await onDone(); toast({ title: "Academic year created" }); },
    onError: (error) => toast({ title: "Could not create that year", description: getErrorMessage(error, "Check the dates."), variant: "error" }),
  });

  return (
    <div className="space-y-5">
      {years.isLoading ? <Skeleton className="h-16" /> : years.data?.length ? (
        <ul className="divide-y divide-slate-100">
          {years.data.map((year) => (
            <li key={year.id} className="flex items-center justify-between py-2.5">
              <span className="text-sm font-semibold text-slate-800">{year.name}</span>
              {year.is_active ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">Current</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">No academic year yet. Create one to continue.</p>}

      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-700">Name
            <Input className="mt-2 bg-white" placeholder="2026–27" value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Starts
            <Input type="date" className="mt-2 bg-white" value={form.starts_on}
              onChange={(event) => setForm({ ...form, starts_on: event.target.value })} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Ends
            <Input type="date" className="mt-2 bg-white" value={form.ends_on}
              onChange={(event) => setForm({ ...form, ends_on: event.target.value })} />
          </label>
        </div>
        <Button
          className="mt-4"
          disabled={!form.name.trim() || !form.starts_on || !form.ends_on || create.isPending}
          onClick={() => create.mutate()}
        >
          Create academic year
        </Button>
      </div>
    </div>
  );
}

/**
 * Working days.
 *
 * ⚠ This screen does NOT gate activation, and says so. The backend's onboarding
 * readiness has five keys and a calendar is not one of them, so claiming this
 * as a required step would be a progress model the server does not share. It
 * writes through the existing calendar-initialize endpoint — the same one the
 * Calendar workspace uses — and is offered here because a school that sets its
 * teaching week now gets a correctly shaped curriculum grid immediately.
 */
function WorkingDaysStep() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);
  const years = useQuery<PrimaryAcademicYear[]>({
    queryKey: ["school-admin", "academic-years"],
    queryFn: backendApi.schoolAdminAcademicYears,
  });
  const year = years.data?.find((item) => item.is_active) ?? years.data?.[0];

  const initialize = useMutation({
    mutationFn: () =>
      backendApi.schoolAdminInitializeCalendar(year!.id, { teaching_weekdays: weekdays }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "calendar-summary"] });
      toast({
        title: "Teaching calendar ready",
        description: `${result.created} dates added${result.kept ? `, ${result.kept} existing changes kept` : ""}.`,
        variant: "success",
      });
    },
    onError: (error) =>
      toast({ title: "Could not set up the calendar", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  if (years.isLoading) return <Skeleton className="h-32" />;
  if (!year) {
    return (
      <p className="text-sm font-semibold text-amber-700">
        Create your academic year first — the calendar describes one year.
      </p>
    );
  }

  const WEEKDAYS = [
    { value: 0, label: "Mon" }, { value: 1, label: "Tue" }, { value: 2, label: "Wed" },
    { value: 3, label: "Thu" }, { value: 4, label: "Fri" }, { value: 5, label: "Sat" },
    { value: 6, label: "Sun" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-800">Which days does {year.name} teach on?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WEEKDAYS.map((weekday) => {
            const on = weekdays.includes(weekday.value);
            return (
              <button
                key={weekday.value}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setWeekdays((current) =>
                    on ? current.filter((value) => value !== weekday.value) : [...current, weekday.value],
                  )
                }
                className={cn(
                  "rounded-xl border px-3.5 py-2 text-sm font-semibold transition",
                  on ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500",
                )}
              >
                {weekday.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
        Every date in {year.name} is filled in from this pattern. Holidays are yours to set —
        TeachPad assumes none — and you can change any single date later in the Calendar.
      </p>

      <Button disabled={!weekdays.length || initialize.isPending} onClick={() => initialize.mutate()}>
        {initialize.isPending ? "Setting up…" : "Set up teaching calendar"}
      </Button>

      <p className="text-xs text-slate-500">
        Optional — you can activate your school without this and set it up later from the Calendar.
      </p>
    </div>
  );
}

function CurriculumStep({ profile, onDone }: { profile?: AcademicProfile; onDone: () => Promise<unknown> }) {
  const { toast } = useToast();
  const choose = useMutation({
    mutationFn: (value: CurriculumStartingPoint) => backendApi.schoolAdminSetCurriculumStartingPoint(value),
    onSuccess: async () => { await onDone(); },
    onError: (error) => toast({ title: "Could not save that choice", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {CURRICULUM_SOURCES.map((option) => {
          const active = profile?.curriculum_starting_point === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={choose.isPending}
              onClick={() => choose.mutate(option.value)}
              className={cn(
                "rounded-2xl border p-4 text-left transition disabled:opacity-60",
                active ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 hover:border-blue-200",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                {option.title}
                {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" /> : null}
              </span>
              <span className="mt-1.5 block text-xs leading-5 text-slate-500">{option.description}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
        Whichever you choose, your edits stay yours. Editing an adopted lesson copies it to your
        school first — TeachPad&rsquo;s curriculum is never changed by a school.
      </p>
    </div>
  );
}

/**
 * Review and activate.
 *
 * ⚠ Every tick is the SERVER's readiness, computed from real rows on each read.
 * The wizard does not decide whether a school is configured, and a screen the
 * admin merely visited is not evidence of anything. Activation itself is
 * `POST /onboarding/complete`, which refuses with the unmet steps named — so
 * the button is offered even when this screen shows gaps, and the refusal is
 * the authoritative answer rather than a guess made here.
 */
function ReviewScreen({
  readiness,
  profile,
  onFix,
}: {
  readiness: Record<string, boolean> | undefined;
  profile?: AcademicProfile;
  onFix: (screenKey: string) => void;
}) {
  const rows = gatingScreens();
  const outstanding = rows.filter((screen) => !readiness?.[screen.readinessKey as string]);

  return (
    <div className="space-y-5">
      <dl className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">School</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{profile?.school_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Framework</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{profile?.framework?.name ?? "Not set"}</dd>
        </div>
      </dl>

      <ul className="divide-y divide-slate-100">
        {rows.map((screen) => {
          const done = readiness?.[screen.readinessKey as string];
          return (
            <li key={screen.key} className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-sm font-bold text-slate-900">{screen.title}</span>
                <span className="block text-xs text-slate-500">{screen.blurb}</span>
              </span>
              {done ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  <Check className="h-3 w-3" /> Done
                </span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onFix(screen.key)}>
                  Finish this
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {outstanding.length ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-900">
          {outstanding.length === 1 ? "One step still needs" : `${outstanding.length} steps still need`} attention.
          Activation will be refused until {outstanding.length === 1 ? "it is" : "they are"} done.
        </p>
      ) : (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-900">
          Everything is configured. Activating opens School Admin and lets you start planning curriculum.
        </p>
      )}
    </div>
  );
}
