"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ClipboardList, LoaderCircle, RadioTower, Settings2, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { generateQuiz } from "@/components/live-quiz/quiz-data";
import { cn } from "@/lib/utils";

const questionTypes = ["MCQ", "True/False", "Fill in the blanks", "Short Answer"];

export default function CreateLiveQuizPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(["MCQ"]);
  const [askRoll, setAskRoll] = useState(false);
  const [showMarks, setShowMarks] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  function toggleType(type: string) {
    setSelectedTypes((items) => items.includes(type) ? items.filter((item) => item !== type) : [...items, type]);
  }

  async function handleGenerate() {
    setLoading(true);
    await generateQuiz();
    toast({ title: "Quiz generated", description: "Review questions before publishing." });
    router.push("/dashboard/live-quiz/preview");
  }

  if (loading) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-[720px] place-items-center">
        <div className="w-full rounded-[24px] border border-[#ffe9a8] bg-white p-8 text-center shadow-[0_18px_48px_var(--teachpad-shadowCard)]">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-[#d99a00]" />
          <h1 className="mt-5 text-2xl font-black text-teachpad-ink">Creating your live quiz from the selected textbook...</h1>
          <p className="mt-2 text-sm font-semibold text-teachpad-muted">Preparing questions, marks, and live sharing settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="overflow-hidden rounded-[18px] border border-[#ffe9a8] bg-white shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
        <header className="relative min-h-[180px] overflow-hidden border-b border-[#ffe9a8] bg-gradient-to-br from-[#fff9df] via-white to-[#fff0bf] px-5 py-6 sm:px-6">
          <div className="relative z-10 max-w-[620px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ffe9a8] bg-white/80 px-3 py-1.5 text-xs font-black text-[#b97800] shadow-sm">
              <RadioTower className="h-4 w-4" /> Live classroom quiz
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-teachpad-ink sm:text-[34px]">Live Quiz Generator</h1>
            <p className="mt-2.5 max-w-[560px] text-sm font-semibold leading-6 text-teachpad-muted">
              Generate textbook-based quizzes and share them with students instantly.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white/80 to-transparent" />
            <img
              src="/assets/illustrations/live-quiz-header.png"
              alt=""
              aria-hidden="true"
              className="absolute -bottom-3 right-4 w-[300px] select-none object-contain drop-shadow-[0_18px_18px_rgba(185,120,0,0.16)] xl:right-6 xl:w-[360px]"
            />
          </div>
        </header>

        <div className="grid gap-4 p-4 sm:p-5">
          <Section icon={BookOpen} title="Quiz Source" subtitle="Choose where the quiz should come from.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Board / Curriculum"><Select defaultValue="CBSE"><option>CBSE</option><option>ICSE</option><option>State Board</option></Select></Field>
              <Field label="Class / Grade"><Select defaultValue="Class 8"><option>Class 8</option><option>Class 7</option><option>Class 9</option></Select></Field>
              <Field label="Subject"><Select defaultValue="Science"><option>Science</option><option>Mathematics</option><option>Social Science</option></Select></Field>
              <Field label="Textbook"><Select defaultValue="NCERT Science"><option>NCERT Science</option><option>Science Companion</option></Select></Field>
              <Field label="Chapter"><Select defaultValue="Coal and Petroleum"><option>Coal and Petroleum</option><option>Combustion and Flame</option></Select></Field>
              <Field label="Topic"><Input defaultValue="Coal and Petroleum" placeholder="Type a topic" /></Field>
            </div>
          </Section>

          <Section icon={Settings2} title="Quiz Settings" subtitle="Set question format, time, and marks.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Number of Questions"><Select defaultValue="10"><option>5</option><option>10</option><option>15</option><option>20</option></Select></Field>
              <Field label="Difficulty"><Select defaultValue="Medium"><option>Easy</option><option>Medium</option><option>Hard</option></Select></Field>
              <Field label="Time Limit"><Select defaultValue="10 minutes"><option>5 minutes</option><option>10 minutes</option><option>15 minutes</option><option>20 minutes</option></Select></Field>
              <Field label="Marks per Question"><Select defaultValue="1"><option>1</option><option>2</option><option>3</option><option>5</option></Select></Field>
            </div>
            <div className="mt-4">
              <p className="mb-3 text-sm font-black text-teachpad-ink">Question Type</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {questionTypes.map((type) => (
                  <button key={type} type="button" onClick={() => toggleType(type)} className={cn("min-h-12 rounded-xl border px-3 text-left text-sm font-black transition", selectedTypes.includes(type) ? "border-[#f3c84b] bg-[#fff9df] text-[#b97800] ring-4 ring-[#ffe9a8]/60" : "border-teachpad-cardBorder bg-white text-teachpad-muted hover:border-[#ffe9a8]")}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section icon={Users} title="Student Settings" subtitle="Choose what students see before and after the quiz.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Toggle label="Ask student name" active onClick={() => {}} locked />
              <Toggle label="Ask roll number" active={askRoll} onClick={() => setAskRoll((value) => !value)} />
              <Toggle label="Show marks after submission" active={showMarks} onClick={() => setShowMarks((value) => !value)} />
              <Toggle label="Show correct answers" active={showAnswers} onClick={() => setShowAnswers((value) => !value)} />
            </div>
          </Section>

          <div className="rounded-xl border border-[#ffe9a8] bg-[#fff9df] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-black text-teachpad-ink">Generate live quiz</p>
                <p className="mt-1 text-sm font-semibold text-teachpad-muted">Class 8 Science • Coal and Petroleum • 10 questions</p>
              </div>
              <Button type="button" onClick={handleGenerate} className="bg-gradient-to-r from-[#f6c945] to-[#f0a22f] text-[#3d2a00] hover:from-[#efbd22] hover:to-[#e89618] sm:min-w-[190px]">
                <Sparkles className="h-5 w-5" /> Generate Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[16px] border border-teachpad-cardBorder bg-white p-4 shadow-[0_10px_24px_rgba(30,80,90,0.04)]">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fff0bf] text-[#b97800]"><Icon className="h-5 w-5" /></span>
        <div>
          <h2 className="text-base font-black text-teachpad-ink">{title}</h2>
          <p className="text-sm font-semibold text-teachpad-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2"><span className="text-sm font-black text-teachpad-ink">{label}</span>{children}</label>;
}

function Toggle({ label, active, locked, onClick }: { label: string; active: boolean; locked?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={locked} onClick={onClick} className={cn("flex min-h-12 items-center justify-between rounded-xl border px-3 text-left text-sm font-black transition disabled:cursor-not-allowed", active ? "border-[#f3c84b] bg-[#fff9df] text-[#8a5c00]" : "border-teachpad-cardBorder bg-white text-teachpad-muted hover:border-[#ffe9a8]")}>
      {label}
      <span className={cn("h-6 w-11 rounded-full p-1 transition", active ? "bg-[#f0a22f]" : "bg-slate-200")}>
        <span className={cn("block h-4 w-4 rounded-full bg-white transition", active && "translate-x-5")} />
      </span>
    </button>
  );
}
