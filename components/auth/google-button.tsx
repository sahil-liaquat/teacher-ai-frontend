"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { getSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * "Continue with Google" button. Kicks off Supabase Google OAuth (PKCE) and
 * redirects the browser to Google; the return trip is handled by
 * /auth/callback. Renders nothing when Supabase env vars are unset.
 */
export function GoogleButton({
  label = "Continue with Google",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseClient();

  if (!supabase) return null;

  async function handleGoogle() {
    if (!supabase) return; // narrows the type inside this async closure
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      // Success → browser is redirecting to Google; leave `loading` true.
    } catch (err) {
      toast({
        title: "Google sign-in failed",
        description: getErrorMessage(err, "Please try again."),
        variant: "error",
      });
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className={cn(
        "flex h-[52px] min-h-[52px] w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-5 text-base font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:pointer-events-none disabled:opacity-60",
        className
      )}
    >
      <GoogleIcon className="h-5 w-5" />
      {loading ? "Redirecting…" : label}
    </button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
