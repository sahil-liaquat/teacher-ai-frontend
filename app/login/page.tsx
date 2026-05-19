"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Brain, ClipboardCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { CURRENT_USER_QUERY_KEY, ensureSession, getCurrentUser, login } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  email: z.string().min(3),
  password: z.string().min(8)
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

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

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      queryClient.clear();
      const user = await login(values.email, values.password);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      toast({ title: "Welcome back", description: user.name });
      const next = new URLSearchParams(window.location.search).get("next");
      const destination = next?.startsWith("/") ? next : (user.role === "admin" ? "/admin" : "/dashboard");
      router.replace(destination);
      router.refresh();
    } catch (error) {
      toast({ title: "Login failed", description: error instanceof Error ? error.message : "Try again" });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <AuthHeader actionHref="/signup" actionLabel="Signup" />
      <main className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-12 lg:grid-cols-[1fr_400px] 2xl:max-w-6xl 2xl:gap-10 2xl:py-20 2xl:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-md">
            <Sparkles className="h-4 w-4" />
            Teacher AI Toolkit
          </div>
          <h1 className="mt-6 max-w-2xl text-[38px] font-extrabold leading-tight tracking-tight text-slate-900 2xl:mt-8 2xl:text-5xl">
            Welcome back.
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-slate-600 2xl:mt-6 2xl:text-lg 2xl:leading-8">
            Access the redesigned workspace for lesson plans, worksheets, saved resources, books, and reports.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-2 gap-4 2xl:mt-10 2xl:gap-5">
            <div className="rounded-[20px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg 2xl:p-6">
              <BookOpen className="h-8 w-8 text-blue-600 2xl:h-9 2xl:w-9" />
              <p className="mt-4 text-lg font-bold text-slate-900 2xl:mt-5 2xl:text-xl">Lesson plans</p>
              <p className="mt-1 text-sm font-medium text-slate-600">Build textbook-grounded classroom plans</p>
            </div>
            <div className="rounded-[20px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg 2xl:p-6">
              <ClipboardCheck className="h-8 w-8 text-emerald-600 2xl:h-9 2xl:w-9" />
              <p className="mt-4 text-lg font-bold text-slate-900 2xl:mt-5 2xl:text-xl">Worksheets</p>
              <p className="mt-1 text-sm font-medium text-slate-600">Create printable practice materials</p>
            </div>
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md border-white/70 bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.1)] backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-slate-900">Login</CardTitle>
            <p className="mt-2 text-sm text-slate-600">Access your Teacher AI Tools dashboard.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input {...form.register("email")} placeholder="name@example.com" />
              </Field>
              <Field label="Password" error={form.formState.errors.password?.message}>
                <Input type="password" {...form.register("password")} placeholder="••••••••" />
              </Field>
              <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Login"}
              </Button>
            </form>
            <p className="text-center text-sm text-slate-600">
              New here? <Link className="font-semibold text-blue-600 transition-colors hover:text-blue-700" href="/signup">Create an account</Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function AuthHeader({ actionHref, actionLabel }: { actionHref: string; actionLabel: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/90 shadow-md backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg 2xl:h-12 2xl:w-12">
            <Brain className="h-6 w-6 text-white 2xl:h-7 2xl:w-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 2xl:text-2xl">Teacher AI Tools</h1>
            <p className="text-xs font-medium text-slate-500 2xl:text-sm">AI-Powered Teaching Assistant</p>
          </div>
        </Link>
        <Link href={actionHref}>
          <Button variant="ghost">{actionLabel}</Button>
        </Link>
      </div>
    </header>
  );
}