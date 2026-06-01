import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocHeader, LegalProse } from "@/components/legal/legal-prose";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service · TeachPad",
  description:
    "The terms that govern your use of TeachPad — eligibility, subscriptions, acceptable use, intellectual property, and AI-content disclaimers.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <LegalDocHeader
        title="Terms of Service"
        intro={`These Terms of Service (“Terms”) are a legal agreement between you and ${LEGAL.company} (“${LEGAL.brand}”, “we”, “us”) and govern your use of ${LEGAL.brand} at ${LEGAL.website} and related services (the “Service”).`}
      />

      <LegalProse>
        <h2>1. Acceptance of these Terms</h2>
        <p>
          By creating an account, subscribing, or otherwise using the Service, you
          agree to these Terms and to our{" "}
          <Link href={LEGAL_LINKS.privacy}>Privacy Policy</Link>. If you do not agree,
          please do not use the Service.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years old and able to enter into a binding contract
          under the Indian Contract Act, 1872 to use the Service. {LEGAL.brand} is
          intended for teachers and school staff, not for use by children. If you use
          the Service on behalf of a school or institution, you confirm that you are
          authorized to accept these Terms on its behalf.
        </p>

        <h2>3. The Service</h2>
        <p>
          {LEGAL.brand} is an AI teaching assistant that generates textbook-grounded
          lesson plans, worksheets, presentations, and related materials based on the
          curriculum content and instructions you select. The materials are generated
          by artificial intelligence and are intended as a teaching aid (see Section 9).
        </p>

        <h2>4. Your account</h2>
        <p>
          You are responsible for the information you provide, for keeping your login
          credentials confidential, and for all activity under your account. Tell us
          promptly at <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>{" "}
          if you suspect unauthorized use. We may suspend or terminate accounts that
          breach these Terms.
        </p>

        <h2>5. Subscriptions, billing &amp; renewals</h2>
        <ul>
          <li>
            Some features require a paid subscription. Current plans and prices are
            shown in the app before you purchase.
          </li>
          <li>
            Unless cancelled, paid subscriptions <strong>automatically renew</strong> at
            the end of each billing period (for example, monthly or annually), and you
            authorize us and our payment partners to charge your chosen payment method
            for each renewal until you cancel.
          </li>
          <li>
            Prices are in Indian Rupees (or the currency shown at checkout) and are
            exclusive of taxes; applicable taxes, including GST, will be added where
            required.
          </li>
          <li>
            We may change our prices or plans. We will give reasonable notice, and
            changes take effect at your next renewal.
          </li>
          <li>
            Payments are processed by our payment partners, {LEGAL.paymentProcessors.join(" and ")}.
            Your use of their services is subject to their terms and privacy policies.
          </li>
        </ul>

        <h2>6. Cancellation &amp; refunds</h2>
        <p>
          You can cancel your subscription at any time from your billing settings.
          Cancellation, trial, and refund details are set out in our{" "}
          <Link href={LEGAL_LINKS.refund}>Refund &amp; Cancellation Policy</Link>, which
          forms part of these Terms.
        </p>

        <h2>7. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>use the Service for any unlawful purpose or in breach of these Terms;</li>
          <li>upload or generate content that is illegal, infringing, abusive, or harmful;</li>
          <li>upload content you do not have the right to use, or infringe anyone’s intellectual-property rights;</li>
          <li>resell, sublicense, or commercially exploit the Service except as expressly permitted;</li>
          <li>attempt to disrupt, reverse-engineer, scrape, or gain unauthorized access to the Service or its underlying systems; or</li>
          <li>use the Service to undermine academic integrity or in any way that violates your institution’s policies or applicable law.</li>
        </ul>

        <h2>8. Intellectual property</h2>
        <p>
          The Service, including its software, design, and the {LEGAL.brand} name and
          logo, is owned by {LEGAL.company} and protected by law. We grant you a
          limited, non-exclusive, non-transferable right to use the Service in
          accordance with these Terms.
        </p>
        <p>
          As between you and us, <strong>you own the materials you generate</strong>{" "}
          (“Outputs”) and may use them for your teaching. You grant us a licence to
          host, store, process, and display your inputs and Outputs as needed to
          operate and improve the Service.
        </p>
        <p>
          Textbooks, curriculum, and other source materials remain the property of
          their respective owners (for example, NCERT or the relevant education board).
          {" "}{LEGAL.brand} provides AI assistance grounded in such content for
          legitimate educational use. You are responsible for ensuring that your use of
          textbooks and of the Outputs complies with applicable copyright law and your
          institution’s policies.
        </p>

        <h2>9. AI-generated content — important disclaimer</h2>
        <p>
          Outputs are generated by artificial intelligence. Although we design the
          Service to ground Outputs in the textbook content you select, Outputs{" "}
          <strong>may be inaccurate, incomplete, or unsuitable</strong> for a
          particular purpose. We do not warrant the accuracy of any Output. You are
          responsible for reviewing and verifying every Output before using it in the
          classroom, in assessments, or elsewhere. The Service is a teaching aid and is
          not a substitute for your professional judgement.
        </p>

        <h2>10. Third-party services</h2>
        <p>
          The Service relies on third-party providers for authentication, payments, AI
          generation, hosting, and email (see our{" "}
          <Link href={LEGAL_LINKS.privacy}>Privacy Policy</Link>). We are not
          responsible for third-party services, and your use of them may be subject to
          their own terms.
        </p>

        <h2>11. Termination</h2>
        <p>
          You may stop using the Service and close your account at any time. We may
          suspend or terminate your access if you breach these Terms or if we
          reasonably need to protect the Service or other users. Sections that by their
          nature should survive termination (including intellectual property,
          disclaimers, limitation of liability, and governing law) will continue to
          apply.
        </p>

        <h2>12. Disclaimer of warranties</h2>
        <p>
          To the maximum extent permitted by law, the Service is provided “as is” and
          “as available”, without warranties of any kind, whether express or implied,
          including warranties of merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the Service will be uninterrupted,
          error-free, or secure.
        </p>

        <h2>13. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {LEGAL.company} will not be liable for
          any indirect, incidental, special, consequential, or punitive damages, or for
          any loss of data, profits, or goodwill. Our total liability for any claim
          relating to the Service is limited to the amount you paid us for the Service
          in the twelve (12) months before the event giving rise to the claim.
        </p>

        <h2>14. Indemnification</h2>
        <p>
          You agree to indemnify and hold {LEGAL.company} harmless from any claims,
          losses, or expenses (including reasonable legal fees) arising out of your use
          of the Service, your content, or your breach of these Terms or of any law or
          third-party right.
        </p>

        <h2>15. Governing law &amp; jurisdiction</h2>
        <p>
          These Terms are governed by the laws of India. The courts at{" "}
          {LEGAL.jurisdiction} will have exclusive jurisdiction over any dispute
          arising out of or relating to these Terms or the Service.
        </p>

        <h2>16. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. When we do, we will revise the
          “Last updated” date above and, for material changes, take reasonable steps to
          notify you. Your continued use of the Service after an update means you accept
          the revised Terms.
        </p>

        <h2>17. Contact us</h2>
        <p>
          Questions about these Terms? Contact <strong>{LEGAL.company}</strong> at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> or through our{" "}
          <Link href={LEGAL_LINKS.contact}>Contact page</Link>.
        </p>
      </LegalProse>
    </>
  );
}
