"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, MailCheck } from "lucide-react";
import { CURRENT_USER_QUERY_KEY, ensureSession, getCurrentUser, login, requestPasswordReset } from "@/lib/api";
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
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="min-h-screen overflow-hidden bg-[#f7fbff] lg:grid lg:h-screen lg:grid-cols-[minmax(0,1.01fr)_minmax(0,0.99fr)]">
      <section
        className="relative hidden min-h-screen overflow-hidden bg-[#061d59] bg-cover bg-left lg:block lg:min-h-0"
        style={{ backgroundImage: "url('/assets/auth/login-hero-left.png')" }}
        aria-label="teachpad illustration"
      />

      <section className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-7 sm:px-8 lg:min-h-0 lg:px-10 lg:py-6">
        <AuthDecorations />
        <Link
          href="/"
          className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-[#dfe7f4] bg-white/82 px-4 py-2 text-sm font-black text-[#66708c] shadow-[0_12px_28px_rgba(41,82,140,0.10)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white hover:text-[#071844] sm:left-8 sm:top-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="relative z-10 w-full max-w-[500px] rounded-[30px] border border-[#dfe7f4] bg-white/88 px-6 py-7 shadow-[0_30px_90px_rgba(41,82,140,0.16)] backdrop-blur-xl sm:px-9 sm:py-8">
          <div className="mb-5">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#edf6ff] text-[#147eff] shadow-[0_16px_36px_rgba(20,126,255,0.13)]">
              {mode === "forgot" && resetSentEmail ? <MailCheck className="h-8 w-8" /> : <GraduationCap className="h-9 w-9" />}
            </div>
            <h1 className="text-[30px] font-black leading-tight tracking-[-0.02em] text-[#071844] sm:text-[34px]">
              {mode === "login" ? "Welcome back" : resetSentEmail ? "Check your inbox" : "Reset password"}
            </h1>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-[#66708c] sm:text-base">
              {mode === "login"
                ? "Sign in to your account to continue"
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
                  className="text-base font-black text-[#087cff] transition hover:text-[#005ee0]"
                >
                  Forgot password?
                </button>
                <AuthButton type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                  <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-white/20">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </AuthButton>
              </form>

              <p className="mt-6 text-center text-sm font-semibold text-[#66708c]">
                New here? <Link className="font-black text-[#087cff] transition hover:text-[#005ee0]" href="/signup">Create an account</Link>
              </p>
            </>
          ) : resetSentEmail ? (
            <div className="rounded-[24px] border border-[#dfe7f4] bg-[#f7fbff] p-5 text-center">
              <p className="break-words text-base font-black text-[#071844]">{resetSentEmail}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#66708c]">Open the link from your inbox to create a new password.</p>
              <button
                type="button"
                onClick={() => {
                  setResetSentEmail("");
                  forgotPasswordForm.reset({ email: resetSentEmail });
                }}
                className="mt-4 text-sm font-black text-[#087cff]"
              >
                Send to a different email
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="mb-1 inline-flex items-center gap-2 text-sm font-black text-[#66708c] transition hover:text-[#071844]"
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
                <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-white/20">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </AuthButton>
            </form>
          )}
        </div>
      </section>
    </main>
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
      <span className="text-sm font-black text-[#071844]">{label}</span>
      <span className={cn(
        "flex h-14 items-center gap-3 rounded-[18px] border bg-[#f9fbff] px-4 text-[#8e98b2] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition",
        error ? "border-red-200 ring-4 ring-red-50" : "border-[#dce4f1] focus-within:border-[#147eff] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/70"
      )}>
        <span className="shrink-0">{icon}</span>
        <input
          {...inputProps}
          className="min-w-0 flex-1 bg-transparent text-base font-bold text-[#071844] outline-none placeholder:text-[#8e98b2]"
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
        "flex h-14 w-full items-center justify-center gap-3 rounded-[18px] bg-gradient-to-r from-[#087cff] to-[#0b4dff] px-5 text-lg font-black text-white shadow-[0_18px_36px_rgba(8,124,255,0.34)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(8,124,255,0.38)] disabled:pointer-events-none disabled:opacity-60",
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(195,225,255,0.72),transparent_16rem),radial-gradient(circle_at_78%_82%,rgba(195,225,255,0.7),transparent_18rem)]" />
      <div className="absolute right-6 top-12 hidden h-28 w-44 rotate-[-18deg] rounded-[60%_40%_60%_40%] border-4 border-dashed border-[#b6d8ff] opacity-70 lg:block" />
      <div className="absolute right-8 top-24 hidden h-0 w-0 rotate-[24deg] border-b-[30px] border-l-[48px] border-t-[30px] border-b-transparent border-l-[#79b8ff] border-t-transparent drop-shadow-[0_18px_24px_rgba(42,124,225,0.2)] lg:block" />
      <div className="absolute bottom-10 right-12 hidden h-36 w-36 rounded-full bg-[radial-gradient(circle,#fff_0_35%,transparent_36%)] opacity-70 lg:block" />
      <div className="absolute bottom-8 right-20 hidden h-24 w-40 rounded-full bg-white/70 blur-xl lg:block" />
      <div className="absolute left-8 top-16 h-3 w-3 rounded-full bg-[#c4e5ff]" />
      <div className="absolute bottom-16 left-16 h-4 w-4 rounded-full border-4 border-[#b6d8ff]" />
      <div className="absolute right-20 top-1/3 h-4 w-4 rounded-full border-4 border-[#ffcf70]" />
    </>
  );
}
