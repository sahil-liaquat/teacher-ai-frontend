"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { CURRENT_USER_QUERY_KEY, ensureSession, getCurrentUser, login, requestPasswordReset } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  email: z.string().min(3),
  password: z.string().min(8)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [resetSentEmail, setResetSentEmail] = useState("");
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
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

  async function onForgotPasswordSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    try {
      const response = await requestPasswordReset(values.email);
      setResetSentEmail(values.email);
      toast({ title: "Reset email sent", description: response.message || "Check your inbox for the reset link." });
    } catch (error) {
      toast({ title: "Could not send reset email", description: error instanceof Error ? error.message : "Try again" });
    }
  }

  return (
    <main className="teachpad-page grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <section className="relative hidden overflow-hidden bg-teachpad-ink px-12 py-10 text-white lg:flex lg:items-center xl:px-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(22,119,255,0.32),transparent_30rem),radial-gradient(circle_at_76%_80%,rgba(201,247,251,0.22),transparent_34rem),radial-gradient(circle_at_22%_80%,rgba(255,220,232,0.16),transparent_24rem)]" />
        <div className="relative mx-auto w-full max-w-[560px]">
          <h1 className="text-[52px] font-black leading-[0.95] tracking-tight xl:text-[64px]">
            Teacher
            <span className="block text-teachpad-sky">AI</span>
          </h1>
          <p className="mt-8 max-w-[500px] text-xl font-semibold leading-8 text-white/78">
            An intelligent lesson planning platform powered by AI. Build structured, curriculum-aligned lesson plans in minutes.
          </p>

          <div className="mt-16 grid gap-6 text-lg font-semibold text-white/68">
            <p className="flex items-center gap-4">
              <Check className="h-5 w-5 text-teachpad-yellow" />
              Curriculum-aligned lesson plans
            </p>
            <p className="flex items-center gap-4">
              <Check className="h-5 w-5 text-teachpad-yellow" />
              AI-powered content retrieval
            </p>
            <p className="flex items-center gap-4">
              <Check className="h-5 w-5 text-teachpad-yellow" />
              Multi-board & grade support
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full max-w-[440px] rounded-[28px] border border-teachpad-cardBorder bg-white/90 px-7 py-8 shadow-[0_28px_80px_var(--teachpad-shadowCard)] backdrop-blur-xl sm:px-9 sm:py-10 xl:max-w-[480px] xl:px-11 xl:py-12">
          {mode === "login" ? (
            <>
              <div className="mb-7">
                <h2 className="text-3xl font-black tracking-tight text-teachpad-ink sm:text-[34px]">Welcome back</h2>
                <p className="mt-3 text-base font-semibold text-teachpad-muted">Sign in to your account to continue</p>
              </div>

              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <Field label="Email address" error={form.formState.errors.email?.message}>
                  <Input
                    {...form.register("email")}
                    placeholder="you@school.edu"
                    className="h-14 rounded-[18px] border-teachpad-cardBorder bg-teachpad-input px-5 text-base font-semibold shadow-none focus:border-teachpad-blue focus:ring-blue-100"
                  />
                </Field>
                <Field label="Password" error={form.formState.errors.password?.message}>
                  <Input
                    type="password"
                    {...form.register("password")}
                    placeholder="••••••••"
                    className="h-14 rounded-[18px] border-teachpad-cardBorder bg-teachpad-input px-5 text-base font-semibold shadow-none focus:border-teachpad-blue focus:ring-blue-100"
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => {
                    forgotPasswordForm.setValue("email", form.getValues("email"));
                    setMode("forgot");
                  }}
                  className="text-sm font-black text-teachpad-blue transition-colors hover:text-blue-600"
                >
                  Forgot password?
                </button>
                <Button
                  className="mt-3 h-14 w-full rounded-[16px] bg-gradient-to-r from-teachpad-blue to-blue-600 text-base font-black shadow-[0_18px_34px_var(--teachpad-shadowBlue)] hover:shadow-[0_20px_42px_var(--teachpad-shadowBlue)]"
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm font-semibold text-teachpad-muted">
                New here? <Link className="font-black text-teachpad-blue transition-colors hover:text-blue-600" href="/signup">Create an account</Link>
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setResetSentEmail("");
                }}
                className="mb-6 inline-flex items-center gap-2 text-sm font-black text-teachpad-muted transition hover:text-teachpad-ink"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
              <div className="mb-7">
                <h2 className="text-3xl font-black tracking-tight text-teachpad-ink sm:text-[34px]">Reset password</h2>
                <p className="mt-3 text-base font-semibold text-teachpad-muted">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              {resetSentEmail ? (
                <div className="rounded-[20px] border border-teachpad-cardBorder bg-teachpad-mint p-5 text-center">
                  <MailCheck className="mx-auto h-10 w-10 text-[#1ec8b7]" />
                  <h3 className="mt-3 text-lg font-black text-teachpad-ink">Check your inbox</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-teachpad-muted">
                    We sent a password reset link to <span className="font-black text-teachpad-ink">{resetSentEmail}</span>.
                  </p>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
                  <Field label="Email address" error={forgotPasswordForm.formState.errors.email?.message}>
                    <Input
                      {...forgotPasswordForm.register("email")}
                      placeholder="you@school.edu"
                      className="h-14 rounded-[18px] border-teachpad-cardBorder bg-teachpad-input px-5 text-base font-semibold shadow-none focus:border-teachpad-blue focus:ring-blue-100"
                    />
                  </Field>
                  <Button
                    className="h-14 w-full rounded-[16px] bg-gradient-to-r from-teachpad-blue to-blue-600 text-base font-black shadow-[0_18px_34px_var(--teachpad-shadowBlue)] hover:shadow-[0_20px_42px_var(--teachpad-shadowBlue)]"
                    type="submit"
                    disabled={forgotPasswordForm.formState.isSubmitting}
                  >
                    {forgotPasswordForm.formState.isSubmitting ? "Sending..." : "Send reset link"}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
