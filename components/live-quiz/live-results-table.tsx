"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { studentResults } from "./quiz-data";
import { StatusBadge } from "./status-badge";

export function LiveResultsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return studentResults.filter((row) => {
      const statusMatch = status === "All" || row.status === status;
      const searchMatch = !term || row.name.toLowerCase().includes(term) || row.rollNo.toLowerCase().includes(term);
      return statusMatch && searchMatch;
    });
  }, [search, status]);

  return (
    <section className="rounded-[18px] border border-teachpad-cardBorder bg-white p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-teachpad-ink">Live Student Submissions</h2>
          <p className="mt-1 text-sm font-semibold text-teachpad-muted">Track marks and progress as students submit.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,240px)_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teachpad-muted" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student" className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option>Submitted</option>
            <option>In Progress</option>
            <option>Not Submitted</option>
          </Select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-teachpad-cardBorder text-xs font-black uppercase tracking-[0.1em] text-teachpad-muted">
              <th className="py-3 pr-4">Student Name</th>
              <th className="py-3 pr-4">Roll No.</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Score</th>
              <th className="py-3 pr-4">Time Taken</th>
              <th className="py-3">Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.name}-${row.rollNo}`} className="border-b border-teachpad-cardBorder last:border-0">
                <td className="py-3 pr-4 text-sm font-black text-teachpad-ink">{row.name}</td>
                <td className="py-3 pr-4 text-sm font-semibold text-teachpad-muted">{row.rollNo}</td>
                <td className="py-3 pr-4"><StatusBadge status={row.status} /></td>
                <td className="py-3 pr-4 text-sm font-black text-teachpad-ink">{row.score || "-"}</td>
                <td className="py-3 pr-4 text-sm font-semibold text-teachpad-muted">{row.timeTaken || "-"}</td>
                <td className="py-3 text-sm font-semibold text-teachpad-muted">{row.submittedAt || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <p className="mt-4 rounded-xl bg-[#f8ffff] px-4 py-3 text-sm font-semibold text-teachpad-muted">No students match this filter.</p> : null}
    </section>
  );
}
