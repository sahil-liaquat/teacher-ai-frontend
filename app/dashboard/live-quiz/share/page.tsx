import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuizShareCard } from "@/components/live-quiz/quiz-share-card";

export default function LiveQuizSharePage() {
  return (
    <div className="mx-auto grid max-w-[1120px] gap-3">
      <Link href="/dashboard/live-quiz/preview" className="inline-flex w-fit items-center gap-1.5 text-sm font-black text-[#e57820] transition hover:text-[#be5f11]">
        <ArrowLeft className="h-4 w-4" />
        Back to quiz review
      </Link>
      <QuizShareCard />
    </div>
  );
}
