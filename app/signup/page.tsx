"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, Quote, Sparkles, UserRound } from "lucide-react";
import { resendConfirmation, signup } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useResendCooldown } from "@/lib/use-resend-cooldown";
import { suggestEmailCorrection } from "@/lib/email-typo";
import { phoneSchema } from "@/lib/phone";
import { GoogleButton } from "@/components/auth/google-button";
import { clearStoredReferralPromoCode, getStoredReferralPromoCode } from "@/components/referral-capture";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  phone: phoneSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
  promo_code: z.string().optional()
});

export default function SignupPage() {
  const { toast } = useToast();
  const [confirmation, setConfirmation] = useState<{ email: string; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", password: "", promo_code: "" }
  });

  const emailValue = form.watch("email");
  const emailSuggestion = useMemo(() => suggestEmailCorrection(emailValue || ""), [emailValue]);
  const [resending, setResending] = useState(false);
  const resendCooldown = useResendCooldown();

  useEffect(() => {
    const storedCode = getStoredReferralPromoCode();
    if (storedCode) form.setValue("promo_code", storedCode);
  }, [form]);

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      const storedCode = getStoredReferralPromoCode();
      const promoCode = values.promo_code?.trim() || storedCode || undefined;
      const created = await signup(values.name, values.email, values.password, values.phone, {
        promo_code: promoCode
      });
      const baseMessage = created.email_confirmed
        ? "Your account is ready. You can log in now."
        : created.message || "Check your email to confirm your account before logging in.";
      const message = created.coupon_message ? `${created.coupon_message} ${baseMessage}` : baseMessage;
      setConfirmation({ email: created.email, message });
      if (!created.email_confirmed) resendCooldown.start();
      clearStoredReferralPromoCode();
      form.reset({ name: "", email: "", phone: "", password: "", promo_code: "" });
      toast({ title: "Account created", description: message, variant: "success" });
    } catch (error) {
      toast({ title: "Signup failed", description: getErrorMessage(error, "Please try again."), variant: "error" });
    }
  }

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-clip bg-[#f6f9ff] px-4 py-4 text-[#07111f] sm:px-6 lg:grid lg:min-h-screen lg:grid-cols-[minmax(0,0.76fr)_minmax(0,0.94fr)] lg:gap-4">
      <section className="relative flex min-h-[calc(100vh-2rem)] w-full max-w-full justify-center rounded-lg bg-white px-5 py-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:px-8 overflow-x-clip lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden">
        <AuthDecorations />
        <div className="absolute left-5 right-5 top-5 z-20 flex min-w-0 items-center justify-between gap-3 sm:left-8 sm:right-8">
          <Link href="/" aria-label="TeachPad home" className="inline-flex">
            <TeachPadWordmark />
          </Link>
        </div>

        <div className="relative z-10 w-full max-w-[90vw] pb-8 pt-20 sm:max-w-[460px] lg:pt-24">
          <div className="mb-6">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950">
              {confirmation ? "Confirm your email" : "Create account"}
            </h1>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              {confirmation ? "We sent a confirmation link to your inbox." : "Start a workspace for lesson plans, worksheets, quizzes, and saved teaching resources."}
            </p>
          </div>

          {confirmation ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-sm font-semibold leading-6 text-slate-600">{confirmation.message}</p>
              <p className="mt-3 break-words rounded-lg bg-white px-4 py-3 text-base font-black text-slate-950 shadow-sm">
                {confirmation.email}
              </p>
              <button
                type="button"
                disabled={resending || resendCooldown.secondsLeft() > 0}
                onClick={async () => {
                  if (resending || resendCooldown.secondsLeft() > 0) return;
                  setResending(true);
                  try {
                    const res = await resendConfirmation(confirmation.email);
                    toast({ title: "Confirmation re-sent", description: res.message, variant: "success" });
                    resendCooldown.start();
                  } catch (error) {
                    toast({ title: "Could not resend", description: getErrorMessage(error, "Try again."), variant: "error" });
                  } finally {
                    setResending(false);
                  }
                }}
                className="mt-5 text-sm font-black text-blue-600 transition hover:text-blue-700 disabled:opacity-60"
              >
                {resending ? "Resending…" : resendCooldown.secondsLeft() > 0 ? `Resend in ${resendCooldown.secondsLeft()}s` : "Didn't get the email? Resend"}
              </button>
              <Link href="/login" className="mt-3 block">
                <AuthButton type="button">
                  Go to login
                </AuthButton>
              </Link>
            </div>
          ) : (
            <>
              <form className="space-y-3.5" onSubmit={form.handleSubmit(onSubmit)}>
                <AuthInput
                  label="Full name"
                  icon={<UserRound className="h-5 w-5" />}
                  error={form.formState.errors.name?.message}
                  inputProps={{ ...form.register("name"), placeholder: "Your Name" }}
                />
                <div>
                  <AuthInput
                    label="Email address"
                    icon={<Mail className="h-5 w-5" />}
                    error={form.formState.errors.email?.message}
                    inputProps={{ ...form.register("email"), placeholder: "you@school.edu", type: "email" }}
                  />
                  {emailSuggestion ? (
                    <button
                      type="button"
                      onClick={() => form.setValue("email", emailSuggestion, { shouldValidate: true })}
                      className="mt-1.5 text-left text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      Did you mean <span className="font-black underline">{emailSuggestion}</span>?
                    </button>
                  ) : null}
                </div>
                <AuthInput
                  label="Mobile number"
                  icon={<Phone className="h-5 w-5" />}
                  error={form.formState.errors.phone?.message}
                  inputProps={{ ...form.register("phone"), type: "tel", inputMode: "numeric", placeholder: "Your number" }}
                />
                <AuthInput
                  label="Password"
                  icon={<LockKeyhole className="h-5 w-5" />}
                  error={form.formState.errors.password?.message}
                  inputProps={{ ...form.register("password"), placeholder: "Password", type: showPassword ? "text" : "password" }}
                  action={
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />
                <AuthInput
                  label="Coupon code (optional)"
                  icon={<Sparkles className="h-5 w-5" />}
                  error={form.formState.errors.promo_code?.message}
                  inputProps={{ ...form.register("promo_code"), placeholder: "Enter Coupon" }}
                />
                <AuthButton type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create account"}
                </AuthButton>
                <p className="text-center text-xs font-semibold leading-5 text-slate-500">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="font-bold text-blue-600 transition hover:text-blue-700">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-bold text-blue-600 transition hover:text-blue-700">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">or</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <GoogleButton />

              <p className="mt-5 text-center text-sm font-semibold text-slate-600">
                Already have an account? <Link className="font-black text-blue-600 transition hover:text-blue-700" href="/login">Login</Link>
              </p>
            </>
          )}
        </div>
      </section>

      <section className="relative hidden overflow-hidden rounded-lg bg-[radial-gradient(circle_at_82%_12%,#eef6ff_0,transparent_32%),radial-gradient(circle_at_16%_86%,#e7fff4_0,transparent_40%),linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-8 lg:flex lg:flex-col lg:justify-between">
        <img
          src="/ai-tools/landscape-scene.png"
          alt="Illustrated classroom landscape for TeachPad teacher signup."
          className="pointer-events-none absolute bottom-0 left-1/2 w-[820px] -translate-x-1/2 select-none object-contain opacity-95"
        />
        <div className="flex items-center justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
            <Sparkles className="h-4 w-4" />
            Built for busy teachers
          </span>
        </div>

        <div className="relative z-10 mx-auto flex max-w-2xl flex-1 -translate-y-20 flex-col justify-center">
          <div className="mb-8 inline-grid h-16 w-16 place-items-center rounded-lg bg-blue-50 text-blue-600 shadow-[0_16px_34px_rgba(37,99,235,0.12)]">
            <Quote className="h-8 w-8" />
          </div>
          <blockquote className="text-3xl font-black leading-tight tracking-tight text-slate-950">
            “Teaching begins when <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">curiosity feels possible.</span>”
          </blockquote>
          <p className="mt-6 max-w-lg text-base font-semibold leading-7 text-slate-600">
            Create your TeachPad workspace and turn planning time into teaching momentum.
          </p>
        </div>
      </section>
    </main>
  );
}

function TeachPadWordmark() {
  return (
    <Image
      src="/assets/teachpad-logo.png"
      alt="TeachPad.in"
      width={1385}
      height={279}
      className="h-auto w-36 lg:w-44"
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
        "flex h-[50px] min-h-[50px] items-center gap-3 rounded-lg border bg-slate-50 px-4 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition",
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
        src="/ai-tools/tree-scene.png"
        alt="Illustrated tree and classroom scenery for the TeachPad signup page."
        className="pointer-events-none absolute -bottom-8 left-1/2 w-[420px] max-w-[100%] -translate-x-1/2 select-none object-contain opacity-65 sm:w-[560px] lg:hidden"
      />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-white via-white/80 to-transparent" />
    </>
  );
}
