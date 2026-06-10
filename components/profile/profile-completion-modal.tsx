"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, Sparkles } from "lucide-react";
import {
  CURRENT_USER_QUERY_KEY,
  backendApi,
  getCurrentUser,
  updateProfile,
  type ApiUser
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
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

  const visible = user?.phone_prompt_state === "required";

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isTeacher = user?.role !== "admin";

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
        phone: normalized
      });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated);

      const code = coupon.trim();
      if (code) {
        try {
          await backendApi.billingRedeem(code);
          toast({ title: "Coupon applied", description: "Your access has been updated.", variant: "success" });
        } catch (err) {
          toast({
            title: "Coupon not applied",
            description: getErrorMessage(err, "That code could not be redeemed."),
            variant: "error"
          });
        }
      }
      toast({ title: "Profile saved", description: "Thanks — you're all set.", variant: "success" });
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

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-teachpad-ink/30 px-4 py-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="relative flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-[28px] border border-teachpad-cardBorder bg-white p-6 shadow-[0_32px_80px_rgba(22,119,255,0.18)]">
        <div>
          <h2 id="profile-modal-title" className="text-lg font-black text-slate-900">
            Add your mobile number
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            We use this to support your account.
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

        <label className="grid gap-1.5">
          <span className="text-sm font-black text-slate-900">Coupon code (optional)</span>
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-slate-400" />
            <Input placeholder="e.g. DIWALI" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
          </span>
        </label>

        <div className="mt-2 flex items-center justify-end gap-3">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
