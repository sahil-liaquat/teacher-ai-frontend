"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Plus, Save, Send, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { dummyQuestions, publishQuiz, type QuizQuestion } from "@/components/live-quiz/quiz-data";
import { QuizPreviewHeader } from "@/components/live-quiz/quiz-preview-header";
import { QuizQuestionCard } from "@/components/live-quiz/quiz-question-card";
import { cn } from "@/lib/utils";

export default function QuizPreviewPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState(dummyQuestions);
  const [editing, setEditing] = useState<QuizQuestion | null>(null);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [publishing, setPublishing] = useState(false);

  function deleteQuestion(id: string) {
    if (!window.confirm("Delete this question?")) return;
    setQuestions((items) => items.filter((item) => item.id !== id));
    toast({ title: "Question deleted", description: "You can add another question anytime." });
  }

  function addQuestion() {
    setQuestions((items) => [...items, {
      id: `q${Date.now()}`,
      type: "MCQ",
      text: "Which of these is an exhaustible natural resource?",
      options: ["Coal", "Sunlight", "Air", "Wind"],
      correctAnswer: "Coal",
      marks: 1
    }]);
    toast({ title: "Question added", description: "A sample question was added." });
  }

  async function handlePublish() {
    setPublishing(true);
    await publishQuiz();
    setPublishing(false);
    window.location.href = "/dashboard/live-quiz/share";
  }

  return (
    <div className="mx-auto grid max-w-[1120px] gap-4 pb-40 lg:pb-24">
      <Link href="/dashboard/live-quiz/new" className="inline-flex w-fit items-center gap-1.5 text-sm font-black text-[#e57820] transition hover:text-[#be5f11]">
        <ArrowLeft className="h-4 w-4" />
        Back to quiz setup
      </Link>
      <header className="rounded-[18px] border border-[#ffe1d2] bg-gradient-to-br from-[#fffaf0] via-white to-[#ffe1d2] p-5 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
        <h1 className="text-[28px] font-black text-teachpad-ink sm:text-[34px]">Review Quiz</h1>
        <p className="mt-2 text-sm font-semibold text-teachpad-muted">Edit questions before publishing the live quiz.</p>
      </header>

      <QuizPreviewHeader />

      <section className="rounded-[18px] border border-teachpad-cardBorder bg-white p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-teachpad-ink">Generated Questions</h2>
            <p className="mt-1 text-sm font-semibold text-teachpad-muted">{questions.length} questions ready for review.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ToggleButton active={shuffleQuestions} onClick={() => setShuffleQuestions((value) => !value)} label="Shuffle questions" />
            <ToggleButton active={shuffleOptions} onClick={() => setShuffleOptions((value) => !value)} label="Shuffle options" />
            <Button type="button" variant="outline" onClick={addQuestion}><Plus className="h-4 w-4" /> Add Question</Button>
          </div>
        </div>
      </section>

      {questions.length ? (
        <div className="grid gap-3">
          {questions.map((question, index) => (
            <QuizQuestionCard key={question.id} question={question} index={index} onEdit={setEditing} onDelete={deleteQuestion} />
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-teachpad-cardBorder bg-white p-8 text-center shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
          <h2 className="text-xl font-black text-teachpad-ink">No questions yet.</h2>
          <p className="mt-2 text-sm font-semibold text-teachpad-muted">Add a question to continue.</p>
          <Button type="button" onClick={addQuestion} className="mt-4"><Plus className="h-4 w-4" /> Add Question</Button>
        </div>
      )}

      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-teachpad-cardBorder bg-white/94 px-4 py-3 shadow-[0_-12px_34px_rgba(30,80,90,0.10)] backdrop-blur lg:bottom-0 lg:left-24">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard/live-quiz/new"><Button type="button" variant="outline"><ArrowLeft className="h-4 w-4" /> Back to Setup</Button></Link>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => toast({ title: "Draft saved", description: "Your quiz draft is saved locally for now." })}>
              <Save className="h-4 w-4" /> Save as Draft
            </Button>
            <Button type="button" disabled={publishing || !questions.length} onClick={handlePublish} className="bg-gradient-to-r from-[#ff8a3d] to-[#eb3b5a]">
              <Send className="h-4 w-4" /> {publishing ? "Publishing..." : "Publish Live Quiz"}
            </Button>
          </div>
        </div>
      </div>

      {editing ? <EditModal question={editing} onClose={() => setEditing(null)} onSave={(next) => {
        setQuestions((items) => items.map((item) => item.id === next.id ? next : item));
        setEditing(null);
        toast({ title: "Question updated", description: "Changes are ready for publishing." });
      }} /> : null}
    </div>
  );
}

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} className={cn(active && "border-[#ffe1d2] bg-[#fffaf0] text-[#e57820]")}>
      <Shuffle className="h-4 w-4" /> {label}
    </Button>
  );
}

function EditModal({ question, onClose, onSave }: { question: QuizQuestion; onClose: () => void; onSave: (question: QuizQuestion) => void }) {
  const [text, setText] = useState(question.text);
  const [answer, setAnswer] = useState(question.correctAnswer);
  const [marks, setMarks] = useState(String(question.marks));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-teachpad-ink/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[620px] rounded-[22px] border border-teachpad-cardBorder bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-teachpad-ink">Edit Question</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-teachpad-tag text-teachpad-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-2"><span className="text-sm font-black text-teachpad-ink">Question</span><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} /></label>
          <label className="grid gap-2"><span className="text-sm font-black text-teachpad-ink">Correct Answer</span><Input value={answer} onChange={(e) => setAnswer(e.target.value)} /></label>
          <label className="grid gap-2"><span className="text-sm font-black text-teachpad-ink">Marks</span><Input value={marks} onChange={(e) => setMarks(e.target.value)} inputMode="numeric" /></label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => onSave({ ...question, text, correctAnswer: answer, marks: Number(marks) || 1 })}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
