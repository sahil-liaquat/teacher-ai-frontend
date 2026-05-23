"use client";

import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuizQuestion } from "./quiz-data";

export function QuizQuestionCard({
  question,
  index,
  onEdit,
  onDelete
}: {
  question: QuizQuestion;
  index: number;
  onEdit: (question: QuizQuestion) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="rounded-[18px] border border-teachpad-cardBorder bg-white p-4 shadow-[0_12px_28px_var(--teachpad-shadowCard)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-[#ffe1d2] bg-[#fffaf0] text-[#e57820]">Question {index + 1}</Badge>
            <Badge className="border-[#dffafa] bg-[#f8ffff] text-teachpad-blue">{question.type}</Badge>
            <Badge className="border-[#ecfff7] bg-[#ecfff7] text-[#0b7f53]">{question.marks} mark</Badge>
          </div>
          <h3 className="mt-3 text-base font-black leading-6 text-teachpad-ink">{question.text}</h3>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onEdit(question)}>
            <Edit3 className="h-4 w-4" /> Edit
          </Button>
          <Button type="button" size="sm" variant="outline" className="text-[#eb3b5a] hover:border-[#ffd9de] hover:text-[#eb3b5a]" onClick={() => onDelete(question.id)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
      {question.options?.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {question.options.map((option) => (
            <div key={option} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${option === question.correctAnswer ? "border-[#c7f7ed] bg-[#ecfff7] text-[#0b7f53]" : "border-teachpad-cardBorder bg-[#f8ffff] text-teachpad-muted"}`}>
              {option}
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-4 rounded-xl border border-[#c7f7ed] bg-[#ecfff7] px-3 py-2 text-sm font-black text-[#0b7f53]">
        Correct answer: {question.correctAnswer}
      </div>
    </article>
  );
}
