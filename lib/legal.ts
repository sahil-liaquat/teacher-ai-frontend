/**
 * Single source of truth for TeachPad's legal / policy pages
 * (Privacy Policy, Terms of Service, Refund & Cancellation, Contact).
 *
 * ⚠️  REVIEW BEFORE GO-LIVE
 * The values tagged `[REVIEW: …]` below are placeholders. They must be confirmed
 * by TeachPad (and ideally a lawyer) before these documents are relied upon.
 * Search this file for "REVIEW" to find every blank in one place. The policy
 * pages all read from here, so filling these in updates every page at once.
 *
 * These documents are customary templates grounded in TeachPad's actual stack;
 * they are NOT legal advice.
 */

export const LEGAL = {
  /** Public product / brand name. */
  brand: "TeachPad",

  /** Primary marketing domain (no trailing slash). */
  website: "https://teachpad.in",

  /**
   * The legal entity that operates TeachPad. Required by both the DPDP Act and
   * Razorpay's merchant activation. Confirm the exact registered name and type
   * (e.g. "TeachPad Technologies Private Limited", a sole proprietorship, etc.).
   */
  company: "[REVIEW: Registered legal entity name]",

  /** Registered place of business — required for DPDP + Razorpay. */
  address: "[REVIEW: Registered business address, City, State, PIN], India",

  country: "India",

  /**
   * Payment processor(s) currently integrated for subscriptions. Surfaced in the
   * Terms and Refund policy. Add others (e.g. Stripe) here — and to SUBPROCESSORS
   * below — when you integrate them.
   */
  paymentProcessors: ["Razorpay"],

  /** General support / business contact. Ensure this mailbox exists. */
  contactEmail: "support@teachpad.in",

  /** Privacy / data-protection contact. Ensure this mailbox exists. */
  privacyEmail: "privacy@teachpad.in",

  /**
   * Grievance Officer — the DPDP Act, 2023 requires a published contact to whom
   * data principals can address grievances.
   */
  grievanceOfficer: {
    name: "[REVIEW: Grievance Officer name]",
    email: "privacy@teachpad.in",
  },

  /** Courts with exclusive jurisdiction for the Terms of Service. */
  jurisdiction: "[REVIEW: City, State], India",

  /**
   * Document dates. Keep these in sync whenever the policy text is revised — they
   * are surfaced as "Last updated" on every page.
   */
  effectiveDate: "1 June 2026",
  lastUpdated: "1 June 2026",

  /**
   * Free-trial length, in days. Surfaced in the Terms and Refund policy. Set to
   * 0 if there is no trial. (TeachPad currently shows a trial-status pill.)
   */
  trialDays: "[REVIEW: trial length in days, e.g. 14]",

  /**
   * Refund window (in days) for first-time subscription purchases, if you offer
   * one. Set to 0 / "no refunds" if subscriptions are non-refundable once the
   * billing period starts. This is a business decision — confirm it.
   */
  refundWindowDays: "[REVIEW: refund window in days for first purchase, or 0]",
} as const;

export type Subprocessor = {
  name: string;
  /** What TeachPad uses them for. */
  purpose: string;
  /** Where the processing primarily takes place (drives cross-border disclosure). */
  location: string;
  /** Link to the vendor's own privacy policy. */
  url: string;
};

/**
 * Third-party processors ("subprocessors") that may handle personal data on
 * TeachPad's behalf. Disclosed in the Privacy Policy. Keep this in sync with the
 * services the app actually integrates — drop a row if a vendor is removed.
 */
export const SUBPROCESSORS: Subprocessor[] = [
  {
    name: "Supabase",
    purpose: "Authentication, identity, and account management",
    location: "United States / EU",
    url: "https://supabase.com/privacy",
  },
  {
    name: "Render",
    purpose: "Application hosting and the PostgreSQL application database",
    location: "United States",
    url: "https://render.com/privacy",
  },
  {
    name: "Pinecone",
    purpose: "Vector database powering textbook retrieval",
    location: "United States",
    url: "https://www.pinecone.io/privacy/",
  },
  {
    name: "Google (Gemini / Vertex AI)",
    purpose: "AI generation of teaching materials, and Google Sign-In",
    location: "United States / Global",
    url: "https://policies.google.com/privacy",
  },
  {
    name: "Netlify",
    purpose: "Frontend web hosting and content delivery",
    location: "United States",
    url: "https://www.netlify.com/privacy/",
  },
  {
    name: "Resend",
    purpose: "Transactional and account confirmation emails",
    location: "United States",
    url: "https://resend.com/legal/privacy-policy",
  },
  {
    name: "Razorpay",
    purpose: "Payment processing for subscriptions (India)",
    location: "India",
    url: "https://razorpay.com/privacy/",
  },
  {
    name: "Stripe",
    purpose: "Payment processing for international subscriptions",
    location: "United States / Global",
    url: "https://stripe.com/privacy",
  },
  {
    name: "Cloudflare",
    purpose: "DNS and network security",
    location: "Global",
    url: "https://www.cloudflare.com/privacypolicy/",
  },
];

/** Canonical paths for the policy pages, so links stay consistent across the app. */
export const LEGAL_LINKS = {
  privacy: "/privacy",
  terms: "/terms",
  refund: "/refund",
  contact: "/contact",
} as const;
