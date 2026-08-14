"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2 } from "lucide-react";
import {
  backendApi,
  type AcademicProfile,
  type CurriculumStartingPoint,
  type OnboardingState,
  type SchoolLevel,
  type SchoolProgramme,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

/**
 * Guided school setup.
 *
 * ⚠ Every step writes through the service that already owns that concept. This
 * wizard stores no configuration of its own — it is a path through existing
 * endpoints plus a progress marker. A wizard that kept its own copy of the
 * answers would drift the moment someone changed a setting from Settings.
 *
 * ⚠ Deliberately NOT in the main navigation. It is a one-time path, reachable
 * from the Overview prompt and by URL, and a completed school is redirected out
 * of it rather than being invited to redo setup.
 *
 * ⚠ Progress is resumable and derived. `resume_step` comes from the backend's
 * readiness computation, so a school that set its framework in Settings and
 * never opened this wizard still lands on Programmes rather than step 1.
 */

const STEPS = [
  { n: 1, title: "Framework", blurb: "Which curriculum authority does your school follow?" },
  { n: 2, title: "Programmes", blurb: "Which stages does your school offer?" },
  { n: 3, title: "Levels", blurb: "Which grades or levels do you operate?" },
  { n: 4, title: "Curriculum", blurb: "How would you like to start your curriculum?" },
  { n: 5, title: "Academic year", blurb: "When does your school year run?" },
] as const;

const STARTING_POINTS: { value: CurriculumStartingPoint; title: string; description: string }[] = [
  { value: "teachpad", title: "Use TeachPad Curriculum", description: "Teach the published master curriculum as it is." },
  { value: "customize", title: "Customize TeachPad Curriculum", description: "Adopt it, then edit. Your edits never change TeachPad's copy." },
  { value: "import", title: "Import School Curriculum", description: "Bring your own. TeachPad's master stays hidden." },
  { value: "empty", title: "Start from Scratch", description: "Begin with nothing and author everything." },
];

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

  // The URL wins so a step is linkable and the back button works; the backend's
  // resume point is the default when the URL says nothing.
  const stepParam = Number(params.get("step"));
  const step = stepParam >= 1 && stepParam <= 5 ? stepParam : onboarding.data?.resume_step ?? 1;

  const goto = (next: number) => {
    router.replace(`/school-admin/setup?step=${next}`, { scroll: false });
    if (next > (onboarding.data?.step ?? 0)) {
      void backendApi.schoolAdminAdvanceOnboarding(next).then(() =>
        queryClient.invalidateQueries({ queryKey: ["school-admin", "onboarding"] }),
      );
    }
  };

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["school-admin", "academic-profile"] }),
      queryClient.invalidateQueries({ queryKey: ["school-admin", "onboarding"] }),
      queryClient.invalidateQueries({ queryKey: ["school-admin", "programmes"] }),
      queryClient.invalidateQueries({ queryKey: ["school-admin", "levels"] }),
    ]);

  const finish = useMutation({
    mutationFn: backendApi.schoolAdminCompleteOnboarding,
    onSuccess: async () => {
      await invalidate();
      toast({ title: "School setup complete" });
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
    return <div className="space-y-4"><Skeleton className="h-16" /><Skeleton className="h-[420px]" /></div>;
  }

  const readiness = onboarding.data?.readiness;

  return (
    <div className="mx-auto max-w-[900px]">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">Set up your school</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          {STEPS[step - 1].title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{STEPS[step - 1].blurb}</p>
      </header>

      <ol className="mb-6 flex flex-wrap gap-2" aria-label="Setup progress">
        {STEPS.map((entry) => {
          const key = (["framework", "programmes", "levels", "curriculum", "academic_year"] as const)[entry.n - 1];
          const done = readiness?.[key];
          return (
            <li key={entry.n}>
              <button
                type="button"
                onClick={() => goto(entry.n)}
                aria-current={step === entry.n ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  step === entry.n
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200",
                )}
              >
                <span className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold",
                  done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
                )}>
                  {done ? <Check className="h-3 w-3" /> : entry.n}
                </span>
                {entry.title}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        {step === 1 ? <FrameworkStep profile={profile.data} onDone={invalidate} /> : null}
        {step === 2 ? <ProgrammesStep hasFramework={Boolean(profile.data?.framework)} onDone={invalidate} /> : null}
        {step === 3 ? <LevelsStep onDone={invalidate} /> : null}
        {step === 4 ? <CurriculumStep profile={profile.data} onDone={invalidate} /> : null}
        {step === 5 ? <AcademicYearStep onDone={invalidate} /> : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="outline" disabled={step === 1} onClick={() => goto(step - 1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 5 ? (
          <Button onClick={() => goto(step + 1)}>Continue <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button disabled={finish.isPending} onClick={() => finish.mutate()}>
            {finish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Finish setup
          </Button>
        )}
      </div>
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
    </div>
  );
}

function ProgrammesStep({ hasFramework, onDone }: { hasFramework: boolean; onDone: () => Promise<unknown> }) {
  const { toast } = useToast();
  const enabled = useQuery<SchoolProgramme[]>({
    queryKey: ["school-admin", "programmes", "enabled"],
    queryFn: backendApi.schoolAdminEnabledProgrammes,
  });
  const available = useQuery<SchoolProgramme[]>({
    queryKey: ["school-admin", "programmes", "available"],
    queryFn: backendApi.schoolAdminAvailableProgrammes,
  });
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([enabled.refetch(), available.refetch()]);
    await onDone();
    await queryClient.invalidateQueries({ queryKey: ["school-admin", "programmes"] });
  };
  const toggle = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on ? backendApi.schoolAdminEnableProgramme(id) : backendApi.schoolAdminDisableProgramme(id),
    onSuccess: refresh,
    onError: (error) =>
      toast({ title: "Could not change that programme", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

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
            {!levels.data?.length ? <li className="py-2 text-sm text-slate-500">No levels yet.</li> : null}
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
      </div>
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
    <div className="grid gap-3 sm:grid-cols-2">
      {STARTING_POINTS.map((option) => {
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
              {active ? <CheckCircle2 className="h-4 w-4 text-blue-600" /> : null}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
          </button>
        );
      })}
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
      ) : <p className="text-sm text-slate-500">No academic year yet. Create one to finish setup.</p>}

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
        <p className="mt-3 text-xs text-slate-500">
          Terms, holidays and working days are set per year in the Calendar once setup is done.
        </p>
      </div>
    </div>
  );
}
