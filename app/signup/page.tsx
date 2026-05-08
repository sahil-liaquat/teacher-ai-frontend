"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Brain, Sparkles } from "lucide-react";
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
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", school_name: "" }
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await signup(values.name, values.email, values.password, values.school_name);
      toast({ title: "Account created", description: "The teacher can now log in with these credentials." });
      router.push("/login");
    } catch (error) {
      toast({ title: "Signup failed", description: error instanceof Error ? error.message : "This backend only allows admins to create users." });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="sticky top-0 z-50 border-b bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="gradient-text-blue text-2xl font-black">Teacher AI Tools</h1>
              <p className="text-xs font-semibold text-slate-500">Teacher AI Toolkit</p>
            </div>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_420px] 2xl:max-w-6xl 2xl:gap-10 2xl:py-16 2xl:grid-cols-[1fr_460px]">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm font-bold text-purple-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Start your AI teaching workspace
          </div>
          <h1 className="mt-6 max-w-2xl text-[38px] font-black leading-tight tracking-tight text-slate-950 2xl:text-5xl">
            Create, save, and export teacher-ready resources.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 2xl:text-lg 2xl:leading-8">
            Build a polished workspace for textbook-grounded lesson plans and worksheets.
          </p>
        </section>

        <Card className="mx-auto w-full max-w-md bg-white/90 shadow-xl backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl">Signup</CardTitle>
            <p className="text-sm text-slate-500">User creation is handled by admins on the live backend.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Full Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
              <Field label="Email" error={form.formState.errors.email?.message}><Input {...form.register("email")} /></Field>
              <Field label="Password" error={form.formState.errors.password?.message}><Input type="password" {...form.register("password")} /></Field>
              <Field label="School name"><Input {...form.register("school_name")} /></Field>
              <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Signup"}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-600">
              Already have an account? <Link className="font-bold text-blue-700" href="/login">Login</Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
