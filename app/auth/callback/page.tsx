"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENT_USER_QUERY_KEY, completeTokenLogin, type ApiUser } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase";

type State =
  | { status: "checking" }
  | { status: "success"; user: ApiUser & { name: string; role: "admin" | "teacher" } }
  | { status: "error"; message: string };

export default function GoogleCallbackPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<State>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const params = new URLSearchParams(window.location.search);
      const errorDescription = params.get("error_description") || params.get("error");
      const code = params.get("code");

      // Strip the code/error from the URL so it never lingers in history.
      window.history.replaceState(null, "", window.location.pathname);

      if (errorDescription) {
        if (!cancelled) setState({ status: "error", message: errorDescription.replace(/\+/g, " ") });
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        if (!cancelled) {
          setState({ status: "error", message: "Google sign-in is not configured. Please use email and password." });
        }
        return;
      }
      if (!code) {
        if (!cancelled) {
          setState({ status: "error", message: "This sign-in link is missing its authorization code. Please try again." });
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        const session = data.session;
        if (!session?.access_token || !session?.refresh_token) {
          throw new Error("Google did not return a valid session. Please try again.");
        }

        const user = await completeTokenLogin({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        // Drop the transient Supabase session — the app's own token system owns auth now.
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          /* best-effort */
        }

        if (cancelled) return;
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
        setState({ status: "success", user });

        window.setTimeout(() => {
          router.replace(user.role === "admin" ? "/admin" : "/dashboard");
          router.refresh();
        }, 800);
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "We could not complete Google sign-in. Please try again.",
          });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [queryClient, router]);

  const content = useMemo(() => {
    if (state.status === "checking") {
      return { icon: <Loader2 className="h-7 w-7 animate-spin" />, title: "Signing you in", message: "Finishing your Google sign-in…", tone: "bg-blue-50 text-teachpad-blue" };
    }
    if (state.status === "success") {
      return { icon: <CheckCircle2 className="h-7 w-7" />, title: "You're in", message: "Taking you to your dashboard…", tone: "bg-emerald-50 text-emerald-600" };
    }
    return { icon: <AlertTriangle className="h-7 w-7" />, title: "Sign-in failed", message: state.message, tone: "bg-red-50 text-red-600" };
  }, [state]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 py-8">
      <div className="w-full max-w-[500px] rounded-[28px] border border-teachpad-cardBorder bg-white px-7 py-8 text-center shadow-[0_28px_80px_var(--teachpad-shadowCard)] sm:px-9 sm:py-10">
        <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] ${content.tone}`}>
          {content.icon}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-teachpad-ink">{content.title}</h1>
        <p className="mt-3 text-base font-semibold leading-7 text-teachpad-muted">{content.message}</p>
        {state.status === "error" && (
          <Link href="/login" className="mt-7 block">
            <Button className="h-14 w-full rounded-[16px] text-base font-black">Go to login</Button>
          </Link>
        )}
      </div>
    </main>
  );
}
