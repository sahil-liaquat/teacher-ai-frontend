"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Lock,
  LockKeyhole,
  Plug,
  ShieldCheck,
  Sparkles,
  Type,
} from "lucide-react";
import {
  backendApi,
  type AcademicProfile,
  type CurriculumStartingPoint,
  type PrimaryAcademicYear,
  type SchoolLevel,
  type SchoolProfile,
  type SchoolProgramme,
} from "@/lib/api";
import {
  ACADEMIC_STAGES,
  SETTINGS_AREAS,
  TERMINOLOGY_KEYS,
  activeStage,
  reachableStages,
  settingsArea,
  type SettingsArea,
} from "@/lib/school-admin-settings";
import { SCHOOL_LEVELS_QUERY_KEY } from "@/lib/use-school-levels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PageError, PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { SectionSubnav } from "@/components/school-admin/shared/section-subnav";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

/**
 * Settings — configure once, change rarely.
 *
 * ⚠ TWO LEVELS, NOT A PERMANENT SEVEN-ITEM SIDEBAR. The index reports what each
 * area is actually set to; opening one shows that area and nothing else. The
 * previous design listed all seven at all times with no indication of what was
 * inside any of them, so discovering that three had no controls cost three
 * navigations.
 *
 * ⚠ The index states availability BEFORE the click. An area with nothing behind
 * it says so on the card rather than after a navigation.
 *
 * ⚠ Deep links are unchanged: `?section=<key>` still opens an area, so the
 * existing links from the levels card and from setup keep working.
 */
const AREA_ICONS: Record<string, typeof Building2> = {
  profile: Building2,
  academic: GraduationCap,
  calendar: CalendarDays,
  curriculum: Sparkles,
  terminology: Type,
  roles: ShieldCheck,
  integrations: Plug,
};

export function SettingsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const area = settingsArea(params.get("section"));
  const open = (key: string | null) =>
    router.replace(key ? `${pathname}?section=${key}` : pathname, { scroll: false });

  const profile = useQuery<AcademicProfile>({
    queryKey: ["school-admin", "academic-profile"],
    queryFn: backendApi.schoolAdminAcademicProfile,
  });

  if (profile.isError) {
    return (
      <SchoolAdminPage>
        <SectionSubnav />
        <PageHeading eyebrow="School controls" title="Settings" />
        <PageError description="School settings could not be loaded." onRetry={() => void profile.refetch()} />
      </SchoolAdminPage>
    );
  }

  if (!area) return <SettingsIndex profile={profile.data} loading={profile.isLoading} onOpen={open} />;

  return (
    <SchoolAdminPage>
      <SectionSubnav />
      <button
        type="button"
        onClick={() => open(null)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" /> All settings
      </button>
      <PageHeading eyebrow="Settings" title={area.title} description={area.purpose} />

      {area.key === "profile" ? <SchoolProfileArea /> : null}
      {area.key === "academic" ? <AcademicArea profile={profile.data} /> : null}
      {area.key === "calendar" ? <CalendarArea /> : null}
      {area.key === "curriculum" ? <CurriculumSourceArea profile={profile.data} /> : null}
      {area.key === "terminology" ? <TerminologyArea profile={profile.data} /> : null}
      {area.key === "roles" ? <RolesArea /> : null}
      {area.key === "integrations" ? <IntegrationsArea /> : null}
    </SchoolAdminPage>
  );
}

// ── Level 1: the map ────────────────────────────────────────────────────────

