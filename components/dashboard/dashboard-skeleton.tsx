import { cn } from "@/lib/utils";

export function DashboardSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-[1480px] gap-4 px-0 2xl:px-4 animate-pulse">
      {/* Header Skeleton */}
      <header className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-left space-y-2 py-1">
          <div className="h-8 w-64 rounded-xl bg-slate-200 sm:h-9" />
          <div className="h-4 w-48 rounded bg-slate-200" />
        </div>
        <div className="hidden h-12 w-[190px] shrink-0 items-center justify-end sm:flex sm:h-14 sm:w-[230px] lg:w-[260px]">
          <div className="h-8 w-36 rounded-lg bg-slate-200" />
        </div>
      </header>

      {/* Stats Cards Skeleton */}
      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="min-h-[116px] rounded-[18px] border border-white/70 bg-gradient-to-br from-slate-50 to-white p-4 sm:min-h-[126px] sm:p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
          >
            <div className="flex h-full items-center gap-3 sm:gap-4">
              <div className="h-14 w-14 shrink-0 rounded-[22px] bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-20 rounded bg-slate-200" />
                <div className="h-7 w-12 rounded bg-slate-200" />
                <div className="h-3 w-16 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Action Panels Skeleton */}
      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-4 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="min-h-[190px] rounded-[20px] border border-white/60 bg-gradient-to-br from-slate-50 to-white p-4 sm:min-h-[210px] sm:p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
          >
            <div className="flex h-full flex-col justify-between">
              <div className="space-y-3">
                <div className="h-14 w-14 rounded-[22px] bg-slate-200" />
                <div className="h-6 w-48 rounded-lg bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-200 max-w-sm" />
              </div>
              <div className="h-10 w-36 rounded-xl bg-slate-200 mt-4" />
            </div>
          </div>
        ))}
      </section>

      {/* Main Content Layout (Recent + Progress) Skeleton */}
      <section className="mx-auto grid w-full max-w-[1240px] items-stretch gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Recent Generations Skeleton */}
        <div className="h-full rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded bg-slate-200" />
            <div className="h-8 w-16 rounded-xl bg-slate-200" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-2 bg-slate-50/50">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-3 w-24 rounded bg-slate-200" />
                </div>
                <div className="h-6 w-16 rounded-lg bg-slate-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Progress Tracker Skeleton */}
        <div className="flex h-full flex-col rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 rounded bg-slate-200" />
          </div>

          <div className="grid flex-1 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            {/* Donut section */}
            <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 flex flex-col space-y-3">
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="flex-1 flex items-center justify-center gap-4">
                <div className="h-[100px] w-[100px] rounded-full border-[14px] border-slate-200 shrink-0" />
                <div className="space-y-2.5 flex-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-slate-200" />
                      <div className="h-3.5 w-16 rounded bg-slate-200" />
                      <div className="h-3.5 w-4 rounded bg-slate-200 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Generation Bar Section */}
            <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 flex flex-col space-y-3">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="flex-1 flex items-end justify-between gap-2 px-1 min-h-[96px]">
                {[30, 60, 45, 80, 50, 70, 90].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                    <div className="w-full max-w-[40px] rounded-t-lg bg-slate-200" style={{ height: `${h}%` }} />
                    <div className="h-3 w-6 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips / stats row */}
          <div className="grid gap-3 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="flex min-h-[88px] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-3.5 w-32 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access Skeleton */}
      <section className="mx-auto w-full max-w-[1240px] rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 rounded bg-slate-200" />
          <div className="h-8 w-24 rounded-xl bg-slate-200" />
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex min-h-[82px] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="h-3 w-28 rounded bg-slate-200" />
              </div>
              <div className="h-4 w-4 shrink-0 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
