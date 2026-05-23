"use client";

import Link from "next/link";
import { Copy, Eye, Plus, RadioTower } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { savedQuizzes } from "@/components/live-quiz/quiz-data";
import { StatusBadge } from "@/components/live-quiz/status-badge";

export default function SavedLiveQuizzesPage() {
  const { toast } = useToast();
  return (
    <div className="mx-auto grid max-w-[1180px] gap-4">
      <PageHeader
        title="Live Quizzes"
        description="Manage created quizzes, drafts, links, and class results."
        actions={<Link href="/dashboard/live-quiz/new"><Button><Plus className="h-4 w-4" /> Create New Quiz</Button></Link>}
      />
      <div className="grid gap-3">
        {savedQuizzes.map((quiz) => (
          <article key={quiz.id} className="rounded-[18px] border border-teachpad-cardBorder bg-white p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
            <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-teachpad-ink">{quiz.title}</h2>
                  <StatusBadge status={quiz.status} />
                </div>
                <p className="mt-1 text-sm font-semibold leading-6 text-teachpad-muted">
                  {[quiz.className, quiz.subject, quiz.chapter, `Created ${quiz.createdAt}`, `${quiz.attempts} attempts`].join(" • ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/live-quiz/preview"><Button type="button" variant="outline" size="sm"><Eye className="h-4 w-4" /> View</Button></Link>
                <Link href="/dashboard/live-quiz/results/abc123"><Button type="button" variant="outline" size="sm"><RadioTower className="h-4 w-4" /> Results</Button></Link>
                <Button type="button" variant="outline" size="sm" onClick={() => toast({ title: "Quiz link copied", description: "https://teachpad.in/quiz/abc123" })}>
                  <Copy className="h-4 w-4" /> Copy Link
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
