"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StudentJoinForm() {
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] items-center px-4 py-8">
      <div className="w-full rounded-[24px] border border-[#ffe1d2] bg-white p-5 shadow-[0_18px_48px_rgba(30,80,90,0.10)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#fff0bf] text-[#e57820]">
          <GraduationCap className="h-8 w-8" />
        </div>
        <div className="mt-5 text-center">
          <h1 className="text-2xl font-black text-teachpad-ink">Class 8 Science Quiz</h1>
          <p className="mt-2 text-sm font-semibold text-teachpad-muted">Coal and Petroleum</p>
        </div>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-black text-teachpad-ink">Your Name</span>
            <Input placeholder="Enter your name" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-teachpad-ink">Roll Number</span>
            <Input placeholder="Optional" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-teachpad-ink">Section</span>
            <Input placeholder="Optional" />
          </label>
          <Button type="button" onClick={() => router.push("/quiz/abc123/start")} className="h-12 bg-gradient-to-r from-[#ff8a3d] to-[#eb3b5a] text-base">
            <Play className="h-5 w-5" /> Start Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
