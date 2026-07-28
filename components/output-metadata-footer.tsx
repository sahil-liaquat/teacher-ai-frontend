import { BookOpen, Download, FileText, FlaskConical, GraduationCap } from "lucide-react";

function formatFooterValue(value: string | number | null | undefined, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatFooterDate(value: string | null | undefined, locale?: string) {
  if (!value) return new Date().toLocaleDateString(locale);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString(locale);
  return date.toLocaleDateString(locale);
}

export function OutputMetadataFooter({
  subject,
  grade,
  chapter,
  source,
  generatedAt,
  labels,
  locale
}: {
  subject?: string | number | null;
  grade?: string | number | null;
  chapter?: string | number | null;
  source?: string | number | null;
  generatedAt?: string | null;
  labels?: Partial<{
    subject: string;
    grade: string;
    chapter: string;
    source: string;
    generatedOn: string;
    notSpecified: string;
  }>;
  locale?: string;
}) {
  const resolvedLabels = {
    subject: labels?.subject || "Subject",
    grade: labels?.grade || "Grade",
    chapter: labels?.chapter || "Chapter",
    source: labels?.source || "Source",
    generatedOn: labels?.generatedOn || "Generated on",
    notSpecified: labels?.notSpecified || "Not specified"
  };
  const items = [
    { label: resolvedLabels.subject, value: subject, icon: FlaskConical },
    { label: resolvedLabels.grade, value: grade, icon: GraduationCap },
    { label: resolvedLabels.chapter, value: chapter, icon: BookOpen },
    { label: resolvedLabels.source, value: source, icon: FileText },
    { label: resolvedLabels.generatedOn, value: formatFooterDate(generatedAt, locale), icon: Download }
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
                {item.label}: <span className="ml-1 text-slate-600">{formatFooterValue(item.value, resolvedLabels.notSpecified)}</span>
              </p>
            </div>
          );
        })}
      </div>
    </footer>
  );
}
