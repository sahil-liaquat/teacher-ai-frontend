"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Eye, EyeOff, LockKeyhole, Mail, Phone, School, Sparkles, UserRound } from "lucide-react";
import { backendApi, signup, type PublicSchool } from "@/lib/api";
import { phoneSchema } from "@/lib/phone";
import { GoogleButton } from "@/components/auth/google-button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  phone: phoneSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
  school_id: z.string().optional(),
  pending_school_name: z.string().optional(),
  promo_code: z.string().optional()
});

const OTHER_SCHOOL_VALUE = "__other_school__";

export default function SignupPage() {
  const { toast } = useToast();
  const [confirmation, setConfirmation] = useState<{ email: string; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [schools, setSchools] = useState<PublicSchool[]>([]);
  const [schoolMode, setSchoolMode] = useState<"listed" | "unlisted">("listed");
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", password: "", school_id: "", pending_school_name: "", promo_code: "" }
  });
  const selectedSchoolId = form.watch("school_id");

  useEffect(() => {
    // Public endpoint (no auth) returns active schools only, so no client-side
    // status filter is needed and a 401 can never bounce the visitor to /login.
    backendApi.publicSchools("", 0, 100)
      .then((res) => setSchools(res.items))
      .catch(() => setSchools([]));
  }, []);

  async function onSubmit(values: z.infer<typeof schema>) {
    if (schoolMode === "unlisted" && !values.pending_school_name?.trim()) {
      toast({ title: "Enter school name", description: "Please enter your school name or choose a listed school." });
      return;
    }
    try {
      const created = await signup(values.name, values.email, values.password, values.phone, {
        school_id: schoolMode === "listed" && values.school_id !== OTHER_SCHOOL_VALUE ? values.school_id || undefined : undefined,
        pending_school_name: schoolMode === "unlisted" ? values.pending_school_name?.trim() || undefined : undefined,
        promo_code: values.promo_code?.trim() || undefined
      });
      const baseMessage = created.email_confirmed
        ? "Your account is ready. You can log in now."
        : created.message || "Check your email to confirm your account before logging in.";
      const message = created.coupon_message ? `${created.coupon_message} ${baseMessage}` : baseMessage;
      setConfirmation({ email: created.email, message });
      form.reset({ name: "", email: "", phone: "", password: "", school_id: "", pending_school_name: "", promo_code: "" });
      setSchoolMode("listed");
      toast({ title: "Account created", description: message });
    } catch (error) {
      toast({ title: "Signup failed", description: error instanceof Error ? error.message : "Please try again." });
    }
  }

  return (
    <main className="min-h-screen w-full max-w-full bg-[#f6f9ff] px-4 py-4 text-[#07111f] sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:gap-4">
      <section className="relative flex min-h-[calc(100vh-2rem)] w-full max-w-full justify-center overflow-hidden rounded-2xl bg-white px-5 py-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:px-8 lg:min-h-0 lg:py-8">
        <AuthDecorations />

        <div className="relative z-10 w-full max-w-[430px]">
          <Link href="/" aria-label="TeachPad home" className="mb-7 inline-flex">
            <TeachPadWordmark />
          </Link>

          <div className="mb-5">
            <h1 className="text-[34px] font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              {confirmation ? "Confirm your email" : "Create account"}
            </h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {confirmation ? "We sent a confirmation link to your inbox." : "Create textbook-based lesson plans, worksheets, quizzes, and saved resources."}
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
              <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
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
                  label="Mobile number"
                  icon={<Phone className="h-5 w-5" />}
                  error={form.formState.errors.phone?.message}
                  inputProps={{ ...form.register("phone"), type: "tel", inputMode: "numeric", placeholder: "9876543210" }}
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
                <label className="grid gap-2">
                  <span className="text-sm font-black text-slate-900">Which school do you teach at?</span>
                  <span className="flex min-h-[46px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/70">
                    <School className="h-5 w-5 shrink-0" />
                    <select
                      name="school_id"
                      value={schoolMode === "unlisted" ? OTHER_SCHOOL_VALUE : selectedSchoolId || ""}
                      onChange={(event) => {
                        if (event.target.value === OTHER_SCHOOL_VALUE) {
                          setSchoolMode("unlisted");
                          form.setValue("school_id", OTHER_SCHOOL_VALUE);
                        } else {
                          setSchoolMode("listed");
                          form.setValue("school_id", event.target.value);
                          form.setValue("pending_school_name", "");
                        }
                      }}
                      disabled={schoolMode === "unlisted"}
                      className="min-w-0 flex-1 bg-transparent text-base font-bold text-slate-950 outline-none disabled:text-slate-400"
                    >
                      <option value="">Select school</option>
                      <option value={OTHER_SCHOOL_VALUE}>Other school</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {[school.name, school.city].filter(Boolean).join(", ")}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span className="text-xs font-semibold text-slate-500">We use your school format when available.</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = schoolMode === "listed" ? "unlisted" : "listed";
                    setSchoolMode(next);
                    form.setValue("school_id", next === "unlisted" ? OTHER_SCHOOL_VALUE : "");
                    form.setValue("pending_school_name", "");
                  }}
                  className="text-left text-sm font-black text-blue-600 transition hover:text-blue-700"
                >
                  {schoolMode === "listed" ? "My school is not listed" : "Choose from listed schools"}
                </button>
                {schoolMode === "unlisted" ? (
                  <AuthInput
                    label="Enter school name"
                    icon={<School className="h-5 w-5" />}
                    error={form.formState.errors.pending_school_name?.message}
                    inputProps={{ ...form.register("pending_school_name"), placeholder: "Your school" }}
                  />
                ) : selectedSchoolId ? null : null}
                <AuthInput
                  label="Coupon code (optional)"
                  icon={<Sparkles className="h-5 w-5" />}
                  error={form.formState.errors.promo_code?.message}
                  inputProps={{ ...form.register("promo_code"), placeholder: "e.g. DIWALI" }}
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

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">or</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <GoogleButton />

              <p className="mt-4 text-center text-sm font-semibold text-slate-600">
                Already have an account? <Link className="font-black text-blue-600 transition hover:text-blue-700" href="/login">Login</Link>
              </p>
            </>
          )}
        </div>
      </section>

      <section className="relative hidden min-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_82%_12%,#eef6ff_0,transparent_32%),radial-gradient(circle_at_16%_86%,#e7fff4_0,transparent_40%),linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-8 lg:flex lg:flex-col">
        <div className="relative z-10 flex items-center justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
            <Sparkles className="h-4 w-4" />
            Built for busy teachers
          </span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <h2 className="max-w-md text-4xl font-black leading-tight tracking-tight text-slate-950">
            Plan faster from the textbook you already teach.
          </h2>
          <ul className="mt-6 space-y-3">
            {["Textbook grounded resources", "Saved teaching library", "Lesson plans, worksheets, quizzes"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <Check className="h-4 w-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Image
          src="/assets/auth/signup-hero.png"
          alt=""
          width={1662}
          height={946}
          className="pointer-events-none relative z-0 mx-auto mt-6 h-auto w-full max-w-[640px] select-none object-contain"
        />
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
      className="h-auto w-36"
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
        "flex h-[46px] min-h-[46px] items-center gap-3 rounded-lg border bg-white px-4 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition",
        error ? "border-red-200 ring-4 ring-red-50" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/70"
      )}>
        <span className="shrink-0">{icon}</span>
        <input
          {...inputProps}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-bold text-slate-950 outline-none placeholder:text-slate-400"
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
        "flex h-[48px] min-h-[48px] w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 text-[15px] font-black text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_20px_42px_rgba(37,99,235,0.32)] disabled:pointer-events-none disabled:opacity-60",
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(219,239,255,0.5)_0,transparent_28%),radial-gradient(circle_at_86%_84%,rgba(220,255,238,0.46)_0,transparent_30%),linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]" />
      <img
        src="/ai-tools/tree-scene.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 left-1/2 w-[360px] max-w-[120%] -translate-x-1/2 select-none object-contain opacity-35 sm:w-[480px] lg:hidden"
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent" />
    </>
  );
}
