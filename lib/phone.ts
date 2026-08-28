import { z } from "zod";

const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;
/** E.164: a leading `+`, a non-zero country digit, 8-15 digits in total. */
const E164_RE = /^\+[1-9]\d{7,14}$/;

/**
 * Normalize a user-entered phone to E.164 for Razorpay and the profile: an
 * Indian mobile becomes +91XXXXXXXXXX, an explicitly international number is
 * passed through as +<country><number>, and anything else is null. Shared by
 * signup, settings, the upgrade modal and the phone ask, and mirrored by
 * `backend/app/core/phone.py` — change the two together.
 */
export function normalizeIndianMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("91") && local.length === 12) local = local.slice(2);
  else if (local.startsWith("0") && local.length === 11) local = local.slice(1);
  if (INDIAN_MOBILE_RE.test(local)) return `+91${local}`;
  // Only a `+`-prefixed number gets the wider rule: a bare local string must
  // still be a valid Indian mobile, and a +91 number that failed above is a
  // malformed Indian number rather than a foreign one.
  if (!raw.trimStart().startsWith("+") || digits.startsWith("91")) return null;
  const candidate = `+${digits}`;
  return E164_RE.test(candidate) ? candidate : null;
}

export const phoneSchema = z
  .string()
  .refine(
    (v) => normalizeIndianMobile(v) !== null,
    "Enter a valid 10-digit Indian mobile number, or an international number starting with its country code."
  );
