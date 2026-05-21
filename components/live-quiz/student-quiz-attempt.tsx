"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dummyQuestions, submitQuiz } from "./quiz-data";

export function StudentQuizAttempt() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const questions = dummyQuestions;
  const question = questions[current];
  const progress = useMemo(() => Math.round(((current + 1) / questions.length) * 100), [current, questions.length]);

  async function handleSubmit() {
    setSubmitting(true);
    await submitQuiz();
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[520px] items-center px-4 py-8">
        <div className="w-full rounded-[24px] border border-[#c7f7ed] bg-white p-6 text-center shadow-[0_18px_48px_rgba(30,80,90,0.10)]">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#0b7f53]" />
          <h1 className="mt-4 text-3xl font-black text-teachpad-ink">Your Score: 8/10</h1>
          <p className="mt-2 text-base font-bold text-teachpad-muted">Great work!</p>
          <Button type="button" className="mt-6 bg-gradient-to-r from-[#ff8a3d] to-[#eb3b5a]">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-[760px] px-4 py-5">
      <header className="sticky top-0 z-10 rounded-b-[20px] border border-[#ffe1d2] bg-white/95 p-4 shadow-[0_12px_28px_rgba(30,80,90,0.08)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#e57820]">Coal and Petroleum</p>
            <h1 className="text-lg font-black text-teachpad-ink">Class 8 Science Quiz</h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fffaf0] px-3 py-2 text-sm font-black text-[#e57820]">
            <Clock3 className="h-4 w-4" /> 09:42
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#fff0bf]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#eb3b5a]" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mt-5 rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_48px_rgba(30,80,90,0.08)]">
        <p className="text-sm font-black text-[#e57820]">Question {current + 1} of {questions.length}</p>
        <h2 className="mt-3 text-xl font-black leading-7 text-teachpad-ink">{question.text}</h2>
        {question.options?.length ? (
          <div className="mt-5 grid gap-3">
            {question.options.map((option) => {
              const active = answers[question.id] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswers((items) => ({ ...items, [question.id]: option }))}
                  className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-base font-bold transition ${active ? "border-[#eb3b5a] bg-[#fff7f8] text-[#eb3b5a] ring-4 ring-[#ffd9de]/60" : "border-teachpad-cardBorder bg-white text-teachpad-ink hover:border-[#ffe1d2] hover:bg-[#fffaf0]"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : (
          <textarea className="mt-5 min-h-32 w-full rounded-2xl border border-teachpad-cardBorder bg-teachpad-input p-4 text-base font-semibold outline-none focus:border-[#eb3b5a] focus:bg-white focus:ring-4 focus:ring-[#ffd9de]/60" placeholder="Type your answer here" />
        )}
      </main>

      <footer className="sticky bottom-0 mt-5 rounded-t-[20px] border border-teachpad-cardBorder bg-white/95 p-3 shadow-[0_-12px_28px_rgba(30,80,90,0.08)] backdrop-blur">
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={current === 0} onClick={() => setCurrent((index) => Math.max(0, index - 1))} className="flex-1">Previous</Button>
          {current === questions.length - 1 ? (
            <Button type="button" disabled={submitting} onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-[#ff8a3d] to-[#eb3b5a]">{submitting ? "Submitting..." : "Submit Quiz"}</Button>
          ) : (
            <Button type="button" onClick={() => setCurrent((index) => Math.min(questions.length - 1, index + 1))} className="flex-1 bg-gradient-to-r from-[#ff8a3d] to-[#eb3b5a]">Next</Button>
          )}
        </div>
      </footer>
    </div>
  );
}
