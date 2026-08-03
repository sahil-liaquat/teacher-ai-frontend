"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { backendApi, type PrimaryStudent } from "@/lib/api";
import {
  RATING_LABELS,
  TREND_LABELS,
  defaultTermRange,
  formatTermLabel,
  ratingTone,
  type ObservationRating,
} from "@/lib/primary-roster";
import { cn } from "@/lib/utils";

export default function PrimaryStudentProfilePanel({
  student,
  onClose,
}: {
  student: PrimaryStudent;
  onClose: () => void;
}) {
  const [range, setRange] = useState(() => defaultTermRange(new Date()));

  const profile = useQuery({
    queryKey: ["primary-student-profile", student.id, range.start, range.end],
    queryFn: () => backendApi.primaryStudentProfile(student.id, range.start, range.end),
  });

  const data = profile.data;

  return (
    <section className="primary-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">{student.code}</h2>
          <p className="mt-0.5 text-[11px] font-bold text-[#454c86]">
            {data ? data.section_name : "Loading…"} · {formatTermLabel(range.start, range.end)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${student.code}'s profile`}
          className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">
          From
          <input
            type="date"
            value={range.start}
            max={range.end}
            onChange={(event) => setRange({ ...range, start: event.target.value })}
            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="text-xs font-bold text-slate-600">
          To
          <input
            type="date"
            value={range.end}
            min={range.start}
            onChange={(event) => setRange({ ...range, end: event.target.value })}
            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>

      {profile.isLoading ? (
        <p className="mt-4 text-sm font-medium text-[#454c86]">Loading observations…</p>
      ) : profile.isError ? (
        <div className="mt-4 rounded-2xl bg-[#f7f4ff] p-6 text-center">
          <p className="text-sm font-extrabold text-[#2f377e]">Couldn&rsquo;t load this profile</p>
          <button
            type="button"
            onClick={() => void profile.refetch()}
            className="mt-3 rounded-xl bg-[#1677ff] px-4 py-2 text-xs font-bold text-white"
          >
            Try again
          </button>
        </div>
      ) : !data || data.observations_total === 0 ? (
        <p className="mt-4 rounded-2xl bg-[#f7f4ff] p-6 text-center text-sm font-medium text-[#454c86]">
          No observations recorded in this range. Open a day&rsquo;s activity and rate the children
          to start building a profile.
        </p>
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Observations", `${data.observations_total}`],
              ["Days observed", `${data.days_observed}`],
              ["Activities observed", `${data.activities_observed}`],
              ["Secure", `${data.secure_pct}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#e8e7fb] bg-white p-3">
                <dt className="text-[11px] font-bold text-[#454c86]">{label}</dt>
                <dd className="mt-1 text-xl font-extrabold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["not_yet", "emerging", "secure"] as ObservationRating[]).map((rating) => (
              <span
                key={rating}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold",
                  ratingTone(rating).chip,
                  ratingTone(rating).text,
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", ratingTone(rating).dot)} />
                {RATING_LABELS[rating]}: {data[rating]}
              </span>
            ))}
          </div>

          <h3 className="mt-6 text-sm font-extrabold text-slate-900">By skill</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="text-[11px] font-bold text-[#454c86]">
                  <th className="py-2 pr-3">Skill</th>
                  <th className="py-2 pr-3">Observations</th>
                  <th className="py-2 pr-3">Latest</th>
                  <th className="py-2">Direction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceaff]">
                {data.skills.map((skill) => (
                  <tr key={skill.skill}>
                    <td className="py-2 pr-3 font-bold text-slate-900">{skill.skill}</td>
                    <td className="py-2 pr-3 text-[#454c86]">
                      {skill.observations} ({skill.not_yet}/{skill.emerging}/{skill.secure})
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-bold",
                          ratingTone(skill.latest_rating).chip,
                          ratingTone(skill.latest_rating).text,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", ratingTone(skill.latest_rating).dot)} />
                        {RATING_LABELS[skill.latest_rating]}
                      </span>
                    </td>
                    <td className="py-2 font-bold text-[#454c86]">{TREND_LABELS[skill.trend]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 text-sm font-extrabold text-slate-900">Timeline</h3>
          <ul className="mt-2 divide-y divide-[#eceaff]">
            {data.observations.map((observation) => (
              <li key={observation.id} className="flex flex-wrap items-start gap-3 py-3">
                <span className="w-24 shrink-0 text-[11px] font-bold text-[#454c86]">
                  {observation.date}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold",
                    ratingTone(observation.rating).chip,
                    ratingTone(observation.rating).text,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", ratingTone(observation.rating).dot)} />
                  {RATING_LABELS[observation.rating]}
                </span>
                <span className="min-w-0 flex-1 text-xs text-slate-700">
                  <b className="text-slate-900">{observation.skill || "General"}</b>
                  {observation.note ? ` — ${observation.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
