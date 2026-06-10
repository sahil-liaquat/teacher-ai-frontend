"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENT_USER_QUERY_KEY, completeTokenLogin, type ApiUser } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

type ConfirmationState =
  | { status: "checking"; message: string }
  | { status: "success"; message: string; purpose: "signup" | "recovery"; user: ApiUser & { name: string; role: "admin" | "teacher" } }
  | { status: "error"; message: string };

function getConfirmationParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const params = new URLSearchParams(searchParams);

  hashParams.forEach((value, key) => {
    params.set(key, value);
  });

  return params;
}

function isExpiredConfirmation(code: string, description: string) {
  const text = `${code} ${description}`.toLowerCase();
  return text.includes("expired") || text.includes("flow_state_not_found") || text.includes("otp_expired");
}

function getConfirmationErrorMessage(params: URLSearchParams, type: string) {
  const code = params.get("error_code") || params.get("code") || "";
  const description = params.get("error_description") || params.get("error") || "";

  if (isExpiredConfirmation(code, description)) {
    return type === "recovery"
      ? "This password reset link has expired or has already been used. Please request a fresh reset link from the login page."
      : "This email confirmation link has expired or has already been used. Please sign up again or request a fresh confirmation email.";
  }

  if (description) return description.replace(/\+/g, " ");
  return type === "recovery"
    ? "We could not verify this password reset link. Please request a fresh reset link and try again."
    : "We could not verify this email confirmation link. Please request a fresh confirmation email and try again.";
}

export default function ConfirmEmailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ConfirmationState>({
    status: "checking",
    message: "Checking your confirmation link..."
  });

  useEffect(() => {
    let cancelled = false;

    async function confirmEmail() {
      const params = getConfirmationParams();
      const error = params.get("error") || params.get("error_code");
      const accessToken = params.get("access_token") || "";
      const refreshToken = params.get("refresh_token") || "";
      const type = params.get("type") || "";
      const purpose = type === "recovery" ? "recovery" : "signup";

      if (window.location.hash) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      }

      if (error) {
        if (!cancelled) setState({ status: "error", message: getConfirmationErrorMessage(params, type) });
        return;
      }

      if (!accessToken || !refreshToken) {
        if (!cancelled) {
          setState({
            status: "error",
            message: "This confirmation link is missing its session tokens. Please open the latest email from your inbox."
          });
        }
        return;
      }

      try {
        const user = await completeTokenLogin({ access_token: accessToken, refresh_token: refreshToken });
        if (cancelled) return;

        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
        setState({
          status: "success",
          message: purpose === "recovery"
            ? "Your reset link is verified. Continue to create a new password."
            : "Your email is verified. You are signed in now.",
          purpose,
          user
        });

        window.setTimeout(() => {
          router.replace(purpose === "recovery" ? "/reset-password" : user.role === "admin" ? "/admin" : "/dashboard");
          router.refresh();
        }, 1600);
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: getErrorMessage(error, "The link was verified, but we could not continue. Please try again.")
          });
        }
      }
    }

    confirmEmail();

    return () => {
      cancelled = true;
    };
  }, [queryClient, router]);

  const content = useMemo(() => {
    if (state.status === "checking") {
      return {
        icon: <Loader2 className="h-7 w-7 animate-spin" />,
        title: "Verifying email",
        message: state.message,
        tone: "bg-blue-50 text-teachpad-blue"
      };
    }

    if (state.status === "success") {
      return {
        icon: <CheckCircle2 className="h-7 w-7" />,
        title: state.purpose === "recovery" ? "Reset link verified" : "Email verified",
        message: state.message,
        tone: "bg-emerald-50 text-emerald-600"
      };
    }

    return {
      icon: <AlertTriangle className="h-7 w-7" />,
      title: "Link could not be verified",
      message: state.message,
      tone: "bg-red-50 text-red-600"
    };
  }, [state]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 py-8">
      <div className="w-full max-w-[500px] rounded-[28px] border border-teachpad-cardBorder bg-white px-7 py-8 text-center shadow-[0_28px_80px_var(--teachpad-shadowCard)] sm:px-9 sm:py-10">
        <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] ${content.tone}`}>
          {content.icon}
        </div>
        <MailCheck className="mx-auto mb-4 h-8 w-8 text-teachpad-muted" />
        <h1 className="text-3xl font-black tracking-tight text-teachpad-ink">{content.title}</h1>
        <p className="mt-3 text-base font-semibold leading-7 text-teachpad-muted">{content.message}</p>

        {state.status === "success" ? (
          <Link href={state.purpose === "recovery" ? "/reset-password" : state.user.role === "admin" ? "/admin" : "/dashboard"} className="mt-7 block">
            <Button className="h-14 w-full rounded-[16px] text-base font-black">Continue</Button>
          </Link>
        ) : state.status === "error" ? (
          <Link href="/login" className="mt-7 block">
            <Button className="h-14 w-full rounded-[16px] text-base font-black">Go to login</Button>
          </Link>
        ) : null}
      </div>
    </main>
  );
}
