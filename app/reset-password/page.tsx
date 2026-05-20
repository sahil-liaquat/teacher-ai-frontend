"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { clearToken, getToken, resetPassword } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Confirm your password.")
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match."
});

function getRecoveryToken() {
  if (typeof window === "undefined") return "";
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  return hashParams.get("access_token") || searchParams.get("access_token") || getToken() || "";
}

function getResetPasswordErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Please request a new reset link.";
  const normalized = message.toLowerCase();

  if (normalized.includes("expired") || normalized.includes("session_not_found") || normalized.includes("session_expired") || normalized.includes("invalid jwt")) {
    return "This reset link has expired or is no longer valid. Please request a fresh reset link.";
  }

  if (normalized.includes("same_password")) {
    return "Please choose a new password that is different from your current password.";
  }

  if (normalized.includes("weak") || normalized.includes("password")) {
    return message;
  }

  return message;
}

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  useEffect(() => {
    const token = getRecoveryToken();
    setAccessToken(token);
    if (token && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const hasToken = useMemo(() => Boolean(accessToken), [accessToken]);

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!accessToken) {
      toast({ title: "Reset link is invalid", description: "Please request a new password reset email." });
      return;
    }

    try {
      const response = await resetPassword(accessToken, values.password);
      setIsComplete(true);
      clearToken();
      form.reset();
      toast({ title: "Password updated", description: response.message || "You can now log in." });
    } catch (error) {
      toast({ title: "Password reset failed", description: getResetPasswordErrorMessage(error) });
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 py-8">
      <div className="w-full max-w-[480px] rounded-[28px] border border-teachpad-cardBorder bg-white px-7 py-8 shadow-[0_28px_80px_var(--teachpad-shadowCard)] sm:px-9 sm:py-10">
        <div className="mb-7">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-blue-50 text-teachpad-blue">
            {isComplete ? <CheckCircle2 className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-teachpad-ink">
            {isComplete ? "Password updated" : "Create new password"}
          </h1>
          <p className="mt-3 text-base font-semibold leading-6 text-teachpad-muted">
            {isComplete
              ? "Your password has been changed. You can sign in with the new password now."
              : hasToken
                ? "Choose a new password for your account."
                : "This reset link is missing or expired. Request a new link from the login page."}
          </p>
        </div>

        {isComplete ? (
          <Link href="/login">
            <Button className="h-14 w-full rounded-[16px] text-base font-black">Go to login</Button>
          </Link>
        ) : hasToken ? (
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <Field label="New password" error={form.formState.errors.password?.message}>
              <Input
                type="password"
                {...form.register("password")}
                placeholder="••••••••"
                className="h-14 rounded-[18px] px-5 text-base font-semibold"
              />
            </Field>
            <Field label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
              <Input
                type="password"
                {...form.register("confirmPassword")}
                placeholder="••••••••"
                className="h-14 rounded-[18px] px-5 text-base font-semibold"
              />
            </Field>
            <Button className="h-14 w-full rounded-[16px] text-base font-black" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        ) : (
          <Link href="/login">
            <Button className="h-14 w-full rounded-[16px] text-base font-black">Request new link</Button>
          </Link>
        )}
      </div>
    </main>
  );
}
