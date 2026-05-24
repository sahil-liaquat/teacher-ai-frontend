"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LockKeyhole, Mail, Quote, School, Sparkles, UserRound } from "lucide-react";
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
    <main className="min-h-screen w-full max-w-full overflow-hidden bg-[#f6f9ff] px-4 py-4 text-[#07111f] sm:px-6 lg:grid lg:h-screen lg:grid-cols-[minmax(520px,0.76fr)_minmax(0,0.94fr)] lg:gap-4">
      <section className="relative grid min-h-[calc(100vh-2rem)] w-full max-w-full place-items-center overflow-hidden rounded-lg bg-white px-5 py-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:px-8 lg:min-h-0">
        <AuthDecorations />
        <div className="absolute left-5 right-5 top-5 z-20 flex min-w-0 items-center justify-between gap-3 sm:left-8 sm:right-8">
          <Link href="/" aria-label="TeachPad home" className="inline-flex">
            <TeachPadWordmark />
          </Link>
        </div>

        <div className="relative z-10 mt-10 w-full max-w-[78vw] sm:max-w-[460px] lg:mt-0">
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
              <Link href="/login" className="mt-5 block">
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
                <AuthInput
                  label="Email address"
                  icon={<Mail className="h-5 w-5" />}
                  error={form.formState.errors.email?.message}
                  inputProps={{ ...form.register("email"), placeholder: "you@school.edu", type: "email" }}
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
                  label="School name"
                  icon={<School className="h-5 w-5" />}
                  error={form.formState.errors.school_name?.message}
                  inputProps={{ ...form.register("school_name"), placeholder: "Your school" }}
                />
                <AuthButton type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create account"}
                </AuthButton>
              </form>

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
          alt=""
          aria-hidden="true"
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
          <blockquote className="text-5xl font-black leading-[1.08] tracking-tight text-slate-950">
            “Every great classroom starts with a teacher who believes the <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">next question matters.</span>”
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
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 left-1/2 w-[420px] max-w-[135%] -translate-x-1/2 select-none object-contain opacity-65 sm:w-[560px] lg:hidden"
      />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-white via-white/80 to-transparent" />
    </>
  );
}
