"use client";

import { AlertTriangle, MailCheck, MoreHorizontal, UserMinus, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SchoolTeacher } from "@/lib/api";
import {
  ACCOUNT_STATUS_COPY,
  CURRICULUM_STATUS_COPY,
  curriculumStatus,
  formatDate,
  teacherLevelLabel,
} from "@/lib/school-admin-teachers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type TeacherRowAction = "view" | "assign" | "edit" | "resend" | "remove" | "cancel";

export function TeacherTable({
  teachers,
  isLoading,
  onAction,
  page,
  pages,
  total,
  onPageChange,
}: {
  teachers: SchoolTeacher[];
  isLoading: boolean;
  onAction: (action: TeacherRowAction, teacher: SchoolTeacher) => void;
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4">
        {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-14 rounded-2xl" />)}
      </div>
    );
  }

  if (!teachers.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <UserPlus className="mx-auto h-7 w-7 text-slate-400" />
        <h2 className="mt-3 text-lg font-semibold text-slate-950">No teachers match these filters</h2>
        <p className="mt-2 text-sm text-slate-500">Clear a filter, or invite a teacher to your school.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <th scope="col" className="px-5 py-3">Teacher</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3">Classes</th>
              <th scope="col" className="px-5 py-3">Levels</th>
              <th scope="col" className="px-5 py-3">Curriculum</th>
              <th scope="col" className="px-5 py-3">Joined</th>
              <th scope="col" className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <TeacherRow key={teacher.id} teacher={teacher} onAction={onAction} />
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
          <p className="text-xs font-semibold text-slate-500">Page {page} of {pages} · {total} teachers</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Next</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TeacherRow({ teacher, onAction }: { teacher: SchoolTeacher; onAction: (action: TeacherRowAction, teacher: SchoolTeacher) => void }) {
  const invited = teacher.account_status === "invited";
  const account = ACCOUNT_STATUS_COPY[teacher.account_status] ?? ACCOUNT_STATUS_COPY.inactive;
  const curriculum = CURRICULUM_STATUS_COPY[curriculumStatus(teacher)];

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
      <td className="px-5 py-3.5">
        <button
          type="button"
          onClick={() => onAction("view", teacher)}
          disabled={invited}
          className="text-left disabled:cursor-default"
        >
          <span className={cn("block font-semibold text-slate-950", !invited && "hover:text-blue-700")}>
            {invited ? teacher.email : teacher.full_name}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">{invited ? "Invitation not yet accepted" : teacher.email}</span>
        </button>
      </td>
      <td className="px-5 py-3.5">
        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", account.tone)}>{account.label}</span>
      </td>
      <td className="px-5 py-3.5">
        {teacher.assigned_classes.length ? (
          <span className="flex flex-wrap gap-1.5">
            {teacher.assigned_classes.map((item) => (
              <span key={item.assignment_id} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {item.name}
                {item.assignment_role === "assistant" ? <span className="text-[10px] font-bold uppercase text-slate-400">asst</span> : null}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-400">—</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">
        {teacher.assigned_levels.length ? teacher.assigned_levels.map(teacherLevelLabel).join(", ") : "—"}
      </td>
      <td className="px-5 py-3.5">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", curriculum.tone)}>
          {curriculumStatus(teacher) === "partial" || curriculumStatus(teacher) === "missing" ? (
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          ) : null}
          {curriculum.label}
        </span>
      </td>
      <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{formatDate(teacher.joined_at)}</td>
      <td className="px-5 py-3.5 text-right">
        <RowMenu teacher={teacher} invited={invited} onAction={onAction} />
      </td>
    </tr>
  );
}

function RowMenu({ teacher, invited, onAction }: { teacher: SchoolTeacher; invited: boolean; onAction: (action: TeacherRowAction, teacher: SchoolTeacher) => void }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const items: Array<{ action: TeacherRowAction; label: string; icon: typeof UserPlus; destructive?: boolean }> = invited
    ? [
        { action: "resend", label: "Resend invitation", icon: MailCheck },
        { action: "cancel", label: "Cancel invitation", icon: UserMinus, destructive: true },
      ]
    : [
        { action: "view", label: "View teacher details", icon: MoreHorizontal },
        {
          action: teacher.assigned_classes.length ? "edit" : "assign",
          label: teacher.assigned_classes.length ? "Edit assignment" : "Assign classes",
          icon: UserPlus,
        },
        { action: "remove", label: "Remove from school", icon: UserMinus, destructive: true },
      ];

  return (
    <div ref={container} className="relative inline-block text-left">
      <Button
        size="icon"
        variant="ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${invited ? teacher.email : teacher.full_name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.action}
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); onAction(item.action, teacher); }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-semibold hover:bg-slate-50",
                  item.destructive ? "text-rose-600 hover:bg-rose-50" : "text-slate-700",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
