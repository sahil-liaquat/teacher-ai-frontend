import Link from "next/link";
import { AlertCircle, ArrowLeft, BookOpen, Loader2, Sparkles } from "lucide-react";

export function WorkspaceSkeleton({ rows = 3 }: { rows?: number }) {
  return <div className="workspace-command-centre mx-auto w-full max-w-[1240px] space-y-5 rounded-[24px] px-3 py-6 sm:px-6"><div className="h-9 w-52 animate-pulse rounded-xl bg-[#dffafa]" /><div className="h-64 animate-pulse rounded-[20px] bg-[#f5f7fb]" />{Array.from({ length: rows }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-[#f5f7fb]" />)}</div>;
}

export function WorkspaceMissionSkeleton() {
  return (
    <div className="workspace-command-centre mx-auto w-full max-w-[1280px] space-y-5 rounded-[24px] px-3 py-6 sm:px-6 sm:py-8 lg:px-8" aria-label="Loading workspace">
      <div className="flex animate-pulse items-center justify-between gap-4">
        <div><div className="h-8 w-48 rounded-xl bg-blue-100" /><div className="mt-3 h-4 w-72 max-w-full rounded-lg bg-slate-100" /></div>
        <div className="hidden h-11 w-36 rounded-xl bg-slate-100 sm:block" />
      </div>
      <div className="animate-pulse rounded-[24px] border border-white bg-white/70 p-4 shadow-[0_20px_50px_rgba(30,50,80,0.08)] sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_230px]">
          <div className="h-72 rounded-[20px] bg-slate-100/90" />
          <div className="rounded-[20px] bg-slate-50 p-4"><div className="h-5 w-36 rounded-lg bg-slate-200" /><div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-[188px] rounded-[20px] bg-white" />)}</div></div>
          <div className="h-72 rounded-[20px] bg-blue-50" />
        </div>
      </div>
      <div className="h-28 animate-pulse rounded-[24px] bg-violet-50" />
      <div className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
    </div>
  );
}

export function WorkspaceError({ title = "Workspace could not be loaded", onRetry, backHref = "/dashboard/my-workspace", backLabel = "Workspace" }: { title?: string; onRetry: () => void; backHref?: string; backLabel?: string }) {
  return <div className="workspace-command-centre mx-auto grid min-h-[55vh] max-w-[720px] place-items-center rounded-[24px] px-5 text-center"><div className="rounded-[20px] border border-[#eceef3] bg-white p-8 shadow-[0_10px_30px_rgba(30,50,80,0.06)]"><span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-[#ffd9de] text-rose-700"><AlertCircle className="h-7 w-7" /></span><h1 className="mt-5 text-xl font-black text-slate-900">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">Your saved work is safe. Try loading this view again.</p><div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><Link href={backHref} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#eceef3] bg-white px-5 text-sm font-bold text-slate-600 hover:border-blue-200 hover:text-[#1677ff]"><ArrowLeft className="h-4 w-4" />Back to {backLabel}</Link><button type="button" onClick={onRetry} className="h-11 rounded-xl bg-[#1677ff] px-5 text-sm font-bold text-white hover:bg-[#0969e8]">Try again</button></div></div></div>;
}

export function WorkspaceEmpty({ title, description }: { title: string; description: string }) {
  return <div className="rounded-[20px] border border-[#eceef3] bg-white px-5 py-12 text-center shadow-[0_8px_24px_rgba(30,50,80,0.05)]"><span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-[#dffafa] text-[#1677ff]"><BookOpen className="h-7 w-7" /></span><h2 className="mt-5 text-xl font-black text-slate-900">{title}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{description}</p><div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row"><Link href="/dashboard/textbooks" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1677ff] px-5 text-sm font-bold text-white hover:bg-[#0969e8]"><Sparkles className="h-4 w-4" />Choose a Chapter</Link><Link href="/dashboard/lesson-plans/new" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#eceef3] bg-white px-5 text-sm font-bold text-slate-700">Create a Lesson Plan</Link></div></div>;
}

export function InlineBusy({ label = "Saving" }: { label?: string }) {
  return <span className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600"><Loader2 className="h-3.5 w-3.5 animate-spin" />{label}</span>;
}
