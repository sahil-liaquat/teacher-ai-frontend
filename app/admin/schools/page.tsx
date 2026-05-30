"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Edit3, Plus, Save, School, Search, Trash2 } from "lucide-react";
import { backendApi, type School as SchoolItem, type SchoolFormatSection, type SchoolFormatTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const APS_SECTIONS: SchoolFormatSection[] = [
  {
    key: "lesson_plan_header",
    title: "Lesson Plan Header",
    required: true,
    children: [
      { key: "class", title: "Class", required: true },
      { key: "date", title: "Date", required: true },
      { key: "chapter", title: "Chapter", required: true },
      { key: "subject", title: "Subject", required: true },
      { key: "day", title: "Day", required: true },
      { key: "subject_teacher", title: "Subject Teacher", required: true }
    ]
  },
  {
    key: "learning_objectives",
    title: "Learning Objectives",
    required: true,
    children: [
      { key: "general_objectives", title: "General Objectives", required: true },
      { key: "specific_objectives", title: "Specific Objectives", required: true }
    ]
  },
  { key: "learning_outcomes", title: "Learning Outcomes / Instructional Objectives", required: true },
  { key: "concept", title: "Concept", required: true },
  { key: "teaching_methodology", title: "Teaching Methodology", required: true },
  {
    key: "pedagogy",
    title: "Pedagogy",
    required: true,
    children: [
      { key: "check_previous_knowledge", title: "Check Previous Knowledge", required: true },
      { key: "introduction_motivation", title: "Introduction / Motivation", required: true },
      { key: "process_active_learning", title: "Process / Explain and Elaborate / Active Learning", required: true },
      { key: "questioning_critical_thinking", title: "Questioning / Critical Thinking / Communication", required: true }
    ]
  },
  {
    key: "recapitulation",
    title: "Recapitulation",
    required: true,
    children: [
      { key: "class_assignment", title: "Class Assignment", required: true },
      { key: "home_assignment", title: "Home Assignment", required: true }
    ]
  },
  { key: "skills_development", title: "Skills Development", required: true },
  { key: "art_integration", title: "Art Integration", required: true },
  { key: "scientific_temperament", title: "Scientific Temperament", required: true },
  { key: "innovative_practice", title: "Innovative Practice", required: true },
  {
    key: "classroom_diversities",
    title: "Addressing Class Room Diversities",
    required: true,
    children: [
      { key: "gifted_students", title: "Gifted Students", required: true },
      { key: "slow_bloomers", title: "Slow Bloomers (Gradual achievers)", required: true },
      { key: "special_students", title: "Special Students", required: true }
    ]
  },
  { key: "resources", title: "Resource Required / Used", required: true },
  { key: "checked_by_hm", title: "Checked By: Vice Principal / HM / CPW", required: true },
  { key: "checked_by_hm_signature", title: "Signature", required: true },
  { key: "checked_by_principal", title: "Checked By Principal", required: true },
  { key: "checked_by_principal_signature", title: "Signature", required: true }
];

const DEFAULT_TEMPLATE_INSTRUCTIONS = "Generate the lesson plan in the official APS Samba diary/register style shown in the school notebook. Use concise teacher-friendly wording suitable for copying into a physical lesson plan diary. Keep each section practical and compact. Fill the header fields with available teacher inputs and leave unknown date/day/signature fields as blanks. Map activity-based content into Pedagogy and Innovative Practice, assessment into Recapitulation, homework into Home Assignment, and differentiation into Addressing Class Room Diversities.";

type TemplateDraft = {
  id?: string;
  template_name: string;
  description: string;
  prompt_instructions: string;
  required_sections_text: string;
  is_active: boolean;
  is_default: boolean;
};

export default function AdminSchoolsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [draft, setDraft] = useState<TemplateDraft>(emptyTemplateDraft());

  const schools = useQuery({ queryKey: ["admin-schools", query], queryFn: () => backendApi.schools(query, 0, 100) });
  const filtered = useMemo(() => schools.data?.items || [], [schools.data?.items]);
  const selectedSchool = useMemo(() => filtered.find((school) => school.id === selectedSchoolId) || filtered[0], [filtered, selectedSchoolId]);
  const templates = useQuery({
    queryKey: ["admin-school-templates", selectedSchool?.id],
    queryFn: () => backendApi.schoolTemplates(selectedSchool!.id),
    enabled: Boolean(selectedSchool?.id)
  });
  const lessonTemplate = useMemo(
    () => templates.data?.find((template) => template.template_type === "lesson_plan" && template.is_default) || templates.data?.find((template) => template.template_type === "lesson_plan"),
    [templates.data]
  );

  useEffect(() => {
    if (!selectedSchoolId && filtered[0]) setSelectedSchoolId(filtered[0].id);
  }, [filtered, selectedSchoolId]);

  useEffect(() => {
    setDraft(templateToDraft(lessonTemplate));
  }, [lessonTemplate?.id]);

  async function createSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      const created = await backendApi.createSchool({ name: name.trim(), city: city.trim() || undefined, district: city.trim() || undefined, state: state.trim() || undefined, status: "active" });
      setName("");
      setCity("");
      setState("");
      setSelectedSchoolId(created.id);
      await queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      toast({ title: "School added", description: "You can now create or edit its lesson-plan template." });
    } catch (error) {
      toast({ title: "Could not add school", description: error instanceof Error ? error.message : "Please try again." });
    }
  }

  async function deleteSchool(school: SchoolItem) {
    const confirmed = window.confirm(`Delete ${school.name}? This removes its templates and unlinks teachers from this school.`);
    if (!confirmed) return;
    try {
      await backendApi.deleteSchool(school.id);
      if (selectedSchoolId === school.id) setSelectedSchoolId("");
      await queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      toast({ title: "School deleted", description: `${school.name} was removed.` });
    } catch (error) {
      toast({ title: "Could not delete school", description: error instanceof Error ? error.message : "Please try again." });
    }
  }

  async function saveLessonTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSchool) return;
    const requiredSections = parseRequiredSections(draft.required_sections_text);
    if (!requiredSections.length) {
      toast({ title: "Template needs sections", description: "Add at least one heading. Use indented lines for subheadings." });
      return;
    }
    setSavingTemplate(true);
    try {
      const payload = {
        template_type: "lesson_plan" as const,
        template_name: draft.template_name.trim() || `${selectedSchool.name} Lesson Plan Format`,
        description: draft.description.trim() || null,
        required_sections: requiredSections,
        prompt_instructions: draft.prompt_instructions.trim() || DEFAULT_TEMPLATE_INSTRUCTIONS,
        sample_output: null,
        output_schema: null,
        is_active: draft.is_active,
        is_default: draft.is_default
      };
      if (draft.id) {
        await backendApi.updateSchoolTemplate(draft.id, payload);
      } else {
        await backendApi.createSchoolTemplate(selectedSchool.id, payload);
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-school-templates", selectedSchool.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      toast({ title: "Template saved", description: "Lesson-plan generation will use the updated school format." });
    } catch (error) {
      toast({ title: "Could not save template", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setSavingTemplate(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-teachpad-cardBorder bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-teachpad-ink">Schools</h1>
            <p className="mt-1 text-sm font-semibold text-teachpad-muted">Manage schools and their admin-approved lesson-plan formats.</p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teachpad-muted" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search schools" className="pl-9" />
          </div>
        </div>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="grid gap-5">
          <div className="overflow-hidden rounded-lg border border-teachpad-cardBorder bg-white shadow-sm">
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(120px,0.9fr)_110px_100px_112px] gap-3 border-b border-teachpad-cardBorder bg-teachpad-panel px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-teachpad-muted">
              <span>School</span>
              <span>Location</span>
              <span>Status</span>
              <span>Templates</span>
              <span>Actions</span>
            </div>
            {filtered.map((school) => (
              <button
                key={school.id}
                type="button"
                onClick={() => setSelectedSchoolId(school.id)}
                className={cn(
                  "grid w-full grid-cols-[minmax(0,1.4fr)_minmax(120px,0.9fr)_110px_100px_112px] gap-3 border-b border-teachpad-cardBorder px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-blue-50/40",
                  selectedSchool?.id === school.id ? "bg-blue-50/70" : "bg-white"
                )}
              >
                <span className="truncate font-black text-teachpad-ink">{school.name}</span>
                <span className="truncate font-semibold text-teachpad-muted">{[school.city, school.state].filter(Boolean).join(", ") || "Not set"}</span>
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {school.status}</span>
                <span className="font-black text-teachpad-ink">{school.templates_count || 0}</span>
                <span className="flex gap-1">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-blue-100 bg-white text-blue-600" title="Edit template"><Edit3 className="h-4 w-4" /></span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      void deleteSchool(school);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        void deleteSchool(school);
                      }
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-red-100 bg-white text-red-600"
                    title="Delete school"
                  >
                    <Trash2 className="h-4 w-4" />
                  </span>
                </span>
              </button>
            ))}
            {!filtered.length ? <div className="p-6 text-sm font-semibold text-teachpad-muted">{schools.isLoading ? "Loading schools..." : "No schools found."}</div> : null}
          </div>

          <form onSubmit={createSchool} className="rounded-lg border border-teachpad-cardBorder bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-teachpad-blue"><School className="h-5 w-5" /></span>
              <div>
                <h2 className="text-lg font-black text-teachpad-ink">Add school</h2>
                <p className="text-sm font-semibold text-teachpad-muted">Create a school, then edit its lesson-plan template.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Army Public School Samba" />
              <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City / District" />
              <Input value={state} onChange={(event) => setState(event.target.value)} placeholder="State" />
              <Button type="submit"><Plus className="h-4 w-4" /> Add</Button>
            </div>
          </form>
        </div>

        <form onSubmit={saveLessonTemplate} className="rounded-lg border border-teachpad-cardBorder bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-teachpad-ink">Lesson-plan template</h2>
              <p className="mt-1 text-sm font-semibold text-teachpad-muted">{selectedSchool ? selectedSchool.name : "Select a school to edit its format."}</p>
            </div>
            <Button type="submit" disabled={!selectedSchool || savingTemplate}>
              <Save className="h-4 w-4" />
              {savingTemplate ? "Saving..." : "Save"}
            </Button>
          </div>

          <div className="mt-5 grid gap-3">
            <Input value={draft.template_name} onChange={(event) => setDraft((current) => ({ ...current, template_name: event.target.value }))} placeholder="APS Samba School Register Format" disabled={!selectedSchool} />
            <Input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Template description" disabled={!selectedSchool} />
            <label className="grid gap-2">
              <span className="text-sm font-black text-teachpad-ink">Required sections</span>
              <Textarea
                value={draft.required_sections_text}
                onChange={(event) => setDraft((current) => ({ ...current, required_sections_text: event.target.value }))}
                rows={12}
                disabled={!selectedSchool}
                placeholder={"Main heading\n- Subheading\n- Another subheading"}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-black text-teachpad-ink">Prompt instructions</span>
              <Textarea
                value={draft.prompt_instructions}
                onChange={(event) => setDraft((current) => ({ ...current, prompt_instructions: event.target.value }))}
                rows={6}
                disabled={!selectedSchool}
                placeholder="Tell the AI how to follow this school format."
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-teachpad-cardBorder bg-teachpad-panel px-3 py-2 text-sm font-bold text-teachpad-ink">
                <input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft((current) => ({ ...current, is_active: event.target.checked }))} disabled={!selectedSchool} />
                Active
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-teachpad-cardBorder bg-teachpad-panel px-3 py-2 text-sm font-bold text-teachpad-ink">
                <input type="checkbox" checked={draft.is_default} onChange={(event) => setDraft((current) => ({ ...current, is_default: event.target.checked }))} disabled={!selectedSchool} />
                Default
              </label>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!selectedSchool}
              onClick={() => setDraft((current) => ({ ...current, required_sections_text: sectionsToText(APS_SECTIONS) }))}
            >
              Load APS Samba headings
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function emptyTemplateDraft(): TemplateDraft {
  return {
    template_name: "",
    description: "",
    prompt_instructions: DEFAULT_TEMPLATE_INSTRUCTIONS,
    required_sections_text: sectionsToText(APS_SECTIONS),
    is_active: true,
    is_default: true
  };
}

function templateToDraft(template?: SchoolFormatTemplate): TemplateDraft {
  if (!template) return emptyTemplateDraft();
  return {
    id: template.id,
    template_name: template.template_name || "",
    description: template.description || "",
    prompt_instructions: template.prompt_instructions || DEFAULT_TEMPLATE_INSTRUCTIONS,
    required_sections_text: sectionsToText(template.required_sections || []),
    is_active: template.is_active,
    is_default: template.is_default
  };
}

function parseRequiredSections(value: string): SchoolFormatSection[] {
  const sections: SchoolFormatSection[] = [];
  let current: SchoolFormatSection | null = null;
  value.split(/\n+/).forEach((rawLine) => {
    if (!rawLine.trim()) return;
    const trimmed = rawLine.trim();
    const isSubheading = trimmed.startsWith("-") || /^\s+/.test(rawLine);
    const title = trimmed.replace(/^-\s*/, "").trim();
    if (!title) return;
    const section = {
      key: slugifyHeading(title),
      title,
      required: true
    };
    if (isSubheading && current) {
      current.children = [...(current.children || []), section];
      return;
    }
    current = section;
    sections.push(section);
  });
  return sections;
}

function sectionsToText(sections: SchoolFormatSection[]): string {
  return sections.flatMap((section) => [
    section.title,
    ...(section.children || []).map((child) => `- ${child.title}`)
  ]).join("\n");
}

function slugifyHeading(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "section";
}
