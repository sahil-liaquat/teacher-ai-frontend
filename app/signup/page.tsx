"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CheckCircle2, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, MailCheck, School, UserRound } from "lucide-react";
import { signup } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  school_name: z.string().optional()
});

export default function SignupPage() {
  const { toast } = useToast();
  const [confirmation, setConfirmation] = useState<{ email: string; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", school_name: "" }
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      const created = await signup(values.name, values.email, values.password, values.school_name);
      const message = created.email_confirmed
        ? "Your account is ready. You can log in now."
        : created.message || "Check your email to confirm your account before logging in.";
      setConfirmation({ email: created.email, message });
      form.reset({ name: "", email: "", password: "", school_name: "" });
      toast({ title: "Account created", description: message });
    } catch (error) {
      toast({ title: "Signup failed", description: error instanceof Error ? error.message : "Please try again." });
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7fbff] lg:grid lg:h-screen lg:grid-cols-[minmax(0,1.01fr)_minmax(0,0.99fr)]">
      <section
        className="relative hidden min-h-screen overflow-hidden bg-[#061d59] bg-cover bg-center lg:block lg:min-h-0"
        style={{ backgroundImage: "url('/assets/auth/signup-hero.png')" }}
        aria-label="teachpad signup illustration"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#061d59]/78 via-[#061d59]/28 to-transparent" />
        <div className="relative z-10 flex h-full items-center px-16 xl:px-24">
          <div className="max-w-[520px] text-white">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white/88 backdrop-blur-md">
              <CheckCircle2 className="h-4 w-4 text-[#6ad3ff]" />
              Start your AI teaching workspace
            </p>
            <h1 className="text-[54px] font-black leading-[0.95] tracking-[-0.04em] drop-shadow-[0_8px_22px_rgba(0,0,0,0.24)] xl:text-[66px]">
              Join
              <span className="block text-white">
                teach<span className="bg-gradient-to-r from-[#8feaff] to-[#72a8ff] bg-clip-text text-transparent">pad</span>
              </span>
            </h1>
            <p className="mt-6 max-w-[450px] text-lg font-semibold leading-8 text-white/84">
              Create a polished workspace for lesson plans, worksheets, saved resources, and textbook-grounded teaching support.
            </p>
            <div className="mt-8 grid gap-4 text-base font-semibold text-white/86">
              <p className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-[#58b7ff]" /> Personalized teacher dashboard</p>
              <p className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-[#58b7ff]" /> Saved resources by class and subject</p>
              <p className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-[#58b7ff]" /> Fast AI classroom tools</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-7 sm:px-8 lg:min-h-0 lg:px-10 lg:py-5">
        <AuthDecorations />
        <div className="relative z-10 w-full max-w-[500px] rounded-[30px] border border-[#dfe7f4] bg-white/88 px-6 py-6 shadow-[0_30px_90px_rgba(41,82,140,0.16)] backdrop-blur-xl sm:px-8 sm:py-7">
          <div className="mb-4">
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-[#edf6ff] text-[#147eff] shadow-[0_16px_36px_rgba(20,126,255,0.13)]">
              {confirmation ? <MailCheck className="h-7 w-7" /> : <GraduationCap className="h-8 w-8" />}
            </div>
            <h1 className="text-[28px] font-black leading-tight tracking-[-0.02em] text-[#071844] sm:text-[32px]">
              {confirmation ? "Confirm your email" : "Create account"}
            </h1>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-[#66708c] sm:text-base">
              {confirmation ? "We sent a confirmation link to your inbox." : "Build your AI teaching workspace today"}
            </p>
          </div>

          {confirmation ? (
            <div className="rounded-[24px] border border-[#dfe7f4] bg-[#f7fbff] p-5 text-center">
              <p className="text-sm font-semibold leading-6 text-[#66708c]">{confirmation.message}</p>
              <p className="mt-3 break-words rounded-[18px] bg-white px-4 py-3 text-base font-black text-[#071844] shadow-sm">
                {confirmation.email}
              </p>
              <Link href="/login" className="mt-5 block">
                <AuthButton type="button">
                  Go to login
                  <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-white/20">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </AuthButton>
              </Link>
            </div>
          ) : (
            <>
              <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
                <AuthInput
                  label="Full name"
                  icon={<UserRound className="h-6 w-6" />}
                  error={form.formState.errors.name?.message}
                  inputProps={{ ...form.register("name"), placeholder: "Your Name" }}
                />
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
                      className="grid h-8 w-8 place-items-center rounded-full text-[#8e98b2] transition hover:bg-[#edf6ff] hover:text-[#147eff]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  }
                />
                <AuthInput
                  label="School name"
                  icon={<School className="h-6 w-6" />}
                  error={form.formState.errors.school_name?.message}
                  inputProps={{ ...form.register("school_name"), placeholder: "Your school" }}
                />
                <AuthButton type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create account"}
                  <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-white/20">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </AuthButton>
              </form>

              <p className="mt-5 text-center text-sm font-semibold text-[#66708c]">
                Already have an account? <Link className="font-black text-[#087cff] transition hover:text-[#005ee0]" href="/login">Login</Link>
              </p>
            </>
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
        "flex h-[52px] items-center gap-3 rounded-[17px] border bg-[#f9fbff] px-4 text-[#8e98b2] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition",
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
        "flex h-[54px] w-full items-center justify-center gap-3 rounded-[18px] bg-gradient-to-r from-[#087cff] to-[#0b4dff] px-5 text-lg font-black text-white shadow-[0_18px_36px_rgba(8,124,255,0.34)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(8,124,255,0.38)] disabled:pointer-events-none disabled:opacity-60",
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
      <div className="absolute bottom-8 right-20 hidden h-24 w-40 rounded-full bg-white/70 blur-xl lg:block" />
      <div className="absolute left-8 top-16 h-3 w-3 rounded-full bg-[#c4e5ff]" />
      <div className="absolute bottom-16 left-16 h-4 w-4 rounded-full border-4 border-[#b6d8ff]" />
      <div className="absolute right-20 top-1/3 h-4 w-4 rounded-full border-4 border-[#ffcf70]" />
    </>
  );
}
