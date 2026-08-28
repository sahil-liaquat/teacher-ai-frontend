"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import {
  CURRENT_USER_QUERY_KEY,
  GENERATION_COMPLETED_EVENT,
  getCurrentUser,
  skipPhone,
  updateProfile,
  type ApiUser
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { shouldAskForPhone } from "@/lib/first-run";
import { claimGlobalCard, releaseGlobalCard } from "@/lib/global-card";
import { normalizeIndianMobile } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

/**
 * Long enough for the artifact to land and be read, and comfortably inside the
 * feedback prompt's 30s — so "phone ask first, then feedback" is an ordering
 * rather than a race.
 */
const PHONE_ASK_DELAY_MS = 6_000;

/**
 * Asks for a mobile number after a teacher has something to show for the visit,
 * as a dismissible corner card. It replaces the full-screen phone modal, which
 * had no X, no Escape and one button — 316 teachers sat behind it having never
 * generated anything.
 *
 * "Not now" persists via POST /auth/me/skip-phone: `phone_prompt_state` is
 * computed server-side, so a client-only dismissal would re-fire on reload.
 * Mounted once, globally, in the dashboard shell.
 */
export function PhoneAsk() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: user } = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    staleTime: Infinity,
    retry: false
  });

  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Read inside the (once-registered) event listener to avoid stale closures.
  const userRef = useRef<ApiUser | undefined>(user);
  userRef.current = user;
  const openRef = useRef(open);
  openRef.current = open;
  const pendingTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    function onGenerationCompleted() {
      // Re-check when the timer fires, not now — by then the teacher may have
      // saved a number on the settings page, or the feedback card may be up.
      const timeoutId = window.setTimeout(() => {
        pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== timeoutId);
        if (openRef.current) return;
        if (!shouldAskForPhone(userRef.current)) return;
        if (!claimGlobalCard("phone-ask")) return;
        setPhone("");
        setPhoneError(null);
        setOpen(true);
      }, PHONE_ASK_DELAY_MS);
      pendingTimeoutsRef.current.push(timeoutId);
    }
    window.addEventListener(GENERATION_COMPLETED_EVENT, onGenerationCompleted);
    return () => {
      window.removeEventListener(GENERATION_COMPLETED_EVENT, onGenerationCompleted);
      pendingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      pendingTimeoutsRef.current = [];
      releaseGlobalCard("phone-ask");
    };
  }, []);

  if (!open) return null;

  function close() {
    setOpen(false);
    releaseGlobalCard("phone-ask");
  }

  async function save() {
    const normalized = normalizeIndianMobile(phone);
    if (!normalized) {
      setPhoneError("Enter a 10-digit Indian mobile number, or an international one with its country code.");
      return;
    }
    setPhoneError(null);
    setSubmitting(true);
    try {
      const updated = await updateProfile({ phone: normalized });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated);
      toast({ title: "Number saved", description: "Thanks — you're all set.", variant: "success" });
      close();
    } catch (err) {
      toast({
        title: "Could not save",
        description: getErrorMessage(err, "Please try again."),
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  function notNow() {
    // Best-effort, like the feedback prompt's dismissal: close immediately and
    // let the write settle. Hiding it locally first means the card does not
    // reappear on this page even if the request is slow.
    queryClient.setQueryData<ApiUser>(CURRENT_USER_QUERY_KEY, (old) =>
      old ? { ...old, phone_prompt_state: "hidden" } : old
    );
    close();
    void skipPhone()
      .then((updated) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated))
      .catch(() => {});
  }

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-40 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-full sm:max-w-sm"
      role="dialog"
      aria-labelledby="phone-ask-title"
    >
      <div className="flex flex-col gap-3 rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_24px_60px_rgba(22,119,255,0.18)]">
        <div>
          <h2 id="phone-ask-title" className="text-base font-black text-slate-900">
            Add your mobile number
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            So we can reach you about your account. You can skip this.
          </p>
        </div>

        <label className="grid gap-1.5">
          <span className="sr-only">Mobile number</span>
          <span className="flex items-center gap-2">
            <Phone className="h-5 w-5 shrink-0 text-slate-400" />
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={phoneError ? true : undefined}
            />
          </span>
          {phoneError ? <span className="text-xs font-semibold text-red-600">{phoneError}</span> : null}
        </label>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={notNow} disabled={submitting}>
            Not now
          </Button>
          <Button onClick={save} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
