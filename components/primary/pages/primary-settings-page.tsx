"use client";

import { usePrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { Shield, User } from "lucide-react";

// V2 Settings Page

export default function PrimarySettingsPage() {
  const { context } = usePrimaryTeachingContext();

  return (
    <div className="primary-workspace-page space-y-6">
      <div className="primary-page-header">
        <h2 className="text-3xl font-black tracking-tight text-[#171747]">Primary Settings</h2>
        <p className="mt-1 text-xs font-semibold text-[#596083]">Review your teaching context and workspace information.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="primary-card p-5">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <User className="h-5 w-5 text-blue-500" /> Teaching Persona
          </h3>
          <div className="mt-4 space-y-3">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Current Grade Level:</span> {context.level}
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Learning Area:</span> {context.subject}
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Instructional Language:</span> {context.language}
            </div>
          </div>
        </section>

        <section className="primary-card p-5">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <Shield className="h-5 w-5 text-indigo-500" /> System Information
          </h3>
          <p className="mt-2 text-xs text-slate-500 leading-normal">
            Your teaching context is synchronized to the secure TeachPad cloud repository. All generation modules comply with NEP 2020 pedagogical guidelines.
          </p>
        </section>
      </div>
    </div>
  );
}
