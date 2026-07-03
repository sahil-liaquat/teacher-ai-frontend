import { cn } from "@/lib/utils";

export function InfluencerSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-4 animate-pulse">
      {/* Header & Metrics Panel Skeleton */}
      <div className="overflow-visible rounded-[18px] border border-slate-100 bg-white/86 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm">
        <header className="relative min-h-[132px] overflow-hidden rounded-t-[18px] border-b border-slate-100 bg-gradient-to-br from-[#fff7f8] via-white to-[#fff1f7] px-4 py-4 sm:min-h-[154px] sm:px-6 sm:py-5 space-y-3">
          <div className="h-6 w-32 rounded-full bg-slate-200" />
          <div className="h-9 w-64 rounded-xl bg-slate-200 sm:h-10" />
          <div className="h-4 w-full rounded bg-slate-200 max-w-lg" />
        </header>

        {/* 5-Column Metrics Row Skeleton */}
        <div className="p-4 sm:p-5">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:gap-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="min-h-[116px] rounded-[18px] border border-white/70 bg-gradient-to-br from-slate-50 to-white p-4 sm:min-h-[126px] sm:p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
              >
                <div className="flex h-full items-center gap-3 sm:gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-200 sm:h-14 sm:w-14" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 rounded bg-slate-200" />
                    <div className="h-7 w-20 rounded bg-slate-200" />
                    <div className="h-3 w-20 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Two Column Grid Skeleton */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.9fr)]">
        {/* Left Column: Commission Ledger Skeleton */}
        <section className="h-full min-w-0 overflow-hidden rounded-[18px] border border-slate-100 bg-white/86 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-br from-[#fff7f8] to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="space-y-1">
              <div className="h-5 w-36 rounded bg-slate-200" />
              <div className="h-3.5 w-64 rounded bg-slate-200" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-28 rounded-xl bg-slate-200" />
              <div className="h-10 w-44 rounded-xl bg-slate-200" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Mock Table Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              {[0, 1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 w-16 rounded bg-slate-200" />
              ))}
            </div>
            {/* Mock Table Rows */}
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center justify-between py-3 border-b border-slate-50">
                <div className="space-y-1">
                  <div className="h-4 w-28 rounded bg-slate-200" />
                  <div className="h-3 w-36 rounded bg-slate-200" />
                </div>
                <div className="h-4 w-12 rounded bg-slate-200" />
                <div className="h-6 w-16 rounded-full bg-slate-200" />
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Payout Ledger Skeleton */}
        <section className="h-full min-w-0 overflow-hidden rounded-[18px] border border-slate-100 bg-white/86 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-[#f6f1ff] to-white px-4 py-4 sm:px-5 space-y-1">
            <div className="h-5 w-28 rounded bg-slate-200" />
            <div className="h-3.5 w-44 rounded bg-slate-200" />
          </div>
          <div className="grid gap-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-slate-50 bg-white/55 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3 flex-1">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
                    <div className="min-w-0 space-y-2 flex-1">
                      <div className="h-4 w-32 rounded bg-slate-200" />
                      <div className="h-3 w-24 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-5 w-16 rounded bg-slate-200 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
