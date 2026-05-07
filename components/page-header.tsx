export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="reveal-card mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-start sm:justify-between 2xl:mb-8 2xl:gap-5 2xl:px-6 2xl:py-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-black tracking-tight text-slate-900 2xl:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 2xl:mt-3">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
