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
import { getErrorMessage } from "@/lib/errors";

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
    <section className="primary-student-profile rounded-[28px] border border-[#e8e7fb] bg-white p-6 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-50 pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-black text-[#171747]">{student.code}</h2>
          <p className="mt-1 text-[11px] font-bold text-[#6e41f5] uppercase tracking-wider">
            {data ? data.section_name : "Loading…"} · {formatTermLabel(range.start, range.end)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${student.code}'s profile`}
          className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex flex-col gap-1">
          <span>From</span>
          <input
            type="date"
            value={range.start}
            max={range.end}
            onChange={(event) => setRange({ ...range, start: event.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#171747] focus:border-[#6e41f5] focus:outline-none"
          />
        </label>
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex flex-col gap-1">
          <span>To</span>
          <input
            type="date"
            value={range.end}
            min={range.start}
            onChange={(event) => setRange({ ...range, end: event.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#171747] focus:border-[#6e41f5] focus:outline-none"
          />
        </label>
      </div>

      {profile.isLoading ? (
        <p className="mt-5 text-xs font-bold text-[#596083]">Loading observations…</p>
      ) : profile.isError ? (
        <div className="mt-5 rounded-2xl bg-[#faf9ff] border border-[#cfc8ef] p-6 text-center">
          <p className="text-xs font-bold text-[#6e41f5]">{getErrorMessage(profile.error, "Couldn't load this profile")}</p>
          <button
            type="button"
            onClick={() => void profile.refetch()}
            className="mt-3 rounded-xl bg-[#6e41f5] px-4 py-2 text-xs font-black text-white hover:bg-[#5731d8] transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : !data || data.observations_total === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-[#ecebf7] bg-[#faf9ff]/45 p-6 text-center text-xs font-bold text-slate-400">
          No observations recorded in this range. Open a day&rsquo;s activity and rate the children to start building a profile.
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
              <div key={label} className="rounded-2xl border border-[#e8e7fb] bg-white p-3 shadow-xs">
                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</dt>
                <dd className="mt-1 text-lg font-black text-[#171747]">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["not_yet", "emerging", "secure"] as ObservationRating[]).map((rating) => (
              <span
                key={rating}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[9px] font-black uppercase tracking-wider",
                  ratingTone(rating).chip,
                  ratingTone(rating).text,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", ratingTone(rating).dot)} />
                {RATING_LABELS[rating]}: {data[rating]}
              </span>
            ))}
          </div>

          <h3 className="mt-6 text-xs font-black text-[#171747] uppercase tracking-wider border-b border-slate-50 pb-2">By Skill</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-2.5 pr-3">Skill</th>
                  <th className="py-2.5 pr-3">Observations</th>
                  <th className="py-2.5 pr-3">Latest</th>
                  <th className="py-2.5">Direction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.skills.map((skill) => (
                  <tr key={skill.skill} className="hover:bg-[#faf9ff]/20">
                    <td className="py-3 pr-3 font-bold text-[#171747]">{skill.skill}</td>
                    <td className="py-3 pr-3 text-slate-500 font-medium">
                      {skill.observations} ({skill.not_yet}/{skill.emerging}/{skill.secure})
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                          ratingTone(skill.latest_rating).chip,
                          ratingTone(skill.latest_rating).text,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", ratingTone(skill.latest_rating).dot)} />
                        {RATING_LABELS[skill.latest_rating]}
                      </span>
                    </td>
                    <td className="py-3 text-xs font-bold text-slate-500">{TREND_LABELS[skill.trend]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 text-xs font-black text-[#171747] uppercase tracking-wider border-b border-slate-50 pb-2">Timeline</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {data.observations.map((observation) => (
              <li key={observation.id} className="flex flex-wrap items-start gap-4 py-3 hover:bg-[#faf9ff]/25 px-2 rounded-xl transition duration-150">
                <span className="w-24 shrink-0 text-xs font-bold text-slate-400">
                  {observation.date}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                    ratingTone(observation.rating).chip,
                    ratingTone(observation.rating).text,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", ratingTone(observation.rating).dot)} />
                  {RATING_LABELS[observation.rating]}
                </span>
                <span className="min-w-0 flex-1 text-xs text-slate-600 font-medium">
                  <strong className="text-[#171747] font-bold">{observation.skill || "General"}</strong>
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
