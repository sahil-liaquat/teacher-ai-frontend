import Link from "next/link";
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

const tools = [
  {
    title: "Lesson Planner",
    description: "Create classroom-ready lesson plans with objectives, activities, assessments, and homework.",
    icon: BookOpen,
    href: "/dashboard/lesson-plans/new",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    badge: "Featured"
  },
  {
    title: "Worksheet & Quiz Generator",
    description: "Create worksheets, quizzes, answer keys, and practice questions aligned with your topic.",
    icon: ClipboardCheck,
    href: "/dashboard/worksheets/new",
    color: "bg-gradient-to-br from-green-500 to-green-600",
    badge: "New"
  },
  {
    title: "Textbook Library",
    description: "Generate from selected books and chapters with strict textbook grounding.",
    icon: Shield,
    href: "/dashboard/textbooks",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    badge: "Smart"
  },
  {
    title: "Saved Resources",
    description: "Save, edit, duplicate, download, and reuse classroom materials.",
    icon: FileText,
    href: "/dashboard/resources",
    color: "bg-gradient-to-br from-cyan-500 to-blue-600",
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 shadow-md">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-950">Teacher AI Tools</h1>
              <p className="text-xs font-semibold text-slate-500">AI-Powered Education</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" className="text-slate-600">Login</Button></Link>
            <Link href="/signup"><Button className="bg-gradient-to-r from-indigo-600 to-blue-600">Signup</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[82vh] items-center overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100" />
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Textbook-grounded AI for teachers
            </div>
            <h2 className="max-w-4xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
              Create textbook-based lesson plans and worksheets in minutes.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              Upload textbooks, index chapters, generate grounded teaching resources, save outputs, and manage admin visibility from one polished SaaS workspace.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/signup">
                <Button className="h-12 px-8 bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="h-12 px-8 border-slate-300 text-slate-700 hover:bg-slate-50">
                  Try local demo
                </Button>
              </Link>
            </div>
          </div>

          <Card className="relative border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 shadow-md">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">Grounded generation flow</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Teacher-ready resources in four steps</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {["Select textbook", "Choose chapter", "Generate resource", "Save and export"].map((step, index) => (
                <div key={step} className="premium-hover-sm flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-sm font-bold text-white shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{step}</p>
                    <p className="text-xs text-slate-600 mt-0.5">Designed for classroom workflows</p>
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
          <h3 className="text-3xl font-black text-slate-950">Smart teaching tools</h3>
          <p className="mt-3 text-slate-600">A focused workspace for generating, reviewing, and reusing classroom materials.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.title} className="group border-slate-200 bg-white/95 shadow-md backdrop-blur-sm">
                <CardHeader>
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-lg ${tool.color} shadow-md transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg font-black text-slate-900">{tool.title}</CardTitle>
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">{tool.badge}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-slate-700">{tool.description}</p>
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
              <div key={feature.title} className="premium-hover rounded-lg border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur-sm">
                <Icon className="h-7 w-7 text-indigo-600" />
                <h4 className="mt-4 font-black text-slate-950 text-base">{feature.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-700">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
