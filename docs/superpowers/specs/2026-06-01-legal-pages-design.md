# Legal & Policy Pages — Design (2026-06-01)

## Goal

Add the legal/policy pages and links TeachPad needs to (a) clear the **Razorpay
go-live** checklist, (b) complete **Google OAuth ("Sign in with Google")
verification**, and (c) meet baseline obligations for a paid SaaS that processes
Indian schoolteachers' personal data.

## Drivers & external requirements

- **Razorpay activation** requires four publicly reachable pages: Privacy Policy,
  Terms & Conditions, **Refund/Cancellation Policy**, and **Contact Us**.
- **Google OAuth verification** requires a Privacy Policy hosted on the app's
  domain, linked from the **homepage** and the **OAuth consent screen**, that
  discloses how Google user data is used and affirms compliance with the Google
  API Services User Data Policy (incl. **Limited Use**).
- **DPDP Act, 2023** (India) is the governing privacy law: disclose data
  collected, purposes, processors, cross-border transfer, data-principal rights,
  and a published **Grievance Officer** contact.

## Scope (this branch)

Four static pages at `/privacy`, `/terms`, `/refund`, `/contact`, wired into the
marketing footer, the signup consent line, and the billing point-of-payment.
Content is India/DPDP-aware and grounded in TeachPad's real stack. All
business-specific values are centralized as clearly-marked `[REVIEW: …]`
placeholders for the owner/lawyer to confirm. **This is not legal advice** — the
documents are customary templates and must be reviewed before go-live.

## Architecture

- `lib/legal.ts` — single source of truth: company identity, contact + grievance
  emails, jurisdiction, effective/last-updated dates, payment processors, and the
  subprocessor list. Placeholders prefixed `[REVIEW: …]`.
- `components/legal/legal-prose.tsx` — dependency-free prose styling (Tailwind
  arbitrary-variant selectors; the project has no `@tailwindcss/typography`
  plugin) plus a document header (title + "Last updated") and small helpers.
- `app/(legal)/layout.tsx` — route-group layout: `MarketingHeader` + centered
  prose container + `MarketingFooter`. The route group keeps URLs at `/privacy`
  etc. (parentheses do not appear in the path).
- `app/(legal)/{privacy,terms,refund,contact}/page.tsx` — static server
  components, each exporting its own `metadata`.

## Content outline

- **Privacy:** who we are; data collected (account, school, generated content,
  usage/logs, payment status, Google sign-in profile data); purposes & legal
  bases; subprocessors + cross-border transfer; cookies/localStorage; **children's
  data stance (adults-only; students do not have accounts)**; retention;
  security; data-principal rights; **Grievance Officer**; **Google API Limited
  Use** statement; changes; contact.
- **Terms:** acceptance; eligibility (18+); service description; accounts;
  subscriptions/billing/auto-renewal/taxes; cancellation & refunds (→ Refund
  Policy); acceptable use; **IP & ownership of AI outputs + textbook/NCERT
  copyright**; **AI-accuracy disclaimer** ("grounded in the textbook, but
  verify"); third-party services; termination; warranty disclaimer; limitation of
  liability; indemnity; governing law (India); changes; contact.
- **Refund/Cancellation:** renewal mechanics; how to cancel; access-until-period-
  end; refund eligibility + how to request; processing time; trial terms.
- **Contact:** entity, emails, address, Grievance Officer, response expectations,
  links to all policies.

## Link wiring

- `marketing-footer.tsx`: add a nav row (Privacy · Terms · Refunds · Contact) +
  copyright. The footer renders on the homepage → satisfies Google's
  homepage-link requirement.
- `app/signup/page.tsx`: consent line under "Create account" — "By creating an
  account you agree to our Terms and Privacy Policy."
- `components/billing/upgrade-modal.tsx`: extend the existing reassurance line
  with Terms + Refund links (point-of-payment, Razorpay-friendly).

## Out of scope / external steps (handed to the user)

- Fill the `[REVIEW: …]` placeholders in `lib/legal.ts` (entity name, address,
  Grievance Officer, jurisdiction city, refund specifics) and ensure the
  `support@` / `privacy@` mailboxes exist.
- **Legal review** before relying on the documents commercially.
- Paste `https://teachpad.in/privacy` + `/terms` into the Google Cloud OAuth
  consent screen; verify the domain in Google Search Console.
- Add the policy URLs in the Razorpay dashboard if prompted during activation.

## Verification

`npm run lint` (= `tsc --noEmit`) must pass. Pages render under the marketing
chrome; footer / signup / upgrade-modal links resolve to the new routes.
