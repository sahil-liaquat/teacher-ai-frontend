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
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-[#e8e7fb]">
        <h2 className="text-3xl font-black tracking-tight text-[#171747]">Classroom Roster</h2>
        <p className="text-xs font-semibold text-[#596083] mt-1">
          Manage your classes, student codes, and profiles safely and privately.
        </p>
      </div>

      {/* Privacy Note */}
      <div className="rounded-2xl border border-[#e8e7fb] bg-[#fbfbfe] p-4 shadow-sm">
        <p className="text-xs font-bold leading-relaxed text-[#596083]">
          🛡️ Children are identified by a code, initials or nickname that you choose — TeachPad never
          stores a child&rsquo;s real name, date of birth or photo. Only you can see this roster.
        </p>
      </div>

      {/* Classes Section */}
      <section className="rounded-[28px] border border-[#e8e7fb] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 pb-4 mb-5">
          <h2 className="text-base font-black text-[#171747]">Your Classes</h2>
          <label className="flex items-center gap-2 text-xs font-black text-[#596083] cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
              className="rounded text-[#6e41f5] focus:ring-[#6e41f5] cursor-pointer"
            />
            Show archived
          </label>
        </div>

        <form
          className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]"
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
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-[#171747] focus:border-[#6e41f5] focus:outline-none"
          />
          <div className="relative">
            <select
              value={newSectionLevel}
              onChange={(event) => setNewSectionLevel(event.target.value as PrimaryLevel)}
              aria-label="Class level"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-xs font-bold text-[#171747] focus:border-[#6e41f5] focus:outline-none"
            >
              {PRIMARY_LEVEL_KEYS.map((key) => (
                <option key={key} value={key}>
                  {levelLabel(key)}
                </option>
              ))}
            </select>
            <Plus className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 rotate-45" />
          </div>
          <button
            type="submit"
            disabled={!canAddSection}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6e41f5] px-5 py-2.5 text-xs font-black text-white hover:bg-[#5731d8] transition shadow-md shadow-[#6e41f5]/15 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {createSection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add class
          </button>
        </form>

        {sections.isLoading ? (
          <p className="mt-5 text-xs font-bold text-[#596083]">Loading your classes…</p>
        ) : sections.isError ? (
          <div className="mt-5 rounded-2xl bg-[#faf9ff] border border-[#cfc8ef] p-6 text-center">
            <p className="text-xs font-bold text-[#6e41f5]">Couldn&rsquo;t load your classes</p>
            <button
              type="button"
              onClick={() => void sections.refetch()}
              className="mt-3 rounded-xl bg-[#6e41f5] px-4 py-2 text-xs font-black text-white hover:bg-[#5731d8] transition cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : (sections.data || []).length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-[#ecebf7] bg-[#faf9ff]/45 p-6 text-center text-xs font-bold text-slate-400">
            No classes yet. Add one above to start your roster.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(sections.data || []).map((section) => (
              <li key={section.id}>
                <div
                  className={cn(
                    "flex h-full flex-col justify-between rounded-2xl border p-4 shadow-sm transition duration-150",
                    section.id === selectedSectionId
                      ? "border-[#6e41f5] bg-[#faf9ff]"
                      : "border-[#ecebf7] bg-white hover:border-[#6e41f5]/25 hover:bg-[#faf9ff]/10",
                    !section.is_active && "opacity-60",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSectionId(section.id)}
                    aria-pressed={section.id === selectedSectionId}
                    className="text-left cursor-pointer"
                  >
                    <b className="block text-sm font-black text-[#171747]">{section.name}</b>
                    <span className="mt-1 block text-[10px] font-bold text-[#6e41f5] uppercase tracking-wider">
                      {levelLabel(section.level)} · {section.student_count}{" "}
                      {section.student_count === 1 ? "child" : "children"}
                      {section.is_active ? "" : " · archived"}
                    </span>
                  </button>
                  <div className="mt-4 flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100/75">
                    <button
                      type="button"
                      onClick={() => archiveSection.mutate(section)}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-[#596083] hover:text-[#6e41f5] transition cursor-pointer"
                    >
                      {section.is_active ? <Archive className="h-3.5 w-3.5" /> : <Undo2 className="h-3.5 w-3.5" />}
                      {section.is_active ? "Archive" : "Restore"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSection.mutate(section)}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-rose-600 hover:text-rose-700 transition cursor-pointer ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Children Section */}
      {selectedSection && (
        <section className="rounded-[28px] border border-[#e8e7fb] bg-white p-6 shadow-sm">
          <h2 className="text-base font-black text-[#171747] border-b border-slate-50 pb-4 mb-5">
            Children in <span className="text-[#6e41f5]">{selectedSection.name}</span>
          </h2>

          <form
            className="grid gap-3 sm:grid-cols-[1fr_auto]"
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
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-[#171747] focus:border-[#6e41f5] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!canAddStudent}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6e41f5] px-5 py-2.5 text-xs font-black text-white hover:bg-[#5731d8] transition shadow-md shadow-[#6e41f5]/15 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {createStudent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add child
            </button>
          </form>

          {students.isLoading ? (
            <p className="mt-5 text-xs font-bold text-[#596083]">Loading children…</p>
          ) : students.isError ? (
            <div className="mt-5 rounded-2xl bg-[#faf9ff] border border-[#cfc8ef] p-6 text-center">
              <p className="text-xs font-bold text-[#6e41f5]">Couldn&rsquo;t load this class</p>
              <button
                type="button"
                onClick={() => void students.refetch()}
                className="mt-3 rounded-xl bg-[#6e41f5] px-4 py-2 text-xs font-black text-white hover:bg-[#5731d8] transition cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : (students.data || []).length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-[#ecebf7] bg-[#faf9ff]/45 p-6 text-center text-xs font-bold text-slate-400">
              No children in this class yet.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-[#eceaff]">
              {(students.data || []).map((student) => (
                <li
                  key={student.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 py-3.5 hover:bg-[#faf9ff]/30 px-2 rounded-xl transition duration-150",
                    !student.is_active && "opacity-60",
                  )}
                >
                  <b className="text-sm font-black text-[#171747]">{student.code}</b>
                  {!student.is_active && (
                    <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Archived
                    </span>
                  )}
                  <div className="ml-auto flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setProfileStudent(student)}
                      className="text-xs font-black text-[#6e41f5] hover:text-[#5731d8] transition cursor-pointer"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => archiveStudent.mutate(student)}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-[#596083] hover:text-[#6e41f5] transition cursor-pointer"
                    >
                      {student.is_active ? <Archive className="h-3.5 w-3.5" /> : <Undo2 className="h-3.5 w-3.5" />}
                      {student.is_active ? "Archive" : "Restore"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStudent.mutate(student)}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-rose-600 hover:text-rose-700 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
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
