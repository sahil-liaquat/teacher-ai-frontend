"use client";

import { FormEvent, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Pencil, Power, Save, X, Copy } from "lucide-react";
import { backendApi, type PrimaryAcademicYear } from "@/lib/api";
import { AdminPanel, EmptyState, LoadingState, StatusPill } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { LEVEL_OPTIONS } from "./theme-list";

type YearForm = Pick<PrimaryAcademicYear, "name" | "starts_on" | "ends_on">;

const newYearDefaults: YearForm = {
  name: "2026–27",
  starts_on: "2026-04-01",
  ends_on: "2027-03-31",
};

const MONTH_OPTIONS = [
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" }
];

export function AcademicYearsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<YearForm>(newYearDefaults);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState<YearForm>(newYearDefaults);
  
  // Clone academic year state
  const [sourceYearId, setSourceYearId] = useState("");
  const [destYearId, setDestYearId] = useState("");
  const [cloneClasses, setCloneClasses] = useState<string[]>([]);
  const [cloneMonths, setCloneMonths] = useState<number[]>([]);
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [includePublished, setIncludePublished] = useState(true);
  const [includeResources, setIncludeResources] = useState(true);
  const [cloning, setCloning] = useState(false);

  const years = useQuery({ queryKey: ["admin-primary-academic-years"], queryFn: backendApi.adminPrimaryAcademicYears });

  useEffect(() => {
    if (years.data && years.data.length > 0) {
      setSourceYearId(years.data[0].id);
      if (years.data.length > 1) {
        setDestYearId(years.data[1].id);
      } else {
        setDestYearId(years.data[0].id);
      }
    }
  }, [years.data]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-primary-academic-years"] });
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await backendApi.adminCreatePrimaryAcademicYear({ ...form, is_active: true });
      await refresh();
      toast({ title: "Academic year created" });
    } catch (error) {
      toast({ title: "Couldn't create academic year", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string, is_active: boolean) {
    try {
      await backendApi.adminUpdatePrimaryAcademicYear(id, { is_active });
      await refresh();
      toast({ title: is_active ? "Academic year activated" : "Academic year deactivated" });
    } catch (error) {
      toast({ title: "Couldn't update academic year", description: getErrorMessage(error, "Try again."), variant: "error" });
    }
  }

  function startEditing(year: PrimaryAcademicYear) {
    setEditingId(year.id);
    setEditForm({ name: year.name, starts_on: year.starts_on, ends_on: year.ends_on });
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setSaving(true);
    try {
      await backendApi.adminUpdatePrimaryAcademicYear(editingId, editForm);
      setEditingId("");
      await refresh();
      toast({ title: "Academic year updated" });
    } catch (error) {
      toast({ title: "Couldn't save academic year", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleCloneCurriculum() {
    if (!sourceYearId || !destYearId) {
      toast({ title: "Invalid selection", description: "Select source and destination academic years.", variant: "error" });
      return;
    }
    if (sourceYearId === destYearId) {
      toast({ title: "Invalid selection", description: "Source and destination academic years must be different.", variant: "error" });
      return;
    }
    
    setCloning(true);
    try {
      const res = await backendApi.adminCloneAcademicYear(sourceYearId, {
        destination_year_id: destYearId,
        classes: cloneClasses.length > 0 ? cloneClasses : undefined,
        months: cloneMonths.length > 0 ? cloneMonths : undefined,
        include_drafts: includeDrafts,
        include_published: includePublished,
        include_resources: includeResources
      });
      toast({ title: "Cloning complete", description: `Successfully cloned ${res.cloned_count} days to the target academic year.` });
    } catch (error: any) {
      toast({ title: "Cloning failed", description: error.message, variant: "error" });
    } finally {
      setCloning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)] xl:items-start">
        <AdminPanel title="Create academic year" description="Set the calendar teachers use when lessons are scheduled.">
          <form onSubmit={create} className="space-y-4">
            <Field label="Name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts"><Input type="date" value={form.starts_on} onChange={(event) => setForm({ ...form, starts_on: event.target.value })} required /></Field>
              <Field label="Ends"><Input type="date" value={form.ends_on} onChange={(event) => setForm({ ...form, ends_on: event.target.value })} required /></Field>
            </div>
            <Button type="submit" disabled={saving || !form.name.trim()}><CalendarPlus className="h-4 w-4" />{saving ? "Creating…" : "Create year"}</Button>
          </form>
        </AdminPanel>

        <AdminPanel title="Academic years" description="Edit calendar dates or deactivate years that should no longer appear while authoring lessons.">
          {years.isLoading ? <LoadingState label="Loading years" /> : null}
          {!years.isLoading && !(years.data ?? []).length ? <EmptyState title="No academic years" description="Create the first academic year using the form." /> : null}
          <div className="space-y-3">
            {(years.data ?? []).map((year) => editingId === year.id ? (
              <form key={year.id} onSubmit={saveEdit} className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                <Field label="Name"><Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} required /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Starts"><Input type="date" value={editForm.starts_on} onChange={(event) => setEditForm({ ...editForm, starts_on: event.target.value })} required /></Field>
                  <Field label="Ends"><Input type="date" value={editForm.ends_on} onChange={(event) => setEditForm({ ...editForm, ends_on: event.target.value })} required /></Field>
                </div>
                <div className="flex gap-2"><Button type="submit" size="sm" disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving…" : "Save changes"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditingId("")}><X className="h-4 w-4" />Cancel</Button></div>
              </form>
            ) : (
              <div key={year.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4">
                <span><b className="block">{year.name}</b><small className="text-gray-500">{year.starts_on} → {year.ends_on}</small></span>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={year.is_active ? "success" : "neutral"}>{year.is_active ? "Active" : "Inactive"}</StatusPill>
                  <Button type="button" size="sm" variant="outline" onClick={() => startEditing(year)}><Pencil className="h-4 w-4" />Edit</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => void toggle(year.id, !year.is_active)}><Power className="h-4 w-4" />{year.is_active ? "Deactivate" : "Activate"}</Button>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      {/* Cloning Panel */}
      <AdminPanel 
        title="Clone Curriculum Map" 
        description="Copy weeks and day lesson configurations from a previous academic year to a new destination year."
      >
        <div className="space-y-4 max-w-xl text-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Source Academic Year</label>
              <select
                value={sourceYearId}
                onChange={(e) => setSourceYearId(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 bg-white font-bold"
              >
                {(years.data ?? []).map(y => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Destination Academic Year</label>
              <select
                value={destYearId}
                onChange={(e) => setDestYearId(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 bg-white font-bold"
              >
                {(years.data ?? []).map(y => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Classes filters */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase">Filter Classes (Optional - empty clones all)</label>
            <div className="flex flex-wrap gap-2.5">
              {LEVEL_OPTIONS.map((lvl) => {
                const isChecked = cloneClasses.includes(lvl.value);
                return (
                  <label key={lvl.value} className="flex items-center gap-1.5 bg-slate-50 border rounded-lg px-2.5 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCloneClasses([...cloneClasses, lvl.value]);
                        } else {
                          setCloneClasses(cloneClasses.filter(x => x !== lvl.value));
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-bold text-slate-600">{lvl.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Months filters */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase">Filter Months (Optional - empty clones all)</label>
            <div className="flex flex-wrap gap-2">
              {MONTH_OPTIONS.map((m) => {
                const isChecked = cloneMonths.includes(m.value);
                return (
                  <label key={m.value} className="flex items-center gap-1.5 bg-slate-50 border rounded-lg px-2 py-0.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCloneMonths([...cloneMonths, m.value]);
                        } else {
                          setCloneMonths(cloneMonths.filter(x => x !== m.value));
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-bold text-slate-600">{m.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Options checkboxes */}
          <div className="space-y-2 border-t pt-3">
            <label className="text-[10px] font-black text-slate-400 uppercase block">Cloning Options</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDrafts}
                  onChange={(e) => setIncludeDrafts(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">Include Drafts</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePublished}
                  onChange={(e) => setIncludePublished(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">Include Published</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeResources}
                  onChange={(e) => setIncludeResources(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">Copy Resource Attachments</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={handleCloneCurriculum}
              disabled={cloning || !sourceYearId || !destYearId || sourceYearId === destYearId}
              className="rounded-xl font-bold"
            >
              <Copy className="h-4 w-4 mr-1.5" />
              {cloning ? "Cloning Map..." : "Clone Curriculum Map"}
            </Button>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
