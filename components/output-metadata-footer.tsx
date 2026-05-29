import { BookOpen, Download, FileText, FlaskConical, GraduationCap } from "lucide-react";

function formatFooterValue(value?: string | number | null) {
  const text = String(value ?? "").trim();
  return text || "Not specified";
}

function formatFooterDate(value?: string | null) {
  if (!value) return new Date().toLocaleDateString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString();
  return date.toLocaleDateString();
}

export function OutputMetadataFooter({
  subject,
  grade,
  chapter,
  source,
  generatedAt
}: {
  subject?: string | number | null;
  grade?: string | number | null;
  chapter?: string | number | null;
  source?: string | number | null;
  generatedAt?: string | null;
}) {
  const items = [
    { label: "Subject", value: subject, icon: FlaskConical },
    { label: "Grade", value: grade, icon: GraduationCap },
    { label: "Chapter", value: chapter, icon: BookOpen },
    { label: "Source", value: source, icon: FileText },
    { label: "Generated on", value: formatFooterDate(generatedAt), icon: Download }
  ];

  return (
    <footer className="mt-10 border-t border-slate-300 pt-3 font-sans">
      <div className="grid gap-3 text-xs font-bold text-slate-500 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex min-w-0 items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-slate-500" />
              <p className="min-w-0 truncate">
                {item.label}: <span className="ml-1 text-slate-600">{formatFooterValue(item.value)}</span>
              </p>
            </div>
          );
        })}
      </div>
    </footer>
  );
}
