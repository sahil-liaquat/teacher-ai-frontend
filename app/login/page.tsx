"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <main className="grid min-h-screen bg-[#f3f5ff] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <section className="relative hidden overflow-hidden bg-[#18266d] px-12 py-10 text-white lg:flex lg:items-center xl:px-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(110,133,255,0.24),transparent_30rem),radial-gradient(circle_at_80%_88%,rgba(51,76,180,0.34),transparent_34rem)]" />
        <div className="relative mx-auto w-full max-w-[560px]">
          <h1 className="text-[52px] font-black leading-[0.95] tracking-tight xl:text-[64px]">
            Teacher
            <span className="block text-[#a99cff]">AI</span>
          </h1>
          <p className="mt-8 max-w-[500px] text-xl font-semibold leading-8 text-white/78">
            An intelligent lesson planning platform powered by AI. Build structured, curriculum-aligned lesson plans in minutes.
          </p>

          <div className="mt-16 grid gap-6 text-lg font-semibold text-white/68">
            <p className="flex items-center gap-4">
              <Check className="h-5 w-5 text-amber-300" />
              Curriculum-aligned lesson plans
            </p>
            <p className="flex items-center gap-4">
              <Check className="h-5 w-5 text-amber-300" />
              AI-powered content retrieval
            </p>
            <p className="flex items-center gap-4">
              <Check className="h-5 w-5 text-amber-300" />
              Multi-board & grade support
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full max-w-[440px] rounded-[28px] bg-white px-7 py-8 shadow-[0_28px_80px_rgba(30,41,94,0.12)] sm:px-9 sm:py-10 xl:max-w-[480px] xl:px-11 xl:py-12">
          <div className="mb-7">
            <h2 className="text-3xl font-black tracking-tight text-[#1b2559] sm:text-[34px]">Welcome back</h2>
            <p className="mt-3 text-base font-semibold text-[#7b86ad]">Sign in to your account to continue</p>
          </div>

          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <Field label="Email address" error={form.formState.errors.email?.message}>
              <Input
                {...form.register("email")}
                placeholder="you@school.edu"
                className="h-14 rounded-[18px] border-[#e2e7f4] bg-white px-5 text-base font-semibold shadow-none focus:border-[#b7a7ff] focus:ring-[#7c5cff]/20"
              />
            </Field>
            <Field label="Password" error={form.formState.errors.password?.message}>
              <Input
                type="password"
                {...form.register("password")}
                placeholder="••••••••"
                className="h-14 rounded-[18px] border-[#e2e7f4] bg-white px-5 text-base font-semibold shadow-none focus:border-[#b7a7ff] focus:ring-[#7c5cff]/20"
              />
            </Field>
            <Button
              className="mt-8 h-14 w-full rounded-[16px] bg-gradient-to-r from-[#6d4df4] to-[#8363f4] text-base font-black shadow-[0_18px_34px_rgba(109,77,244,0.22)] hover:shadow-[0_20px_42px_rgba(109,77,244,0.28)]"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-semibold text-[#7b86ad]">
            New here? <Link className="font-black text-[#6d4df4] transition-colors hover:text-[#5438dd]" href="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