function SettingsIndex({
  profile,
  loading,
  onOpen,
}: {
  profile?: AcademicProfile;
  loading: boolean;
  onOpen: (key: string) => void;
}) {
  const school = useQuery<SchoolProfile>({
    queryKey: ["school-admin", "school-profile"],
    queryFn: backendApi.schoolAdminSchoolProfile,
  });
  const levels = useQuery<SchoolLevel[]>({
    queryKey: ["school-admin", "levels"],
    queryFn: () => backendApi.schoolAdminLevels(),
  });
  const years = useQuery<PrimaryAcademicYear[]>({
    queryKey: ["school-admin", "academic-years"],
    queryFn: backendApi.schoolAdminAcademicYears,
  });

  /**
   * What each area is currently set to.
   *
   * ⚠ Real values, never a generic "Configured". The whole reason the index
   * exists is so an admin can decide what to open without opening it, and
   * "Configured" tells them nothing they can act on.
   */
  function summary(area: SettingsArea): string {
    switch (area.key) {
      case "profile": {
        const city = school.data?.city;
        return school.data ? [school.data.name, city].filter(Boolean).join(" · ") : "—";
      }
      case "academic": {
        const framework = profile?.framework?.name;
        if (!framework) return "No framework chosen yet";
        const count = levels.data?.length ?? 0;
        return `${framework} · ${profile?.programmes?.length ?? 0} programmes · ${count} levels`;
      }
      case "calendar": {
        const current = years.data?.find((year) => year.is_active);
        if (current) return `${current.name} is current`;
        return years.data?.length ? "No year set as current" : "No academic year yet";
      }
      case "curriculum": {
        const point = profile?.curriculum_starting_point;
        return point === "teachpad" ? "TeachPad curriculum"
          : point === "customize" ? "TeachPad curriculum, adapted"
          : point === "empty" ? "Built by your school"
          : point === "import" ? "Imported curriculum"
          : "—";
      }
      case "terminology": {
        const custom = Object.values(profile?.terminology ?? {}).filter(Boolean).length;
        return custom ? `${custom} term${custom === 1 ? "" : "s"} renamed` : "TeachPad's default words";
      }
      case "roles":
        return "School admin and Teacher";
      default:
        return "None available yet";
    }
  }

  /** True when the area has a decision still outstanding. */
  function needsAttention(area: SettingsArea): boolean {
    if (area.key === "academic") return !profile?.framework || !(levels.data?.length ?? 0);
    if (area.key === "calendar") return !years.data?.some((year) => year.is_active);
    return false;
  }

  return (
    <SchoolAdminPage>
      <SectionSubnav />
      <PageHeading
        eyebrow="School controls"
        title="Settings"
        description="How this school is set up. Day-to-day work lives in the main navigation."
      />

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        {SETTINGS_AREAS.map((area) => {
          const Icon = AREA_ICONS[area.key] ?? Building2;
          const available = area.availability === "configurable";
          const attention = needsAttention(area);
          const body = (
            <>
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  available ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-950">{area.title}</span>
                  {/* Availability, stated before the click. */}
                  {area.availability === "read_only" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <Lock className="h-2.5 w-2.5" /> View only
                    </span>
                  ) : null}
                  {area.availability === "unavailable" ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Not available yet
                    </span>
                  ) : null}
                  {attention ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                      Needs attention
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-500">{area.purpose}</span>
                {loading || school.isLoading ? (
                  <Skeleton className="mt-1.5 h-4 w-40 rounded" />
                ) : (
                  <span className="mt-1 block truncate text-xs font-semibold text-slate-700">
                    {summary(area)}
                  </span>
                )}
              </span>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
            </>
          );

          // An area with nothing behind it is not a link. Making it one would
          // put a dead end behind a click, which is what this replaces.
          return (
            <li key={area.key}>
              {area.availability === "unavailable" ? (
                <div className="flex items-start gap-3.5 px-5 py-4 opacity-60">{body}</div>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpen(area.key)}
                  className="flex w-full items-start gap-3.5 px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </SchoolAdminPage>
  );
}

// ── Level 2: one area at a time ─────────────────────────────────────────────

function AreaCard({ children, description }: { children: React.ReactNode; description?: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      {description ? <p className="mb-5 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
      {children}
    </section>
  );
}

/**
 * School profile.
 *
 * ⚠ Genuinely editable now. This was a `NotConfigurableYet` panel pointing at
 * TeachPad support, because no org-admin endpoint existed. One does now, over
 * the school-owned subset of the organization record — plan, subscription
 * status, entitlement and school code are deliberately not reachable.
 */
function SchoolProfileArea() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<SchoolProfile> | null>(null);

  const profile = useQuery<SchoolProfile>({
    queryKey: ["school-admin", "school-profile"],
    queryFn: backendApi.schoolAdminSchoolProfile,
  });
  const save = useMutation({
    mutationFn: (changes: Partial<SchoolProfile>) => backendApi.schoolAdminUpdateSchoolProfile(changes),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "school-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "academic-profile"] });
      setDraft(null);
      toast({ title: "School profile updated" });
    },
    onError: (error) =>
      toast({
        title: "Could not save your school profile",
        description: getErrorMessage(error, "Check the details and try again."),
        variant: "error",
      }),
  });

  if (profile.isLoading) return <AreaCard><Skeleton className="h-64" /></AreaCard>;

  const value = { ...(profile.data ?? {}), ...(draft ?? {}) } as SchoolProfile;
  const dirty = draft !== null;
  const fields: { key: keyof SchoolProfile; label: string; type?: string }[] = [
    { key: "name", label: "School name" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
    { key: "primary_contact", label: "Main contact" },
    { key: "contact_email", label: "Contact email", type: "email" },
    { key: "contact_phone", label: "Contact phone", type: "tel" },
  ];

  return (
    <AreaCard description="What TeachPad calls your school, and who to contact about it.">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="block text-sm font-semibold text-slate-800">
            {field.label}
            <Input
              type={field.type}
              className="mt-2"
              value={(value[field.key] as string) ?? ""}
              onChange={(event) => setDraft({ ...(draft ?? {}), [field.key]: event.target.value })}
            />
          </label>
        ))}
      </div>

      {profile.data?.school_code ? (
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>
            Your school code is <strong className="font-semibold text-slate-900">{profile.data.school_code}</strong>.
            It identifies your school across TeachPad and cannot be changed here. Your plan and
            subscription are managed by TeachPad and are not editable from Settings.
          </span>
        </p>
      ) : null}

      <div className="mt-5 flex gap-2">
        <Button
          disabled={!dirty || save.isPending || !value.name?.trim()}
          onClick={() => save.mutate(draft ?? {})}
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
        {dirty ? (
          <Button variant="outline" disabled={save.isPending} onClick={() => setDraft(null)}>
            Discard
          </Button>
        ) : null}
      </div>
    </AreaCard>
  );
}

/**
 * Academic setup, disclosed one stage at a time.
 *
 * ⚠ The gating is REAL. The server refuses programmes without a framework and
 * levels without an enabled programme, so showing all three at once would offer
 * forms the API will reject. One stage open, the next unlocked by satisfying it.
 */
function AcademicArea({ profile }: { profile?: AcademicProfile }) {
  const enabled = useQuery<SchoolProgramme[]>({
    queryKey: ["school-admin", "programmes", "enabled"],
    queryFn: backendApi.schoolAdminEnabledProgrammes,
    enabled: Boolean(profile?.framework),
  });
  const levels = useQuery<SchoolLevel[]>({
    queryKey: ["school-admin", "levels"],
    queryFn: () => backendApi.schoolAdminLevels(),
  });

  const state = {
    hasFramework: Boolean(profile?.framework),
    hasProgramme: Boolean(enabled.data?.length),
    hasLevel: Boolean(levels.data?.length),
  };
  const reachable = reachableStages(state);
  const [openStage, setOpenStage] = useState<string | null>(null);
  const current = openStage ?? activeStage(state);

  return (
    <div className="space-y-3">
      {ACADEMIC_STAGES.map((stage, index) => {
        const unlocked = reachable[stage.key];
        const isOpen = current === stage.key;
        const done =
          stage.key === "framework" ? state.hasFramework
          : stage.key === "programmes" ? state.hasProgramme
          : state.hasLevel;

        return (
          <section
            key={stage.key}
            className={cn(
              "overflow-hidden rounded-3xl border bg-white",
              isOpen ? "border-blue-300" : "border-slate-200",
            )}
          >
            <button
              type="button"
              disabled={!unlocked}
              aria-expanded={isOpen}
              onClick={() => setOpenStage(isOpen ? null : stage.key)}
              className="flex w-full items-center gap-3 p-5 text-left disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-950">{stage.title}</span>
                {!unlocked ? (
                  <span className="mt-0.5 block text-xs text-amber-700">{stage.blockedReason}</span>
                ) : null}
              </span>
              <ChevronRight
                className={cn("h-4 w-4 shrink-0 text-slate-400 transition", isOpen && "rotate-90")}
                aria-hidden="true"
              />
            </button>
            {isOpen && unlocked ? (
              <div className="border-t border-slate-100 p-5">
                {stage.key === "framework" ? <FrameworkStage profile={profile} /> : null}
                {stage.key === "programmes" ? <ProgrammesStage /> : null}
                {stage.key === "levels" ? <LevelsStage /> : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function FrameworkStage({ profile }: { profile?: AcademicProfile }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const frameworks = useQuery({
    queryKey: ["school-admin", "frameworks"],
    queryFn: backendApi.schoolAdminFrameworks,
  });
  const choose = useMutation({
    mutationFn: (id: string) => backendApi.schoolAdminSetFramework(id),
    onSuccess: async (framework) => {
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "academic-profile"] });
      toast({ title: `Framework set to ${framework.name}` });
    },
    onError: (error) =>
      toast({ title: "Could not set that framework", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  if (frameworks.isLoading) return <Skeleton className="h-32" />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

/** ⚠ Disable, never delete — the backend refuses deletion outright. */
function ProgrammesStage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const enabled = useQuery<SchoolProgramme[]>({
    queryKey: ["school-admin", "programmes", "enabled"],
    queryFn: backendApi.schoolAdminEnabledProgrammes,
  });
  const available = useQuery<SchoolProgramme[]>({
    queryKey: ["school-admin", "programmes", "available"],
    queryFn: backendApi.schoolAdminAvailableProgrammes,
  });
  const toggle = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on ? backendApi.schoolAdminEnableProgramme(id) : backendApi.schoolAdminDisableProgramme(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "programmes"] });
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "academic-profile"] });
    },
    onError: (error) =>
      toast({ title: "Could not change that programme", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  if (enabled.isLoading || available.isLoading) return <Skeleton className="h-24" />;
  const rows = [...(enabled.data ?? []), ...(available.data ?? [])];

  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((row) => {
        const on = row.status === "enabled";
        return (
          <li key={row.programme_id} className="flex items-center justify-between gap-4 py-3">
            <span>
              <span className="block text-sm font-bold text-slate-900">{row.name}</span>
              {on && row.in_use ? (
                <span className="block text-xs font-semibold text-amber-700">
                  Levels reference this — disabling keeps them, but stops new ones
                </span>
              ) : null}
            </span>
            <Button variant={on ? "outline" : "default"} disabled={toggle.isPending} onClick={() => toggle.mutate({ id: row.programme_id, on: !on })}>
              {on ? "Offered" : "Offer this"}
            </Button>
          </li>
        );
      })}
      {!rows.length ? <li className="py-3 text-sm text-slate-500">This framework has no programmes yet.</li> : null}
    </ul>
  );
}

/**
 * ⚠ Shows only the school's OWN levels. TeachPad's shared catalogue rows are
 * read-only to a school — the backend 403s on an attempt to edit one.
 */
function LevelsStage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const levels = useQuery<SchoolLevel[]>({
    queryKey: ["school-admin", "levels"],
    queryFn: () => backendApi.schoolAdminLevels(),
  });
  const programmes = useQuery<SchoolProgramme[]>({
    queryKey: ["school-admin", "programmes", "enabled"],
    queryFn: backendApi.schoolAdminEnabledProgrammes,
  });
  const catalogue = useQuery<SchoolLevel[]>({
    queryKey: ["school-admin", "levels", "catalogue"],
    queryFn: backendApi.schoolAdminLevelCatalogue,
  });

  // Every level surface in the product selects from the canonical list, so a
  // change here has to invalidate it or Curriculum keeps the old set.
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["school-admin", "levels"] });
    await queryClient.invalidateQueries({ queryKey: SCHOOL_LEVELS_QUERY_KEY });
  };
  const onError = (error: unknown) =>
    toast({ title: "Could not update that level", description: getErrorMessage(error, "Try again."), variant: "error" });

  const create = useMutation({
    mutationFn: () =>
      backendApi.schoolAdminCreateLevel({
        name,
        programme_id: programmes.data?.[0]?.programme_id ?? null,
        sort_order: (levels.data?.length ?? 0) * 10,
      }),
    onSuccess: async () => { setName(""); await refresh(); },
    onError,
  });
  const adopt = useMutation({
    mutationFn: (code: string) =>
      backendApi.schoolAdminAdoptLevel(code, programmes.data?.[0]?.programme_id ?? ""),
    onSuccess: refresh,
    onError,
  });
  const archive = useMutation({
    mutationFn: (id: string) => backendApi.schoolAdminArchiveLevel(id),
    onSuccess: refresh,
    onError,
  });

  if (levels.isLoading) return <Skeleton className="h-32" />;
  const existing = new Set((levels.data ?? []).map((level) => level.code));

  return (
    <div className="space-y-5">
      {levels.data?.length ? (
        <ul className="divide-y divide-slate-100">
          {levels.data.map((level) => (
            <li key={level.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm font-semibold text-slate-800">{level.name}</span>
              <Button variant="outline" disabled={archive.isPending} onClick={() => archive.mutate(level.id)}>
                Archive
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">
          No levels yet. Adopt TeachPad&rsquo;s below, or add your own.
        </p>
      )}

      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-[200px] flex-1 bg-white"
            placeholder="e.g. Grade 6"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>Add level</Button>
        </div>
        {catalogue.data?.length ? (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Or adopt TeachPad&rsquo;s
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {catalogue.data.filter((level) => !existing.has(level.code)).map((level) => (
                <button
                  key={level.code}
                  type="button"
                  disabled={adopt.isPending || !programmes.data?.length}
                  onClick={() => adopt.mutate(level.code)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 disabled:opacity-50"
                >
                  + {level.name}
                </button>
              ))}
            </div>
          </>
        ) : null}
        {/* ⚠ A real constraint, stated where the decision is made. */}
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Levels you create yourself can hold classes, sections and teachers. Curriculum authoring
          currently supports TeachPad&rsquo;s own levels only.
        </p>
      </div>
    </div>
  );
}

function CalendarArea() {
  const years = useQuery<PrimaryAcademicYear[]>({
    queryKey: ["school-admin", "academic-years"],
    queryFn: backendApi.schoolAdminAcademicYears,
  });
  const current = years.data?.find((year) => year.is_active);
  const hasYears = Boolean(years.data?.length);

  return (
    <AreaCard>
      {years.isLoading ? (
        <Skeleton className="h-10" />
      ) : (
        <p className="text-sm leading-6 text-slate-600">
          {current ? (
            <><strong className="font-semibold text-slate-900">{current.name}</strong> is the default context used by school admin and every teacher-facing curriculum surface.</>
          ) : hasYears ? (
            <>No academic year is set as current, so curriculum readiness reads zero everywhere. Choose <strong className="font-semibold text-slate-900">Make current</strong> on the year you are planning.</>
          ) : (
            "No academic year exists yet. Create one to give drafts and published curriculum a school context."
          )}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/school-admin/academic-years" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700">
          {hasYears && !current ? "Choose a current year" : "Manage academic years"} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/school-admin/calendar" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700">
          Terms &amp; teaching days <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Term boundaries, teaching days and closures are set per academic year rather than once for
        the school, because they change every year.
      </p>
    </AreaCard>
  );
}

const STARTING_POINTS: { value: CurriculumStartingPoint; title: string; description: string }[] = [
  { value: "teachpad", title: "Use TeachPad curriculum", description: "Teach TeachPad's published curriculum as it is." },
  { value: "customize", title: "Adapt TeachPad curriculum", description: "Adopt it, then edit. Your edits never change TeachPad's copy." },
  { value: "empty", title: "Build your own", description: "Begin with nothing and author everything yourself." },
];

function CurriculumSourceArea({ profile }: { profile?: AcademicProfile }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const choose = useMutation({
    mutationFn: (value: CurriculumStartingPoint) => backendApi.schoolAdminSetCurriculumStartingPoint(value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "academic-profile"] });
      toast({ title: "Curriculum starting point updated" });
    },
    onError: (error) =>
      toast({ title: "Could not save that starting point", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });
  // ⚠ `import` is a valid stored value but is not offered — no import pipeline
  // exists. A school already carrying it sees it acknowledged below.
  const imported = profile?.curriculum_starting_point === "import";

  return (
    <AreaCard description="Where this school's curriculum starts from. Changing it never deletes your own authored content — it changes whether TeachPad's curriculum is visible alongside it.">
      <div className="grid gap-3 sm:grid-cols-3">
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
                {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" /> : null}
              </span>
              <span className="mt-1.5 block text-xs leading-5 text-slate-500">{option.description}</span>
            </button>
          );
        })}
      </div>
      {imported ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          This school is set to <strong>Import school curriculum</strong>, chosen before importing was
          withdrawn. Curriculum import is not built yet; choose one of the options above when you are
          ready, or leave this as it is.
        </p>
      ) : null}
      <p className="mt-5 flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        Your customisations are yours. Editing an adopted lesson copies it to your school first —
        TeachPad&rsquo;s curriculum is never changed by a school.
      </p>
    </AreaCard>
  );
}

/**
 * Terminology.
 *
 * ⚠ THIS NOW ACTUALLY WORKS. It was write-only: the values were saved and no
 * surface read them. `useCurriculumVocabulary` consumes them, so the words set
 * here appear across Curriculum. Local draft state is deliberate — a mutation
 * per keystroke would hammer the API and race its own responses.
 */
function TerminologyArea({ profile }: { profile?: AcademicProfile }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const value = draft ?? profile?.terminology ?? {};

  const save = useMutation({
    mutationFn: (next: Record<string, string>) => backendApi.schoolAdminSetTerminology(next),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "academic-profile"] });
      setDraft(null);
      toast({ title: "Your words are now used across Curriculum" });
    },
    onError: (error) =>
      toast({ title: "Could not save that wording", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  return (
    <AreaCard description="TeachPad uses your words. A Cambridge school says Year, a CBSE school says Class — the same underlying record, named the way your staff already speak.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TERMINOLOGY_KEYS.map((entry) => (
          <label key={entry.key} className="block text-sm font-semibold text-slate-700">
            <span className="capitalize">{entry.key}</span>
            <Input
              className="mt-2"
              placeholder={entry.hint}
              value={value[entry.key] ?? ""}
              onChange={(event) => setDraft({ ...value, [entry.key]: event.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Button disabled={save.isPending || draft === null} onClick={() => save.mutate(value)}>
          {save.isPending ? "Saving…" : "Save wording"}
        </Button>
        {draft !== null ? (
          <Button variant="outline" disabled={save.isPending} onClick={() => setDraft(null)}>Discard</Button>
        ) : null}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Clear a field to fall back to your framework&rsquo;s wording. These words appear in Curriculum
        headings, level pickers and empty states.
      </p>
    </AreaCard>
  );
}

function RolesArea() {
  return (
    <AreaCard description="Roles are fixed in this release. Teacher membership is managed from People, where the invitation and assignment flows live.">
      <ul className="divide-y divide-slate-100">
        {[
          { role: "School Admin", note: "Full access to this school's curriculum, calendar, classes and staff.", live: true },
          { role: "Teacher", note: "Teaches assigned sections and subjects; cannot administer the school.", live: true },
          { role: "Academic Coordinator", note: "A curriculum-only administrator, between teacher and school admin.", live: false },
        ].map(({ role, note, live }) => (
          <li key={role} className="flex items-center justify-between gap-4 py-3">
            <span>
              <span className="block text-sm font-bold text-slate-900">{role}</span>
              <span className="block text-xs text-slate-500">{note}</span>
            </span>
            <span className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
              live ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
            )}>
              {live ? "Active" : "Planned"}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/school-admin/teachers" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700">
        Manage teachers <ArrowRight className="h-4 w-4" />
      </Link>
    </AreaCard>
  );
}

function IntegrationsArea() {
  return (
    <AreaCard>
      <p className="text-sm leading-6 text-slate-600">
        No integrations are available yet. This area exists so the architecture is visible, not
        because a feature is hidden behind it.
      </p>
    </AreaCard>
  );
}
