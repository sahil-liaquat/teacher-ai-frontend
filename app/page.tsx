"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  MessageSquare,
  Shield,
  Sparkles,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureSession, getCurrentUser } from "@/lib/api";

const tools = [
  {
    title: "Lesson Planner",
    description: "Create classroom-ready lesson plans with objectives, activities, assessments, and homework.",
    icon: BookOpen,
    href: "/dashboard/lesson-plans/new",
    color: "bg-teachpad-pink text-[#ff5c8a]",
    badge: "Featured"
  },
  {
    title: "Worksheet & Quiz Generator",
    description: "Create worksheets, quizzes, answer keys, and practice questions aligned with your topic.",
    icon: ClipboardCheck,
    href: "/dashboard/worksheets/new",
    color: "bg-teachpad-green text-[#8ec63f]",
    badge: "New"
  },
  {
    title: "Textbook Library",
    description: "Generate from selected books and chapters with strict textbook grounding.",
    icon: Shield,
    href: "/dashboard/textbooks",
    color: "bg-teachpad-mint text-[#1ec8b7]",
    badge: "Smart"
  },
  {
    title: "Saved Resources",
    description: "Save, edit, duplicate, download, and reuse classroom materials.",
    icon: FileText,
    href: "/dashboard/resources",
    color: "bg-teachpad-yellow text-[#f4b400]",
    badge: "Efficient"
  }
];

const features = [
  {
    icon: Brain,
    title: "Save hours of planning time",
    description: "Create usable teacher materials faster for everyday classroom work."
  },
  {
    icon: Shield,
    title: "Textbook-grounded outputs",
    description: "Keep generated facts tied to selected textbook chapters."
  },
  {
    icon: GraduationCap,
    title: "Built for Indian classrooms",
    description: "Plan lessons and assessments around local classroom needs."
  },
  {
    icon: Zap,
    title: "Simple tools for teaching",
    description: "Use focused workflows for lessons, worksheets, resources, and admin review."
  }
];

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    ensureSession()
      .then((hasSession) => hasSession ? getCurrentUser({ redirectOnUnauthorized: false }) : null)
      .then((user) => {
        if (!user || cancelled) return;
        router.replace(user.role === "admin" ? "/admin" : "/dashboard");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="teachpad-page min-h-screen">
      <header className="sticky top-0 z-50 border-b border-teachpad-cardBorder bg-white/92 shadow-[0_10px_28px_var(--teachpad-shadowCard)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-teachpad-blue to-blue-600 shadow-md">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-teachpad-ink">Teacher AI Tools</h1>
              <p className="text-xs font-semibold text-teachpad-muted">AI-Powered Education</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost">Login</Button></Link>
            <Link href="/signup"><Button>Signup</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[82vh] items-center overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white/60 to-teachpad-aqua" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-teachpad-blue shadow-sm">
              <Sparkles className="h-4 w-4" />
              Textbook-grounded AI for teachers
            </div>
            <h2 className="max-w-4xl text-5xl font-black leading-tight tracking-tight text-teachpad-ink md:text-6xl">
              Create textbook-based lesson plans and worksheets in minutes.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-teachpad-muted">
              Upload textbooks, index chapters, generate grounded teaching resources, save outputs, and manage admin visibility from one polished SaaS workspace.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/signup">
                <Button className="h-12 px-8">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="h-12 px-8">
                  Try local demo
                </Button>
              </Link>
            </div>
          </div>

          <Card className="relative">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="teachpad-icon-tile flex h-12 w-12 items-center justify-center bg-teachpad-pink text-[#ff5c8a]">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-teachpad-ink">Grounded generation flow</CardTitle>
                  <p className="mt-1 text-sm text-teachpad-muted">Teacher-ready resources in four steps</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {["Select textbook", "Choose chapter", "Generate resource", "Save and export"].map((step, index) => (
                <div key={step} className="premium-hover-sm flex items-center gap-4 rounded-lg border border-teachpad-cardBorder bg-teachpad-panel p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teachpad-blue to-blue-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-teachpad-ink">{step}</p>
                    <p className="mt-0.5 text-xs text-teachpad-muted">Designed for classroom workflows</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 text-center">
          <h3 className="text-3xl font-black text-teachpad-ink">Smart teaching tools</h3>
          <p className="mt-3 text-teachpad-muted">A focused workspace for generating, reviewing, and reusing classroom materials.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.title} className="group">
                <CardHeader>
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-lg ${tool.color} shadow-md transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg font-black text-teachpad-ink">{tool.title}</CardTitle>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-teachpad-blue">{tool.badge}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-teachpad-muted">{tool.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="premium-hover rounded-lg border border-teachpad-cardBorder bg-white/88 p-6 shadow-sm backdrop-blur-sm">
                <Icon className="h-7 w-7 text-teachpad-blue" />
                <h4 className="mt-4 text-base font-black text-teachpad-ink">{feature.title}</h4>
                <p className="mt-2 text-sm leading-6 text-teachpad-muted">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
