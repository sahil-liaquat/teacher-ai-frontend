"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Brain, MailCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { signup } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().min(3),
  password: z.string().min(8),
  school_name: z.string().optional()
});

export default function SignupPage() {
  const { toast } = useToast();
  const [confirmation, setConfirmation] = useState<{ email: string; message: string } | null>(null);
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
      toast({ title: "Signup failed", description: error instanceof Error ? error.message : "This backend only allows admins to create users." });
    }
  }

  return (
    <div className="teachpad-page min-h-screen">
      <header className="sticky top-0 z-50 border-b border-teachpad-cardBorder bg-white/90 shadow-[0_10px_28px_var(--teachpad-shadowCard)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teachpad-blue to-blue-600 shadow-lg 2xl:h-12 2xl:w-12">
              <Brain className="h-6 w-6 text-white 2xl:h-7 2xl:w-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-teachpad-ink 2xl:text-2xl">Teacher AI Tools</h1>
              <p className="text-xs font-medium text-teachpad-muted 2xl:text-sm">AI-Powered Teaching Assistant</p>
            </div>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_420px] 2xl:max-w-6xl 2xl:gap-10 2xl:py-16 2xl:grid-cols-[1fr_460px]">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-teachpad-blue shadow-md">
            <Sparkles className="h-4 w-4" />
            Start your AI teaching workspace
          </div>
          <h1 className="mt-6 max-w-2xl text-[38px] font-extrabold leading-tight tracking-tight text-teachpad-ink 2xl:text-5xl">
            Create, save, and export teacher-ready resources.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-teachpad-muted 2xl:text-lg 2xl:leading-8">
            Build a polished workspace for textbook-grounded lesson plans and worksheets.
          </p>
        </section>

        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold text-teachpad-ink">Signup</CardTitle>
            <p className="text-sm text-teachpad-muted">User creation is handled by admins on the live backend.</p>
          </CardHeader>
          <CardContent>
            {confirmation ? (
              <div className="rounded-2xl border border-teachpad-cardBorder bg-teachpad-mint p-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/70 text-[#1ec8b7]">
                  <MailCheck className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-xl font-extrabold text-teachpad-ink">Confirm your email</h2>
                <p className="mt-2 text-sm leading-6 text-teachpad-muted">{confirmation.message}</p>
                <p className="mt-3 break-words rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#16a9b6]">
                  {confirmation.email}
                </p>
                <Link href="/login" className="mt-5 block">
                  <Button className="w-full gap-2">
                    Go to login
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <Field label="Full Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
                <Field label="Email" error={form.formState.errors.email?.message}><Input {...form.register("email")} /></Field>
                <Field label="Password" error={form.formState.errors.password?.message}><Input type="password" {...form.register("password")} /></Field>
                <Field label="School name"><Input {...form.register("school_name")} /></Field>
                <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Signup"}
                </Button>
              </form>
            )}
            <p className="mt-5 text-center text-sm text-teachpad-muted">
              Already have an account? <Link className="font-bold text-teachpad-blue" href="/login">Login</Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
