"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Loader2, Plus, Trash2, Undo2 } from "lucide-react";
import {
  backendApi,
  type PrimaryLevel,
  type PrimarySection,
  type PrimaryStudent,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { PRIMARY_LEVEL_KEYS, levelFromDisplay, levelLabel } from "@/lib/primary-coverage";
import { usePrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { isValidStudentCode, normaliseStudentCode } from "@/lib/primary-roster";
import { cn } from "@/lib/utils";
import PrimaryStudentProfilePanel from "./primary-student-profile";

const SECTIONS_KEY = ["primary-sections"] as const;

export default function PrimaryRosterPage({ notify }: { notify: (message: string) => void }) {
  const queryClient = useQueryClient();
  const { context } = usePrimaryTeachingContext();

  const [showArchived, setShowArchived] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionLevel, setNewSectionLevel] = useState<PrimaryLevel>(
    () => levelFromDisplay(context.level) || "nursery",
  );
  const [newStudentCode, setNewStudentCode] = useState("");
  const [profileStudent, setProfileStudent] = useState<PrimaryStudent | null>(null);

  const sections = useQuery({
    queryKey: [...SECTIONS_KEY, showArchived],
    queryFn: () => backendApi.primarySections(showArchived),
  });

  // Keep a selection even as the list loads, changes, or loses the selected row.
  useEffect(() => {
    const list = sections.data || [];
    if (list.length === 0) {
      if (selectedSectionId !== null) setSelectedSectionId(null);
      return;
    }
    const stillThere = list.some((section) => section.id === selectedSectionId);
    if (!stillThere) setSelectedSectionId(list[0].id);
  }, [sections.data, selectedSectionId]);

  const selectedSection = useMemo(
    () => (sections.data || []).find((section) => section.id === selectedSectionId) || null,
    [sections.data, selectedSectionId],
  );

  const students = useQuery({
    queryKey: ["primary-students", selectedSectionId, showArchived],
    queryFn: () =>
      backendApi.primaryStudents({
        sectionId: selectedSectionId as string,
        includeArchived: showArchived,
      }),
    enabled: Boolean(selectedSectionId),
  });

  function refreshSections() {
    void queryClient.invalidateQueries({ queryKey: SECTIONS_KEY });
  }
  function refreshStudents() {
    void queryClient.invalidateQueries({ queryKey: ["primary-students"] });
    // The section cards show a live headcount, so they go stale too.
    refreshSections();
  }

  const createSection = useMutation({
    mutationFn: () =>
      backendApi.createPrimarySection({ name: newSectionName.trim(), level: newSectionLevel }),
    onSuccess: (section) => {
      setNewSectionName("");
      setSelectedSectionId(section.id);
      refreshSections();
      notify(`Added ${section.name}`);
    },
    onError: (error) => notify(getErrorMessage(error, "Could not add that class.")),
  });

  const archiveSection = useMutation({
    mutationFn: (section: PrimarySection) =>
      backendApi.updatePrimarySection(section.id, { is_active: !section.is_active }),
    onSuccess: (section) => {
      refreshSections();
      notify(section.is_active ? `${section.name} restored` : `${section.name} archived`);
    },
    onError: (error) => notify(getErrorMessage(error, "Could not update that class.")),
  });

  const deleteSection = useMutation({
    mutationFn: (section: PrimarySection) => backendApi.deletePrimarySection(section.id),
    onSuccess: () => {
      refreshSections();
      notify("Class deleted");
    },
    // The backend returns 409 with a sentence telling the teacher to archive
    // instead; getErrorMessage surfaces it verbatim.
    onError: (error) => notify(getErrorMessage(error, "Could not delete that class.")),
  });

  const createStudent = useMutation({
    mutationFn: () =>
      backendApi.createPrimaryStudent({
        section_id: selectedSectionId as string,
        code: normaliseStudentCode(newStudentCode),
      }),
    onSuccess: (student) => {
      setNewStudentCode("");
      refreshStudents();
      notify(`Added ${student.code}`);
    },
    onError: (error) => notify(getErrorMessage(error, "Could not add that child.")),
  });

  const archiveStudent = useMutation({
    mutationFn: (student: PrimaryStudent) =>
      backendApi.updatePrimaryStudent(student.id, { is_active: !student.is_active }),
    onSuccess: (student) => {
      refreshStudents();
      notify(student.is_active ? `${student.code} restored` : `${student.code} archived`);
    },
    onError: (error) => notify(getErrorMessage(error, "Could not update that child.")),
  });

  const deleteStudent = useMutation({
    mutationFn: (student: PrimaryStudent) => backendApi.deletePrimaryStudent(student.id),
    onSuccess: () => {
      setProfileStudent(null);
      refreshStudents();
      notify("Child removed");
    },
    onError: (error) => notify(getErrorMessage(error, "Could not remove that child.")),
  });

  const canAddSection = newSectionName.trim().length > 0 && !createSection.isPending;
  const canAddStudent =
    Boolean(selectedSectionId) && isValidStudentCode(newStudentCode) && !createStudent.isPending;

  return (
    <div className="mt-4 space-y-5">
      <section className="primary-card p-5">
        <p className="text-xs font-medium leading-5 text-[#454c86]">
          Children are identified by a code, initials or nickname that you choose — TeachPad never
          stores a child&rsquo;s real name, date of birth or photo. Only you can see this roster.
        </p>
      </section>

      <section className="primary-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Your classes</h2>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
            />
            Show archived
          </label>
        </div>

        <form
          className="mt-4 grid gap-2 sm:grid-cols-[2fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (canAddSection) createSection.mutate();
          }}
        >
          <input
            value={newSectionName}
            onChange={(event) => setNewSectionName(event.target.value)}
            placeholder="Class name, e.g. Nursery A"
            aria-label="Class name"
            maxLength={120}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <select
            value={newSectionLevel}
            onChange={(event) => setNewSectionLevel(event.target.value as PrimaryLevel)}
            aria-label="Class level"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {PRIMARY_LEVEL_KEYS.map((key) => (
              <option key={key} value={key}>
                {levelLabel(key)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!canAddSection}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1677ff] px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createSection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add class
          </button>
        </form>

        {sections.isLoading ? (
          <p className="mt-4 text-sm font-medium text-[#454c86]">Loading your classes…</p>
        ) : sections.isError ? (
          <div className="mt-4 rounded-2xl bg-[#f7f4ff] p-6 text-center">
            <p className="text-sm font-extrabold text-[#2f377e]">Couldn&rsquo;t load your classes</p>
            <button
              type="button"
              onClick={() => void sections.refetch()}
              className="mt-3 rounded-xl bg-[#1677ff] px-4 py-2 text-xs font-bold text-white"
            >
              Try again
            </button>
          </div>
        ) : (sections.data || []).length === 0 ? (
          <p className="mt-4 rounded-2xl bg-[#f7f4ff] p-6 text-center text-sm font-medium text-[#454c86]">
            No classes yet. Add one above to start your roster.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(sections.data || []).map((section) => (
              <li key={section.id}>
                <div
                  className={cn(
                    "flex h-full flex-col rounded-2xl border p-4 transition",
                    section.id === selectedSectionId
                      ? "border-[#1677ff] bg-blue-50"
                      : "border-[#e8e7fb] bg-white hover:border-[#bca5ff]",
                    !section.is_active && "opacity-60",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSectionId(section.id)}
                    aria-pressed={section.id === selectedSectionId}
                    className="text-left"
                  >
                    <b className="block text-sm text-slate-900">{section.name}</b>
                    <span className="mt-0.5 block text-[11px] font-bold text-[#454c86]">
                      {levelLabel(section.level)} · {section.student_count}{" "}
                      {section.student_count === 1 ? "child" : "children"}
                      {section.is_active ? "" : " · archived"}
                    </span>
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => archiveSection.mutate(section)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#454c86] hover:underline"
                    >
                      {section.is_active ? <Archive className="h-3 w-3" /> : <Undo2 className="h-3 w-3" />}
                      {section.is_active ? "Archive" : "Restore"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSection.mutate(section)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedSection && (
        <section className="primary-card p-5">
          <h2 className="text-lg font-extrabold">
            Children in {selectedSection.name}
          </h2>

          <form
            className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              if (canAddStudent) createStudent.mutate();
            }}
          >
            <input
              value={newStudentCode}
              onChange={(event) => setNewStudentCode(event.target.value)}
              placeholder="Code, initials or nickname, e.g. A01"
              aria-label="Child code"
              maxLength={40}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <button
              type="submit"
              disabled={!canAddStudent}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1677ff] px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createStudent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add child
            </button>
          </form>

          {students.isLoading ? (
            <p className="mt-4 text-sm font-medium text-[#454c86]">Loading children…</p>
          ) : students.isError ? (
            <div className="mt-4 rounded-2xl bg-[#f7f4ff] p-6 text-center">
              <p className="text-sm font-extrabold text-[#2f377e]">Couldn&rsquo;t load this class</p>
              <button
                type="button"
                onClick={() => void students.refetch()}
                className="mt-3 rounded-xl bg-[#1677ff] px-4 py-2 text-xs font-bold text-white"
              >
                Try again
              </button>
            </div>
          ) : (students.data || []).length === 0 ? (
            <p className="mt-4 rounded-2xl bg-[#f7f4ff] p-6 text-center text-sm font-medium text-[#454c86]">
              No children in this class yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[#eceaff]">
              {(students.data || []).map((student) => (
                <li
                  key={student.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 py-3",
                    !student.is_active && "opacity-60",
                  )}
                >
                  <b className="text-sm text-slate-900">{student.code}</b>
                  {!student.is_active && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      Archived
                    </span>
                  )}
                  <div className="ml-auto flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setProfileStudent(student)}
                      className="text-[11px] font-bold text-[#1677ff] hover:underline"
                    >
                      View profile
                    </button>
                    <button
                      type="button"
                      onClick={() => archiveStudent.mutate(student)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#454c86] hover:underline"
                    >
                      {student.is_active ? <Archive className="h-3 w-3" /> : <Undo2 className="h-3 w-3" />}
                      {student.is_active ? "Archive" : "Restore"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStudent.mutate(student)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {profileStudent && (
        <PrimaryStudentProfilePanel
          student={profileStudent}
          onClose={() => setProfileStudent(null)}
        />
      )}
    </div>
  );
}
