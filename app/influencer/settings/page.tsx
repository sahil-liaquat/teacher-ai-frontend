"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SettingsPage from "@/app/dashboard/settings/page";

export default function InfluencerSettingsPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-4">
        <Link
          href="/influencer"
          className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Influencer
        </Link>
      </div>
      <SettingsPage />
    </>
  );
}
