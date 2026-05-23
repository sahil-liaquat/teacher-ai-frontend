import type { ComponentType } from "react";
import { Award, CheckCircle2, Clock3, Users } from "lucide-react";

const stats = [
  { label: "Students Joined", value: "24", icon: Users, tone: "bg-[#dffafa] text-teachpad-blue" },
  { label: "Submitted", value: "18", icon: CheckCircle2, tone: "bg-[#ecfff7] text-[#0b7f53]" },
  { label: "Average Score", value: "7.4/10", icon: Clock3, tone: "bg-[#fff0bf] text-[#b97800]" },
  { label: "Highest Score", value: "10/10", icon: Award, tone: "bg-[#ffd9de] text-[#eb3b5a]" }
];

export function QuizStatsCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => <StatCard key={item.label} {...item} />)}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: ComponentType<{ className?: string }>; tone: string }) {
  return (
    <div className="rounded-[18px] border border-teachpad-cardBorder bg-white p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-teachpad-muted">{label}</p>
          <p className="mt-2 text-2xl font-black text-teachpad-ink">{value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
