import { questionAnalysis } from "./quiz-data";

export function QuestionAnalysisCard() {
  return (
    <section className="rounded-[18px] border border-teachpad-cardBorder bg-white p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
      <h2 className="text-lg font-black text-teachpad-ink">Question Analysis</h2>
      <p className="mt-1 text-sm font-semibold text-teachpad-muted">See where students need more support.</p>
      <div className="mt-4 grid gap-3">
        {questionAnalysis.map((item) => (
          <article key={item.question} className="rounded-2xl border border-teachpad-cardBorder bg-[#fffafa] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="font-black text-teachpad-ink">{item.question}</h3>
                <p className="mt-1 text-sm font-semibold text-teachpad-muted">Most selected wrong option: {item.wrongOption}</p>
              </div>
              <div className="grid min-w-[220px] gap-2">
                <div className="flex justify-between text-xs font-black text-teachpad-muted">
                  <span>Correct {item.correct}%</span>
                  <span>Wrong {item.wrong}%</span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-[#ffd9de]">
                  <div className="bg-[#1fbc79]" style={{ width: `${item.correct}%` }} />
                  <div className="bg-[#eb3b5a]" style={{ width: `${item.wrong}%` }} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
