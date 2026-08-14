"use client";

import { useState } from "react";
import { Archive, Layers, Pencil, Plus } from "lucide-react";
import { backendApi, type ClassSection, type SchoolClass } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import {
  sectionArchiveBlockedReason,
  sectionLabel,
  sectionsOf,
} from "@/lib/school-admin-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ActionDialog, ConfirmDialog } from "@/components/school-admin/shared/action-dialog";

/**
 * Manage the sections of one class.
 *
 * ⚠ No business logic lives here. Uniqueness, the "unnamed section" rule and
 * the refusal to archive a section that still has assignments are all enforced
 * server-side; this dialog calls the endpoints and renders what comes back. The
 * one thing it does decide locally is whether to DISABLE the archive control,
 * and only so the reason is visible before the click rather than arriving as a
 * 409.
 */
export function SectionManager({
  schoolClass,
  open,
  onOpenChange,
  onChanged,
}: {
  schoolClass: SchoolClass | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<ClassSection | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [archiving, setArchiving] = useState<ClassSection | null>(null);
  const [busy, setBusy] = useState(false);

  if (!schoolClass) return null;
  const sections = sectionsOf(schoolClass).filter((section) => section.is_active);

  async function run(action: () => Promise<unknown>, success: string, failure: string) {
    setBusy(true);
    try {
      await action();
      await onChanged();
      toast({ title: success });
      return true;
    } catch (error) {
      toast({
        title: failure,
        description: getErrorMessage(error, "Try again."),
        variant: "error",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const ok = await run(
      () => backendApi.adminCreateClassSection(schoolClass!.id, { name: trimmed }),
      `Section ${trimmed} added`,
      "Could not add this section",
    );
    if (ok) setName("");
  }

  async function rename() {
    if (!renaming) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    const ok = await run(
      () => backendApi.adminUpdateClassSection(renaming.id, { name: trimmed }),
      "Section renamed",
      "Could not rename this section",
    );
    if (ok) setRenaming(null);
  }

  async function archive() {
    if (!archiving) return;
    const ok = await run(
      () => backendApi.adminUpdateClassSection(archiving.id, { is_active: false }),
      "Section archived",
      "Could not archive this section",
    );
    if (ok) setArchiving(null);
  }

  return (
    <>
      <ActionDialog
        open={open}
        onOpenChange={onOpenChange}
        title={`Sections of ${schoolClass.name}`}
        description="Teachers are assigned to a section, not to the class. Renaming a section keeps every assignment attached to it."
        footer={<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Done</Button>}
      >
        <div className="space-y-4">
          {sections.length ? (
            <ul className="space-y-1.5">
              {sections.map((section) => {
                const blocked = sectionArchiveBlockedReason(section);
                return (
                  <li
                    key={section.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {sectionLabel(section, schoolClass)}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {section.assigned_teacher_count
                          ? `${section.assigned_teacher_count} teacher${section.assigned_teacher_count === 1 ? "" : "s"}`
                          : "No teacher assigned"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Rename ${sectionLabel(section, schoolClass)}`}
                        onClick={() => {
                          setRenaming(section);
                          setRenameValue(section.name ?? "");
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={Boolean(blocked)}
                        title={blocked ?? undefined}
                        aria-label={`Archive ${sectionLabel(section, schoolClass)}`}
                        onClick={() => setArchiving(section)}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center">
              <Layers className="mx-auto h-6 w-6 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-900">No sections yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Add one to split this class into parallel groups.
              </p>
            </div>
          )}

          <div className="flex items-end gap-2 border-t border-slate-100 pt-3">
            <label className="flex-1 text-xs font-semibold text-slate-600">
              Add a section
              <Input
                className="mt-1.5"
                placeholder="A or Blue"
                value={name}
                disabled={busy}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void create();
                }}
              />
            </label>
            <Button type="button" disabled={busy || !name.trim()} onClick={() => void create()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </ActionDialog>

      <ActionDialog
        open={Boolean(renaming)}
        onOpenChange={(next) => { if (!next) setRenaming(null); }}
        title="Rename section"
        description="Assignments stay attached — the section keeps its identity, only its label changes."
        size="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button type="button" disabled={busy || !renameValue.trim()} onClick={() => void rename()}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") void rename(); }}
        />
      </ActionDialog>

      <ConfirmDialog
        open={Boolean(archiving)}
        onOpenChange={(next) => { if (!next) setArchiving(null); }}
        busy={busy}
        destructive
        title={`Archive ${archiving ? sectionLabel(archiving, schoolClass) : "this section"}?`}
        description="It stops accepting assignments. Past teaching records are kept."
        confirmLabel="Archive section"
        onConfirm={archive}
      />
    </>
  );
}
