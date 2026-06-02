"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, School, Sparkles } from "lucide-react";
import {
  CURRENT_USER_QUERY_KEY,
  backendApi,
  getCurrentUser,
  snoozePhonePrompt,
  updateProfile,
  type ApiUser,
  type PublicSchool
} from "@/lib/api";
import { normalizeIndianMobile } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function ProfileCompletionModal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: user } = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    staleTime: Infinity,
    retry: false
  });

  const state = user?.phone_prompt_state ?? "hidden";
  const needsSchool = Boolean(user?.needs_school);
  const required = state === "required";
  const visible = state === "required" || state === "optional";

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [schoolMode, setSchoolMode] = useState<"listed" | "unlisted">("listed");
  const [schoolId, setSchoolId] = useState("");
  const [pendingSchoolName, setPendingSchoolName] = useState("");
  const [coupon, setCoupon] = useState("");
  const [schools, setSchools] = useState<PublicSchool[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isTeacher = user?.role !== "admin";

  useEffect(() => {
    if (visible && needsSchool && schools.length === 0) {
      backendApi
        .publicSchools("", 0, 100)
        .then((res) => setSchools(res.items))
        .catch(() => setSchools([]));
    }
  }, [visible, needsSchool, schools.length]);

  const canRender = useMemo(() => visible && isTeacher && Boolean(user), [visible, isTeacher, user]);
  if (!canRender) return null;

  async function handleSubmit() {
    const normalized = normalizeIndianMobile(phone);
    if (!normalized) {
      setPhoneError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setPhoneError(null);
    setSubmitting(true);
    try {
      const updated = await updateProfile({
        phone: normalized,
        school_id: needsSchool && schoolMode === "listed" ? schoolId || undefined : undefined,
        pending_school_name:
          needsSchool && schoolMode === "unlisted" ? pendingSchoolName.trim() || undefined : undefined
      });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated);

      const code = coupon.trim();
      if (needsSchool && code) {
        try {
          await backendApi.billingRedeem(code);
          toast({ title: "Coupon applied", description: "Your access has been updated." });
        } catch (err) {
          toast({
            title: "Coupon not applied",
            description: err instanceof Error ? err.message : "That code could not be redeemed."
          });
        }
      }
      toast({ title: "Profile saved", description: "Thanks — you're all set." });
    } catch (err) {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : "Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setSubmitting(true);
    try {
      const updated = await snoozePhonePrompt();
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated);
    } catch {
      // If snooze fails, just close locally; it will re-prompt next load.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-teachpad-ink/30 px-4 py-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={required ? undefined : handleSkip}
    >
      <div
        className="relative flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-[28px] border border-teachpad-cardBorder bg-white p-6 shadow-[0_32px_80px_rgba(22,119,255,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 id="profile-modal-title" className="text-lg font-black text-slate-900">
            {needsSchool ? "Complete your profile" : "Add your mobile number"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {needsSchool
              ? "A few quick details so TeachPad works best for you."
              : "We use this to support your account."}
          </p>
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm font-black text-slate-900">Mobile number</span>
          <span className="flex items-center gap-2">
            <Phone className="h-5 w-5 shrink-0 text-slate-400" />
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </span>
          {phoneError ? <span className="text-xs font-semibold text-red-600">{phoneError}</span> : null}
        </label>

        {needsSchool ? (
          <>
            <label className="grid gap-1.5">
              <span className="text-sm font-black text-slate-900">Which school do you teach at?</span>
              {schoolMode === "listed" ? (
                <span className="flex items-center gap-2">
                  <School className="h-5 w-5 shrink-0 text-slate-400" />
                  <select
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-teachpad-cardBorder bg-teachpad-input px-3 text-sm font-semibold text-slate-900 outline-none"
                  >
                    <option value="">Select school</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {[s.name, s.city].filter(Boolean).join(", ")}
                      </option>
                    ))}
                  </select>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <School className="h-5 w-5 shrink-0 text-slate-400" />
                  <Input
                    placeholder="Your school"
                    value={pendingSchoolName}
                    onChange={(e) => setPendingSchoolName(e.target.value)}
                  />
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSchoolMode(schoolMode === "listed" ? "unlisted" : "listed");
                  setSchoolId("");
                  setPendingSchoolName("");
                }}
                className="text-left text-xs font-black text-blue-600 hover:text-blue-700"
              >
                {schoolMode === "listed" ? "My school is not listed" : "Choose from listed schools"}
              </button>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-black text-slate-900">Coupon code (optional)</span>
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 shrink-0 text-slate-400" />
                <Input placeholder="e.g. DIWALI" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
              </span>
            </label>
          </>
        ) : null}

        <div className="mt-2 flex items-center justify-end gap-3">
          {!required ? (
            <Button variant="ghost" onClick={handleSkip} disabled={submitting}>
              Skip for now
            </Button>
          ) : null}
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
