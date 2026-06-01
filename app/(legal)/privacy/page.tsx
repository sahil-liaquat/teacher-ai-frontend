import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocHeader, LegalProse } from "@/components/legal/legal-prose";
import { LEGAL, LEGAL_LINKS, SUBPROCESSORS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy · TeachPad",
  description:
    "How TeachPad collects, uses, shares, and protects your personal data, and the rights you have under India's Digital Personal Data Protection Act, 2023.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <LegalDocHeader
        title="Privacy Policy"
        intro={`This Privacy Policy explains how ${LEGAL.company} (“${LEGAL.brand}”, “we”, “us”) collects, uses, shares, and protects your personal data when you use ${LEGAL.brand} at ${LEGAL.website} and related services (the “Service”).`}
      />

      <LegalProse>
        <h2>1. Who we are</h2>
        <p>
          {LEGAL.brand} is an AI teaching assistant that helps teachers generate
          textbook-grounded lesson plans, worksheets, and presentations. The
          Service is operated by <strong>{LEGAL.company}</strong>, based at{" "}
          {LEGAL.address}. For the purposes of the Digital Personal Data Protection
          Act, 2023 (the “DPDP Act”), we are the <strong>Data Fiduciary</strong>{" "}
          responsible for your personal data, and you are the{" "}
          <strong>Data Principal</strong>.
        </p>
        <p>
          If you have any questions about this policy or how we handle your data,
          contact us at <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>{" "}
          or via our <Link href={LEGAL_LINKS.contact}>Contact page</Link>.
        </p>

        <h2>2. The data we collect</h2>
        <p>We collect the following categories of personal data:</p>
        <ul>
          <li>
            <strong>Account data</strong> — your name, email address, password
            (stored only in hashed form by our authentication provider), the school
            you select or enter, and your role (for example, teacher or
            administrator).
          </li>
          <li>
            <strong>Content you create</strong> — the inputs you provide (such as
            the board, class, textbook, chapter, topic, and instructions you choose)
            and the lesson plans, worksheets, presentations, and other materials you
            generate and save.
          </li>
          <li>
            <strong>Subscription &amp; payment data</strong> — your plan, subscription
            status, and limited transaction identifiers. Card and bank details are
            collected and processed directly by our payment partners (see Section 7);
            we do <strong>not</strong> store full card numbers.
          </li>
          <li>
            <strong>Usage &amp; device data</strong> — log information such as your IP
            address, browser and device type, pages visited, generation requests, and
            timestamps, which we use to operate, secure, and improve the Service.
          </li>
          <li>
            <strong>Google sign-in data</strong> — if you choose “Sign in with Google”,
            we receive your name, email address, profile picture, and Google account
            identifier, as permitted by the permissions you approve (see Section 5).
          </li>
        </ul>

        <h2>3. How we use your data</h2>
        <p>We use your personal data to:</p>
        <ul>
          <li>provide, operate, and maintain the Service and generate the materials you request;</li>
          <li>create, authenticate, and secure your account;</li>
          <li>process subscriptions, payments, and renewals;</li>
          <li>send you confirmations, service notices, and respond to your support requests;</li>
          <li>monitor, troubleshoot, improve, and protect the Service, and prevent abuse and fraud; and</li>
          <li>comply with applicable laws and enforce our <Link href={LEGAL_LINKS.terms}>Terms of Service</Link>.</li>
        </ul>

        <h2>4. Legal basis &amp; your consent</h2>
        <p>
          We process your personal data on the basis of your <strong>consent</strong>,
          which you give when you create an account and use the Service, and for the
          other lawful purposes permitted under the DPDP Act, including performing our
          contract with you and certain legitimate uses. You may withdraw your consent
          at any time (see Section 12); withdrawing consent may mean we can no longer
          provide parts of the Service. We do <strong>not</strong> sell your personal
          data.
        </p>

        <h2>5. Google user data &amp; Limited Use</h2>
        <p>
          If you sign in with Google, we use the Google account information described
          in Section 2 solely to authenticate you and to create and populate your
          {" "}{LEGAL.brand} profile. We do not use this information for advertising,
          and we do not sell it.
        </p>
        <p>
          {LEGAL.brand}’s use and transfer of information received from Google APIs to
          any other application will adhere to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the <strong>Limited Use</strong> requirements. We only access,
          use, store, or share Google user data to provide or improve features that
          are prominent in {LEGAL.brand}, and only as described in this policy or with
          your consent, or where required by law.
        </p>

        <h2>6. AI generation and your content</h2>
        <p>
          When you generate materials, the textbook context and the instructions you
          provide are sent to our AI provider (Google Gemini / Vertex AI) to produce a
          result. We design our prompts to ground responses in the textbook content
          you select. Where our providers offer such controls, we configure them so
          that your content is used to deliver the Service and is not used to train
          their general-purpose models. You retain rights to the materials you
          generate, as set out in our <Link href={LEGAL_LINKS.terms}>Terms of Service</Link>.
        </p>

        <h2>7. Service providers &amp; international transfers</h2>
        <p>
          We share personal data with trusted third-party providers (“Data
          Processors”) who help us operate the Service, under contracts that require
          them to protect your data and use it only on our instructions. These
          providers, and where they process data, are:
        </p>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Location</th>
              <th>Privacy policy</th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{p.purpose}</td>
                <td>{p.location}</td>
                <td>
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Some of these providers process data outside India (for example, in the
          United States). Where we transfer your personal data outside India, we do so
          in accordance with the DPDP Act and take reasonable steps to ensure your
          data remains protected. By using the Service, you consent to these
          transfers.
        </p>

        <h2>8. Cookies and local storage</h2>
        <p>
          We use your browser’s local storage and essential cookies to keep you signed
          in (by storing authentication tokens) and to save drafts of your work. These
          are necessary for the Service to function. We do not use third-party
          advertising cookies. If we introduce analytics or similar technologies in
          future, we will update this policy.
        </p>

        <h2>9. Children’s data</h2>
        <p>
          {LEGAL.brand} is built for teachers and school staff, who must be adults
          (18 years or older). The Service is <strong>not directed to children</strong>,
          students do not create accounts, and we do not knowingly collect personal
          data from children. The teaching materials concern curriculum content, not
          identifiable students. If you believe a child has provided us with personal
          data, please contact us at <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>{" "}
          and we will delete it.
        </p>

        <h2>10. How long we keep your data</h2>
        <p>
          We keep your account and content data for as long as your account is active
          and as needed to provide the Service. After your account is closed, we retain
          data only as long as necessary to meet legal, tax, and accounting
          obligations or to resolve disputes, after which we delete or anonymize it.
          You can ask us to delete your data at any time (see Section 12).
        </p>

        <h2>11. How we protect your data</h2>
        <p>
          We protect your data using encryption in transit (HTTPS), access controls,
          and reputable infrastructure providers, and we limit access to those who
          need it to operate the Service. No method of transmission or storage is
          completely secure, but we work to protect your data and to notify you and the
          relevant authorities of a personal-data breach as required by law.
        </p>

        <h2>12. Your rights</h2>
        <p>As a Data Principal under the DPDP Act, you have the right to:</p>
        <ul>
          <li>access a summary of the personal data we process about you;</li>
          <li>request correction, completion, or updating of your data;</li>
          <li>request erasure of your personal data;</li>
          <li>withdraw your consent at any time;</li>
          <li>nominate another person to exercise your rights in case of death or incapacity; and</li>
          <li>have your grievances addressed (see Section 13).</li>
        </ul>
        <p>
          To exercise any of these rights, email{" "}
          <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. We may need
          to verify your identity before acting on your request.
        </p>

        <h2>13. Grievance Officer</h2>
        <p>
          In line with the DPDP Act, you can contact our Grievance Officer with any
          concern about how we handle your personal data:
        </p>
        <ul>
          <li><strong>Grievance Officer:</strong> {LEGAL.grievanceOfficer.name}</li>
          <li><strong>Email:</strong> <a href={`mailto:${LEGAL.grievanceOfficer.email}`}>{LEGAL.grievanceOfficer.email}</a></li>
          <li><strong>Address:</strong> {LEGAL.company}, {LEGAL.address}</li>
        </ul>
        <p>
          We aim to acknowledge and resolve grievances within the timelines required by
          applicable law.
        </p>

        <h2>14. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we do, we will
          revise the “Last updated” date above and, for material changes, take
          reasonable steps to notify you. Your continued use of the Service after an
          update means you accept the revised policy.
        </p>

        <h2>15. Contact us</h2>
        <p>
          For any privacy questions or requests, contact{" "}
          <strong>{LEGAL.company}</strong> at{" "}
          <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>, or write to
          us at {LEGAL.address}. You can also reach us through our{" "}
          <Link href={LEGAL_LINKS.contact}>Contact page</Link>.
        </p>
      </LegalProse>
    </>
  );
}
