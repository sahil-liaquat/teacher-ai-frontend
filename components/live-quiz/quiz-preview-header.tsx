import { BookOpen, Clock3, FileQuestion, GraduationCap, Medal } from "lucide-react";
import { quizSummary } from "./quiz-data";

const summaryItems = [
  { label: "Class", value: quizSummary.className, icon: GraduationCap },
  { label: "Subject", value: quizSummary.subject, icon: BookOpen },
  { label: "Questions", value: `${quizSummary.questions} Questions`, icon: FileQuestion },
  { label: "Time", value: quizSummary.timeLimit, icon: Clock3 },
  { label: "Marks", value: `${quizSummary.totalMarks} Marks`, icon: Medal }
];

export function QuizPreviewHeader() {
  return (
    <div className="rounded-[18px] border border-[#ffe1d2] bg-gradient-to-br from-[#fffaf0] to-white p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.12em] text-[#e57820]">Quiz Summary</p>
          <h2 className="mt-1 text-xl font-black text-teachpad-ink">{quizSummary.title}</h2>
          <p className="mt-1 text-sm font-semibold text-teachpad-muted">Chapter: {quizSummary.chapter}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-xl border border-[#ffe1d2] bg-white/80 px-3 py-2">
                <div className="flex items-center gap-2 text-[#e57820]">
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] font-black uppercase">{item.label}</span>
                </div>
                <p className="mt-1 whitespace-nowrap text-sm font-black text-teachpad-ink">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
