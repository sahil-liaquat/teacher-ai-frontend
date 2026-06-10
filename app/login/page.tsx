"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, MailCheck, Quote } from "lucide-react";
import { CURRENT_USER_QUERY_KEY, clearToken, ensureSession, getCurrentUser, login, requestPasswordReset, resendConfirmation } from "@/lib/api";
import { useResendCooldown } from "@/lib/use-resend-cooldown";
import { GoogleButton } from "@/components/auth/google-button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().min(3, "Enter your email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address.")
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState("");
  const [resendingReset, setResendingReset] = useState(false);
  const resendCooldown = useResendCooldown();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  });

  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  async function handleResendConfirmation() {
    const email = form.getValues("email").trim();
    if (!email) {
      toast({ title: "Enter your email", description: "Type your email above, then resend the confirmation link." });
      return;
    }
    if (resendingConfirmation || resendCooldown.secondsLeft("confirmation") > 0) return;
    setResendingConfirmation(true);
    try {
      const res = await resendConfirmation(email);
      toast({ title: "Confirmation re-sent", description: res.message });
      resendCooldown.start("confirmation");
    } catch (error) {
      toast({ title: "Could not resend", description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setResendingConfirmation(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function verifyExistingSession() {
      if (!hasStoredAuthTokens()) {
        if (!cancelled) setCheckingAuth(false);
        return;
      }

      setCheckingAuth(true);
      try {
        const hasSession = await ensureSession();
        if (!hasSession) throw new Error("No active session");

        const user = await getCurrentUser({ redirectOnUnauthorized: false });
        if (!user.id || !user.email || !user.role) throw new Error("Could not load account");
        if (cancelled) return;

        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
        router.replace(user.role === "admin" ? "/admin" : "/dashboard");
      } catch {
        clearToken();
        queryClient.clear();
        if (!cancelled) setCheckingAuth(false);
      }
    }

    void verifyExistingSession();
    return () => {
      cancelled = true;
    };
  }, [queryClient, router]);

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      queryClient.clear();
      const user = await login(values.email, values.password);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      toast({ title: "Welcome!", description: user.name });
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
      resendCooldown.start("reset");
      toast({ title: "Reset email sent", description: response.message || "Check your inbox for the reset link." });
    } catch (error) {
      toast({ title: "Could not send reset email", description: error instanceof Error ? error.message : "Try again" });
    }
  }

  async function handleResendReset() {
    if (!resetSentEmail || resendingReset || resendCooldown.secondsLeft("reset") > 0) return;
    setResendingReset(true);
    try {
      const response = await requestPasswordReset(resetSentEmail);
      toast({ title: "Reset email re-sent", description: response.message || "Check your inbox for the reset link." });
      resendCooldown.start("reset");
    } catch (error) {
      toast({ title: "Could not resend", description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setResendingReset(false);
    }
  }

  if (checkingAuth) {
    return <LoginAuthCheckingScreen />;
  }

  return (
    <main className="min-h-screen w-full max-w-full overflow-hidden bg-[#f6f9ff] px-4 py-4 text-[#07111f] sm:px-6 lg:grid lg:h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(520px,0.75fr)] lg:gap-4">
      <section className="relative hidden overflow-hidden rounded-lg bg-[radial-gradient(circle_at_18%_14%,#e9f4ff_0,transparent_34%),radial-gradient(circle_at_86%_82%,#e7fff4_0,transparent_38%),linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-8 lg:flex lg:flex-col lg:justify-between">
        <img
          src="/ai-tools/tree-scene.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-[-6%] w-[620px] select-none object-contain opacity-95"
        />
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="TeachPad home" className="inline-flex">
            <TeachPadWordmark />
          </Link>
        </div>

        <div className="relative z-10 mx-auto flex max-w-2xl flex-1 -translate-y-20 flex-col justify-center">
          <div className="mb-8 inline-grid h-16 w-16 place-items-center rounded-lg bg-blue-50 text-blue-600 shadow-[0_16px_34px_rgba(37,99,235,0.12)]">
            <Quote className="h-8 w-8" />
          </div>
          <blockquote className="text-5xl font-black leading-[1.08] tracking-tight text-slate-950">
            “<span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Teaching</span> is the art of turning curiosity into confidence.”
          </blockquote>
          <p className="mt-6 max-w-lg text-base font-semibold leading-7 text-slate-600">
            Welcome to the workspace built to make every class easier to plan and brighter to teach.
          </p>
        </div>
      </section>

      <section className="relative grid min-h-[calc(100vh-2rem)] w-full max-w-full place-items-center overflow-hidden rounded-lg bg-white px-5 py-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:px-8 lg:min-h-0">
        <AuthDecorations />
        <div className="absolute left-5 right-5 top-5 z-20 flex min-w-0 items-center justify-between gap-3 sm:left-8 sm:right-8">
          <Link href="/" aria-label="TeachPad home" className="inline-flex lg:hidden">
            <TeachPadWordmark compact />
          </Link>
        </div>

        <div className="relative z-10 mt-16 w-full max-w-[78vw] sm:max-w-[460px] lg:mt-0">
          <div className="mb-7">
            <div className="mb-5 inline-grid h-12 w-12 place-items-center rounded-lg bg-blue-50 text-blue-600">
              {mode === "forgot" && resetSentEmail ? <MailCheck className="h-6 w-6" /> : <LockKeyhole className="h-6 w-6" />}
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950">
              {mode === "login" ? "Welcome!" : resetSentEmail ? "Check your inbox" : "Reset password"}
            </h1>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              {mode === "login"
                ? "Sign in and pick up your classroom work right where you left it."
                : resetSentEmail
                  ? "We sent a password reset link to your email."
                  : "Enter your email and we will send you a reset link."}
            </p>
          </div>

          {mode === "login" ? (
            <>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <AuthInput
                  label="Email address"
                  icon={<Mail className="h-6 w-6" />}
                  error={form.formState.errors.email?.message}
                  inputProps={{ ...form.register("email"), placeholder: "you@school.edu", type: "email" }}
                />
                <AuthInput
                  label="Password"
                  icon={<LockKeyhole className="h-6 w-6" />}
                  error={form.formState.errors.password?.message}
                  inputProps={{ ...form.register("password"), placeholder: "••••••••", type: showPassword ? "text" : "password" }}
                  action={
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="grid h-9 w-9 place-items-center rounded-full text-[#8e98b2] transition hover:bg-[#edf6ff] hover:text-[#147eff]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    forgotPasswordForm.setValue("email", form.getValues("email"));
                    setMode("forgot");
                  }}
                  className="text-sm font-black text-blue-600 transition hover:text-blue-700"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  disabled={resendingConfirmation || resendCooldown.secondsLeft("confirmation") > 0}
                  onClick={handleResendConfirmation}
                  className="block text-sm font-semibold text-slate-500 transition hover:text-blue-600 disabled:opacity-60"
                >
                  {resendingConfirmation
                    ? "Resending…"
                    : resendCooldown.secondsLeft("confirmation") > 0
                      ? `Resend in ${resendCooldown.secondsLeft("confirmation")}s`
                      : "Didn't get the confirmation email? Resend"}
                </button>
                <AuthButton type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                </AuthButton>
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">or</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <GoogleButton />

              <p className="mt-6 text-center text-sm font-semibold text-slate-600">
                New here? <Link className="font-black text-blue-600 transition hover:text-blue-700" href="/signup">Create an account</Link>
              </p>
            </>
          ) : resetSentEmail ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="break-words text-base font-black text-slate-950">{resetSentEmail}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Open the link from your inbox to create a new password.</p>
              <button
                type="button"
                disabled={resendingReset || resendCooldown.secondsLeft("reset") > 0}
                onClick={handleResendReset}
                className="mt-4 block w-full text-sm font-black text-blue-600 transition hover:text-blue-700 disabled:pointer-events-none disabled:opacity-60"
              >
                {resendingReset
                  ? "Resending…"
                  : resendCooldown.secondsLeft("reset") > 0
                    ? `Resend in ${resendCooldown.secondsLeft("reset")}s`
                    : "Didn't get the email? Resend"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetSentEmail("");
                  forgotPasswordForm.reset({ email: resetSentEmail });
                }}
                className="mt-4 text-sm font-black text-blue-600"
              >
                Send to a different email
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="mb-1 inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-slate-950"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
              <AuthInput
                label="Email address"
                icon={<Mail className="h-6 w-6" />}
                error={forgotPasswordForm.formState.errors.email?.message}
                inputProps={{ ...forgotPasswordForm.register("email"), placeholder: "you@school.edu", type: "email" }}
              />
              <AuthButton type="submit" disabled={forgotPasswordForm.formState.isSubmitting}>
                {forgotPasswordForm.formState.isSubmitting ? "Sending..." : "Send reset link"}
              </AuthButton>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function hasStoredAuthTokens() {
  if (typeof window === "undefined") return false;
  return [
    "access_token",
    "refresh_token",
    "teacher_ai_access_token",
    "teacher_ai_refresh_token",
    "teacher_ai_token"
  ].some((key) => Boolean(window.localStorage.getItem(key)));
}

function LoginAuthCheckingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f9ff] px-5 text-[#07111f]">
      <section className="w-full max-w-[420px] rounded-lg border border-blue-100 bg-white p-8 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">Checking your session</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Verifying your login before opening TeachPad.</p>
      </section>
    </main>
  );
}

function TeachPadWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      src="/assets/teachpad-logo.png"
      alt="TeachPad.in"
      width={1385}
      height={279}
      className={cn("h-auto", compact ? "w-36" : "w-44")}
      priority
    />
  );
}

function AuthInput({
  label,
  icon,
  action,
  error,
  inputProps
}: {
  label: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  error?: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-900">{label}</span>
      <span className={cn(
        "flex h-[52px] min-h-[52px] items-center gap-3 rounded-lg border bg-slate-50 px-4 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition",
        error ? "border-red-200 ring-4 ring-red-50" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/70"
      )}>
        <span className="shrink-0">{icon}</span>
        <input
          {...inputProps}
          className="min-w-0 flex-1 bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
        />
        {action}
      </span>
      {error ? <span className="text-sm font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function AuthButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "flex h-[52px] min-h-[52px] w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 text-base font-black text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_20px_42px_rgba(37,99,235,0.32)] disabled:pointer-events-none disabled:opacity-60",
        props.className
      )}
    >
      {children}
    </button>
  );
}

function AuthDecorations() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(219,239,255,0.78)_0,transparent_32%),radial-gradient(circle_at_86%_84%,rgba(220,255,238,0.72)_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]" />
      <img
        src="/ai-tools/landscape-scene.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 left-1/2 w-[540px] max-w-[145%] -translate-x-1/2 select-none object-contain opacity-70 sm:w-[680px] lg:hidden"
      />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-white via-white/80 to-transparent" />
    </>
  );
}
