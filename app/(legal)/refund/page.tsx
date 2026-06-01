import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocHeader, LegalProse } from "@/components/legal/legal-prose";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy · TeachPad",
  description:
    "How TeachPad subscriptions renew, how to cancel, free-trial terms, and our no-refund policy.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <LegalDocHeader
        title="Refund & Cancellation Policy"
        intro={`This policy explains how ${LEGAL.brand} subscriptions renew, how to cancel, and our refund policy. It forms part of our Terms of Service.`}
      />

      <LegalProse>
        <h2>1. Subscriptions and renewals</h2>
        <p>
          Paid {LEGAL.brand} subscriptions are billed in advance for the plan you
          choose (for example, monthly or annual) and{" "}
          <strong>renew automatically</strong> at the end of each billing period until
          you cancel. Each renewal charges the payment method on file through our
          payment partner, {LEGAL.paymentProcessors.join(" and ")}.
        </p>

        <h2>2. Free trial</h2>
        <p>
          {LEGAL.brand} offers a free trial of {LEGAL.trialDays} days. You will not be
          charged during the trial, and you can cancel any time before it ends to avoid
          being charged. The trial is your opportunity to fully evaluate {LEGAL.brand}{" "}
          before paying. Unless you cancel before the trial ends, your paid subscription
          begins automatically and your payment method is charged for the first billing
          period.
        </p>

        <h2>3. How to cancel</h2>
        <p>
          You can cancel at any time from <strong>Billing settings</strong> in your{" "}
          {LEGAL.brand} account. When you cancel:
        </p>
        <ul>
          <li>your subscription will not renew again, and you will not be charged for any future period;</li>
          <li>you keep access to paid features until the end of your current paid period; and</li>
          <li>after that period ends, your account moves to the free tier (where available).</li>
        </ul>

        <h2>4. No refunds</h2>
        <p>
          <strong>All payments are final and non-refundable.</strong> Because{" "}
          {LEGAL.brand} is a digital service that you can fully evaluate during the free
          trial before any charge is made, we do not provide refunds or credits under
          any circumstances — including for partial or unused billing periods, after a
          cancellation, for change of mind, or for dissatisfaction with the Service.
        </p>
        <p>
          When you cancel, you keep access until the end of the period you have already
          paid for (see Section 3); no refund is issued for the remaining time.
        </p>

        <h2>5. Failed payments</h2>
        <p>
          If a renewal payment fails, we may retry it or pause your access until payment
          succeeds. If payment cannot be collected, your subscription may be cancelled.
        </p>

        <h2>6. Contact us</h2>
        <p>
          Questions about billing or cancellations? Contact{" "}
          <strong>{LEGAL.company}</strong> at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> or visit our{" "}
          <Link href={LEGAL_LINKS.contact}>Contact page</Link>. See also our{" "}
          <Link href={LEGAL_LINKS.terms}>Terms of Service</Link>.
        </p>
      </LegalProse>
    </>
  );
}
