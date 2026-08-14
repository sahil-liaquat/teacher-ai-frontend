"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  LockKeyhole,
  Plug,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  backendApi,
  type AcademicProfile,
  type CurriculumStartingPoint,
  type PrimaryAcademicYear,
  type SchoolLevel,
  type SchoolProgramme,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PageError, PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

/**
 * Settings — how this school works, as opposed to the work it does.
 *
 * ⚠ The rule that decides what belongs here: **configure once, change rarely.**
 * Anything a school admin touches weekly belongs in the main navigation. That
 * is why Curriculum, Calendar and Teachers are NOT here, and why the framework,
 * the vocabulary and the curriculum starting point ARE.
 *
 * ⚠ Progressive disclosure is the point, not decoration. The full academic
 * architecture is seven sections deep; showing all of it at once is how a
 * school administrator decides TeachPad is an ERP. One section at a time, in
 * the URL so it is linkable, with the section list acting as the map.
 *
 * ⚠ Sections that cannot yet be configured say so plainly. A settings screen
 * that renders a disabled control the product does not honour is worse than
 * one that admits the gap.
 */

const SECTIONS = [
  { key: "profile", label: "School Profile", icon: Building2 },
  { key: "academic", label: "Academic Setup", icon: GraduationCap },
  { key: "calendar", label: "Academic Calendar", icon: CalendarDays },
  { key: "curriculum", label: "Curriculum Setup", icon: Sparkles },
  { key: "assessment", label: "Assessment Setup", icon: ClipboardCheck },
  { key: "roles", label: "Roles & Permissions", icon: ShieldCheck },
  { key: "integrations", label: "Integrations", icon: Plug },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

const STARTING_POINTS: { value: CurriculumStartingPoint; title: string; description: string }[] = [
  { value: "teachpad", title: "Use TeachPad Curriculum", description: "Teach TeachPad's published master curriculum as it is." },
  { value: "customize", title: "Customize TeachPad Curriculum", description: "Adopt the master, then edit. Your edits never change TeachPad's copy." },
  { value: "import", title: "Import School Curriculum", description: "Bring your own curriculum. TeachPad's master stays hidden." },
  { value: "empty", title: "Start from Scratch", description: "Begin with nothing and author everything yourself." },
];

function SettingsCard({ title, description, icon: Icon, tone = "slate", children }: {
  title: string; description?: string; icon: typeof Building2;
  tone?: "slate" | "blue" | "amber"; children?: React.ReactNode;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  } as const;
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <span className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tone])}><Icon className="h-5 w-5" /></span>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
      {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      {children}
    </section>
  );
}

/** Says a section is real architecture without a configuration surface yet. */
function NotConfigurableYet({ what, where }: { what: string; where: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="text-sm font-bold text-amber-900">Not configurable here yet</p>
      <p className="mt-1 text-sm leading-6 text-amber-900/80">{what}</p>
      <p className="mt-2 text-xs font-semibold text-amber-900/70">{where}</p>
    </div>
  );
}

