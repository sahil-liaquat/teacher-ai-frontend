import Link from "next/link";
import { ArrowLeft, Download, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveResultsTable } from "@/components/live-quiz/live-results-table";
import { QuestionAnalysisCard } from "@/components/live-quiz/question-analysis-card";
import { QuizStatsCards } from "@/components/live-quiz/quiz-stats-cards";

export default function LiveQuizResultsPage() {
  return (
    <div className="mx-auto grid max-w-[1180px] gap-4">
      <Link href="/dashboard/live-quiz" className="inline-flex w-fit items-center gap-1.5 text-sm font-black text-[#159565] transition hover:text-[#0f7a52]">
        <ArrowLeft className="h-4 w-4" />
        Back to quizzes
      </Link>
      <header className="rounded-[18px] border border-[#dffafa] bg-gradient-to-br from-[#f8ffff] via-white to-[#fffaf0] p-5 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[28px] font-black text-teachpad-ink sm:text-[34px]">Live Quiz Results</h1>
            <p className="mt-2 text-sm font-semibold text-teachpad-muted">Track student submissions and marks in real time.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button type="button" variant="outline"><Download className="h-4 w-4" /> Export CSV</Button>
            <Button type="button" className="bg-gradient-to-r from-[#ff8a3d] to-[#eb3b5a]"><FileText className="h-4 w-4" /> Export PDF</Button>
          </div>
        </div>
      </header>
      <QuizStatsCards />
      <LiveResultsTable />
      <QuestionAnalysisCard />
    </div>
  );
}
