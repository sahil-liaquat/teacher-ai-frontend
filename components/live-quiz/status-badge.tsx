import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuizStatus, StudentStatus } from "./quiz-data";

type Status = QuizStatus | StudentStatus;

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      className={cn(
        "font-black",
        status === "Published" || status === "Submitted"
          ? "border-[#c7f7ed] bg-[#ecfff7] text-[#0b7f53]"
          : status === "In Progress" || status === "Draft"
            ? "border-[#fff0bf] bg-[#fffaf0] text-[#b97800]"
            : "border-[#ffd9de] bg-[#fff7f8] text-[#eb3b5a]"
      )}
    >
      {status}
    </Badge>
  );
}
