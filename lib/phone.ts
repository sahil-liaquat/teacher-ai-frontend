import { z } from "zod";

/**
 * Normalize a user-entered phone to E.164 (+91XXXXXXXXXX) for Razorpay, or null
 * if it is not a valid Indian mobile number. Shared by the upgrade modal and
 * the settings page so validation stays consistent in both places.
 */
export function normalizeIndianMobile(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("91") && d.length === 12) d = d.slice(2);
  else if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

export const phoneSchema = z
  .string()
  .refine((v) => normalizeIndianMobile(v) !== null, "Enter a valid 10-digit Indian mobile number.");
