"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export const REFERRAL_PROMO_CODE_KEY = "referral_promo_code";
const REFERRAL_EXPIRES_AT_KEY = "referral_promo_code_expires_at";
const REFERRAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function getStoredReferralPromoCode() {
  if (typeof window === "undefined") return "";
  const expiresAt = Number(window.localStorage.getItem(REFERRAL_EXPIRES_AT_KEY) || 0);
  if (expiresAt && expiresAt < Date.now()) {
    clearStoredReferralPromoCode();
    return "";
  }
  return window.localStorage.getItem(REFERRAL_PROMO_CODE_KEY) || "";
}

export function clearStoredReferralPromoCode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFERRAL_PROMO_CODE_KEY);
  window.localStorage.removeItem(REFERRAL_EXPIRES_AT_KEY);
}

export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("ref") || searchParams.get("promo_code");
    if (!code?.trim()) return;
    window.localStorage.setItem(REFERRAL_PROMO_CODE_KEY, code.trim());
    window.localStorage.setItem(REFERRAL_EXPIRES_AT_KEY, String(Date.now() + REFERRAL_TTL_MS));
  }, [searchParams]);

  return null;
}
