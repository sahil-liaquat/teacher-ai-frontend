/**
 * Single source of truth for TeachPad's legal / policy pages
 * (Privacy Policy, Terms of Service, Refund & Cancellation, Contact).
 *
 * All policy pages read from here, so editing a value updates every page at once.
 * The documents are customary templates grounded in TeachPad's actual stack and
 * are NOT a substitute for legal advice — have them reviewed before relying on them.
 */

export const LEGAL = {
  /** Public product / brand name. */
  brand: "TeachPad",

  /** Primary marketing domain (no trailing slash). */
  website: "https://teachpad.in",

  /** The legal entity that operates TeachPad (DPDP + Razorpay). */
  company: "ONE-SKOOL EDGETECH PRIVATE LIMITED",

  /** Registered place of business — required for DPDP + Razorpay. */
  address:
    "C/o Liaqat Ali, Near Govt Primary School, Kathua, Kathua, Kathua, Jammu & Kashmir, India, 184101",

  country: "India",

  /**
   * Payment processor(s) currently integrated for subscriptions. Surfaced in the
   * Terms and Refund policy. Add others (e.g. Stripe) here — and to SUBPROCESSORS
   * below — when you integrate them.
   */
  paymentProcessors: ["Razorpay"],

  /** General support / business contact (catch-all @teachpad.in). */
  contactEmail: "support@teachpad.in",

  /** Privacy / data-protection contact. */
  privacyEmail: "privacy@teachpad.in",

  /**
   * Grievance Officer — the DPDP Act, 2023 requires a published contact to whom
   * data principals can address grievances.
   */
  grievanceOfficer: {
    name: "Shreyas Jamkhandi",
    email: "grievance@teachpad.in",
  },

  /** Courts with exclusive jurisdiction for the Terms of Service. */
  jurisdiction: "Kathua, Jammu & Kashmir, India",

  /**
   * Document dates. Keep these in sync whenever the policy text is revised — they
   * are surfaced as "Last updated" on every page.
   */
  effectiveDate: "1 June 2026",
  lastUpdated: "1 June 2026",

  /** Free-trial length, in days. Surfaced in the Terms and Refund policy. */
  trialDays: "7",
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