export function SettingsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const section = (params.get("section") as SectionKey) || "academic";
  const setSection = (next: SectionKey) => router.replace(`${pathname}?section=${next}`, { scroll: false });

  const profile = useQuery<AcademicProfile>({
    queryKey: ["school-admin", "academic-profile"],
    queryFn: backendApi.schoolAdminAcademicProfile,
  });
  const frameworks = useQuery({
    queryKey: ["school-admin", "frameworks"],
    queryFn: backendApi.schoolAdminFrameworks,
    // Only fetched where it is actually rendered — the catalogue is not needed
    // to draw the other six sections.
    enabled: section === "academic",
  });
  const years = useQuery<PrimaryAcademicYear[]>({
    queryKey: ["school-admin", "academic-years"],
    queryFn: backendApi.schoolAdminAcademicYears,
    enabled: section === "calendar",
  });

  const invalidateProfile = () =>
    queryClient.invalidateQueries({ queryKey: ["school-admin", "academic-profile"] });

  const setFramework = useMutation({
    mutationFn: (id: string) => backendApi.schoolAdminSetFramework(id),
    onSuccess: async (framework) => {
      await invalidateProfile();
      toast({ title: `Framework set to ${framework.name}` });
    },
    onError: (error) => toast({ title: "Could not set that framework", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  const setStartingPoint = useMutation({
    mutationFn: (value: CurriculumStartingPoint) => backendApi.schoolAdminSetCurriculumStartingPoint(value),
    onSuccess: async () => {
      await invalidateProfile();
      toast({ title: "Curriculum starting point updated" });
    },
    onError: (error) => toast({ title: "Could not save that starting point", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  const setTerminology = useMutation({
    mutationFn: (next: Record<string, string>) => backendApi.schoolAdminSetTerminology(next),
    onSuccess: async () => {
      await invalidateProfile();
      toast({ title: "Terminology updated" });
    },
    onError: (error) => toast({ title: "Could not save that wording", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  if (profile.isError) {
    return (
      <SchoolAdminPage>
        <PageHeading eyebrow="School controls" title="Settings" />
        <PageError description="School settings could not be loaded." onRetry={() => void profile.refetch()} />
      </SchoolAdminPage>
    );
  }

  const currentYear = years.data?.find((year) => year.is_active);
  // "no years at all" and "years exist but none is current" need different
  // wording: the second is fixable in one click, and it is why every
  // readiness figure on the other screens reads zero.
  const hasYears = Boolean(years.data?.length);

  return (
    <SchoolAdminPage>
      <PageHeading
        eyebrow="School controls"
        title="Settings"
        description="How this school is set up. Day-to-day work lives in the main navigation."
      />

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 lg:flex-col lg:overflow-visible">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              aria-current={section === key ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                section === key ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          {section === "profile" ? (
            <SettingsCard
              icon={Building2}
              tone="blue"
              title="School profile"
              description={profile.data ? `Signed in to ${profile.data.school_name}.` : undefined}
            >
              <NotConfigurableYet
                what="Name, logo, address and contact details are held on the school record and are currently edited by TeachPad support when a school is onboarded."
                where="Platform admin → Schools"
              />
            </SettingsCard>
          ) : null}

          {section === "academic" ? (
            <>
              <SettingsCard
                icon={GraduationCap}
                tone="blue"
                title="Framework"
                description="The board or curriculum authority this school follows. It decides which programmes are available and the default vocabulary — it does not decide what you teach."
              >
                {profile.isLoading || frameworks.isLoading ? (
                  <Skeleton className="mt-5 h-24" />
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {(frameworks.data ?? []).map((framework) => {
                      const active = profile.data?.framework?.id === framework.id;
                      return (
                        <button
                          key={framework.id}
                          type="button"
                          disabled={setFramework.isPending}
                          onClick={() => setFramework.mutate(framework.id)}
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
                )}
                {profile.data && !profile.data.framework ? (
                  <p className="mt-4 text-sm font-semibold text-amber-700">
                    No framework is set yet, so no programmes are available. Choose one to continue.
                  </p>
                ) : null}
              </SettingsCard>

              <ProgrammesCard hasFramework={Boolean(profile.data?.framework)} />
              <LevelsCard />

              <TerminologyCard
                terminology={profile.data?.terminology}
                loading={profile.isLoading}
                saving={setTerminology.isPending}
                onSave={(next) => setTerminology.mutate(next)}
              />
            </>
          ) : null}

          {section === "calendar" ? (
            <>
              <SettingsCard
                icon={CalendarDays}
                tone="blue"
                title="Current academic year"
                description="The default context for school admin and every teacher-facing curriculum surface."
              >
                {years.isLoading ? (
                  <Skeleton className="mt-5 h-10" />
                ) : (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {currentYear ? (
                      <><strong className="font-semibold text-slate-900">{currentYear.name}</strong> is the default context used by school admin and teacher-facing curriculum.</>
                    ) : hasYears ? (
                      <>No academic year is set as current, so curriculum readiness reads zero everywhere. Open academic years and choose <strong className="font-semibold text-slate-900">Make current</strong> on the year you are planning.</>
                    ) : (
                      "No academic year exists yet. Create one to give drafts and published curriculum a school context."
                    )}
                  </p>
                )}
                <Link href="/school-admin/academic-years" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700">
                  {hasYears && !currentYear ? "Choose a current year" : "Manage academic years"} <ArrowRight className="h-4 w-4" />
                </Link>
              </SettingsCard>
              <SettingsCard
                icon={CalendarDays}
                title="Terms, working week and holidays"
                description="Term boundaries, teaching days, closures and exceptions are set per academic year rather than once for the school, because they change every year."
              >
                <Link href="/school-admin/calendar" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700">
                  Open the calendar <ArrowRight className="h-4 w-4" />
                </Link>
              </SettingsCard>
            </>
          ) : null}

          {section === "curriculum" ? (
            <SettingsCard
              icon={Sparkles}
              tone="blue"
              title="Curriculum starting point"
              description="Where this school's curriculum comes from. Changing it never deletes your own authored content — it changes whether TeachPad's master curriculum is visible alongside it."
            >
              {profile.isLoading ? (
                <Skeleton className="mt-5 h-28" />
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {STARTING_POINTS.map((option) => {
                    const active = profile.data?.curriculum_starting_point === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={setStartingPoint.isPending}
                        onClick={() => setStartingPoint.mutate(option.value)}
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
              )}
              <div className="mt-5 flex items-start gap-2 rounded-2xl bg-emerald-50 p-4">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <p className="text-sm leading-6 text-emerald-900">
                  Your customizations are yours. Editing an adopted lesson copies it to your school first —
                  TeachPad's master curriculum is never changed by a school.
                </p>
              </div>
            </SettingsCard>
          ) : null}

          {section === "assessment" ? (
            <SettingsCard
              icon={ClipboardCheck}
              tone="amber"
              title="Assessment setup"
              description="Grading systems, assessment types, rubric defaults and reporting rules."
            >
              <NotConfigurableYet
                what="The assessment domain boundary exists but records no data yet, so there is nothing here to configure. Configuring a grading system before anything can be graded would be a setting that does nothing."
                where="See School Admin → Assessments for what is being built"
              />
            </SettingsCard>
          ) : null}

          {section === "roles" ? (
            <SettingsCard
              icon={ShieldCheck}
              title="Roles & permissions"
              description="Who can do what inside this school."
            >
              <ul className="mt-5 divide-y divide-slate-100">
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
                      "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                      live ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                    )}>
                      {live ? "Active" : "Planned"}
                    </span>
                  </li>
                ))}
              </ul>
              <NotConfigurableYet
                what="Roles are fixed in this release. Teacher membership is managed from the Teachers page, which is where the invitation and assignment flows already live."
                where="School Admin → Teachers"
              />
            </SettingsCard>
          ) : null}

          {section === "integrations" ? (
            <SettingsCard icon={Plug} title="Integrations" description="Connections to systems outside TeachPad.">
              <NotConfigurableYet
                what="No integrations are available yet."
                where="This section is a placeholder for the architecture, not a hidden feature"
              />
            </SettingsCard>
          ) : null}
        </div>
      </div>
    </SchoolAdminPage>
  );
}

/**
 * Terminology editor.
 *
 * Local draft state on purpose: a school renaming "Level" to "Year" types
 * several characters, and firing a mutation per keystroke would both hammer the
 * API and race its own responses. Saved explicitly.
 */
function TerminologyCard({ terminology, loading, saving, onSave }: {
  terminology?: Record<string, string>;
  loading: boolean;
  saving: boolean;
  onSave: (next: Record<string, string>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const value = draft ?? terminology ?? {};
  const keys = ["level", "section", "subject", "lesson", "programme", "term"];

  return (
    <SettingsCard
      icon={Sparkles}
      title="What this school calls things"
      description="TeachPad uses your words. A Cambridge school says Year, a CBSE school says Class — same underlying record."
    >
      {loading ? (
        <Skeleton className="mt-5 h-28" />
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {keys.map((key) => (
              <label key={key} className="block text-sm font-semibold text-slate-700">
                <span className="capitalize">{key}</span>
                <Input
                  className="mt-2"
                  value={value[key] ?? ""}
                  onChange={(event) => setDraft({ ...value, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Button disabled={saving || draft === null} onClick={() => { onSave(value); setDraft(null); }}>
              {saving ? "Saving…" : "Save wording"}
            </Button>
            {draft !== null ? (
              <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>Discard</Button>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Clear a field to fall back to your framework&rsquo;s wording.
          </p>
        </>
      )}
    </SettingsCard>
  );
}

/**
 * Programme enablement, in Settings because a school changes it rarely.
 *
 * ⚠ Disable, never delete. The backend refuses deletion outright; this surface
 * warns when levels still reference a programme so the admin knows what the
 * disable will leave behind rather than discovering it later.
 */
function ProgrammesCard({ hasFramework }: { hasFramework: boolean }) {
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
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "programmes"] });
      await queryClient.invalidateQueries({ queryKey: ["school-admin", "academic-profile"] });
    },
    onError: (error) =>
      toast({ title: "Could not change that programme", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  const rows = [...(enabled.data ?? []), ...(available.data ?? [])];
  return (
    <SettingsCard
      icon={GraduationCap}
      title="Programmes"
      description="The stages this school offers. A school can run several at once."
    >
      {!hasFramework ? (
        <p className="mt-5 text-sm text-slate-500">Choose a framework above and its programmes appear here.</p>
      ) : enabled.isLoading || available.isLoading ? (
        <Skeleton className="mt-5 h-24" />
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
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
      )}
    </SettingsCard>
  );
}

/**
 * Level configuration.
 *
 * ⚠ Shows only the school's OWN levels. TeachPad's shared catalogue rows are
 * read-only to a school — the backend 403s on an attempt to edit one — so
 * listing them here as editable would be a lie the API then refuses.
 */
function LevelsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const levels = useQuery<SchoolLevel[]>({
    queryKey: ["school-admin", "levels"],
    queryFn: () => backendApi.schoolAdminLevels(),
  });
  const programmes = useQuery<SchoolProgramme[]>({
    queryKey: ["school-admin", "programmes", "enabled"],
    queryFn: backendApi.schoolAdminEnabledProgrammes,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["school-admin", "levels"] });
  const onError = (error: unknown) =>
    toast({ title: "Could not update that level", description: getErrorMessage(error, "Try again."), variant: "error" });

  const refile = useMutation({
    mutationFn: ({ id, programmeId }: { id: string; programmeId: string }) =>
      backendApi.schoolAdminUpdateLevel(id, programmeId
        ? { programme_id: programmeId }
        : { clear_programme: true }),
    onSuccess: refresh,
    onError,
  });
  const archive = useMutation({
    mutationFn: (id: string) => backendApi.schoolAdminArchiveLevel(id),
    onSuccess: refresh,
    onError,
  });

  const byProgramme = programmes.data ?? [];
  return (
    <SettingsCard
      icon={GraduationCap}
      title="Levels"
      description="The grades or levels this school operates, and which programme each belongs to."
    >
      {levels.isLoading ? (
        <Skeleton className="mt-5 h-24" />
      ) : levels.data?.length ? (
        <ul className="mt-5 divide-y divide-slate-100">
          {levels.data.map((level) => (
            <li key={level.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="text-sm font-bold text-slate-900">{level.name}</span>
              <span className="flex items-center gap-2">
                <select
                  value={level.programme_id ?? ""}
                  disabled={refile.isPending}
                  onChange={(event) => refile.mutate({ id: level.id, programmeId: event.target.value })}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm font-semibold"
                >
                  <option value="">No programme</option>
                  {byProgramme.map((programme) => (
                    <option key={programme.programme_id} value={programme.programme_id}>{programme.name}</option>
                  ))}
                </select>
                <Button variant="outline" disabled={archive.isPending} onClick={() => archive.mutate(level.id)}>
                  Archive
                </Button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            This school has no levels of its own yet. Add them in guided setup, where TeachPad&rsquo;s
            level catalogue can be adopted in one click.
          </p>
          <Link href="/school-admin/setup?step=3" className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700">
            Open setup <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </SettingsCard>
  );
}
