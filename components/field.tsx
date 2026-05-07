export function Field({
  label,
  children,
  error
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="grid gap-3">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-red-600 mt-0.5">{error}</span> : null}
    </label>
  );
}
