import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocHeader, LegalProse } from "@/components/legal/legal-prose";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy · TeachPad",
  description:
    "How TeachPad subscriptions renew, how to cancel, free-trial terms, and when refunds are available.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <LegalDocHeader
        title="Refund & Cancellation Policy"
        intro={`This policy explains how ${LEGAL.brand} subscriptions renew, how to cancel, and when refunds are available. It forms part of our Terms of Service.`}
      />

      <LegalProse>
        <h2>1. Subscriptions and renewals</h2>
        <p>
          Paid {LEGAL.brand} subscriptions are billed in advance for the plan you
          choose (for example, monthly or annual) and{" "}
          <strong>renew automatically</strong> at the end of each billing period until
          you cancel. Each renewal charges the payment method on file through our
          payment partners, {LEGAL.paymentProcessors.join(" and ")}.
        </p>

        <h2>2. Free trial</h2>
        <p>
          {LEGAL.brand} may offer a free trial of {LEGAL.trialDays} days. You will not
          be charged during the trial. Unless you cancel before the trial ends, your
          paid subscription will begin automatically and your payment method will be
          charged for the first billing period.
        </p>

        <h2>3. How to cancel</h2>
        <p>
          You can cancel at any time from <strong>Billing settings</strong> in your{" "}
          {LEGAL.brand} account. When you cancel:
        </p>
        <ul>
          <li>your subscription will not renew again, and you will not be charged further;</li>
          <li>you keep access to paid features until the end of your current paid period; and</li>
          <li>after that period ends, your account moves to the free tier (where available).</li>
        </ul>

        <h2>4. Refunds</h2>
        <p>
          Because {LEGAL.brand} is a digital service available immediately, payments for
          a billing period are generally non-refundable once that period has begun,
          except where required by law or stated below.
        </p>
        <ul>
          <li>
            <strong>First-time subscribers:</strong> if you are not satisfied, you may
            request a refund of your most recent payment within{" "}
            {LEGAL.refundWindowDays} days of that payment.
          </li>
          <li>
            <strong>Billing errors:</strong> if you were charged incorrectly or charged
            after cancelling, contact us and we will investigate and refund any amount
            charged in error.
          </li>
          <li>
            <strong>Partial periods:</strong> we do not provide pro-rated refunds for
            time remaining in a billing period after you cancel, unless required by law.
          </li>
        </ul>

        <h2>5. How to request a refund</h2>
        <p>
          Email <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> from
          the address associated with your account, including your account email and the
          reason for your request. We aim to respond within a few business days.
        </p>

        <h2>6. How refunds are processed</h2>
        <p>
          Approved refunds are made to your original payment method through{" "}
          {LEGAL.paymentProcessors.join(" or ")}. Depending on your bank or card
          issuer, it may take around 5–10 business days for the refund to appear.
        </p>

        <h2>7. Failed payments</h2>
        <p>
          If a renewal payment fails, we may retry it or pause your access until payment
          succeeds. If payment cannot be collected, your subscription may be cancelled.
        </p>

        <h2>8. Contact us</h2>
        <p>
          Questions about billing, cancellations, or refunds? Contact{" "}
          <strong>{LEGAL.company}</strong> at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> or visit our{" "}
          <Link href={LEGAL_LINKS.contact}>Contact page</Link>. See also our{" "}
          <Link href={LEGAL_LINKS.terms}>Terms of Service</Link>.
        </p>
      </LegalProse>
    </>
  );
}
