import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocHeader, LegalProse } from "@/components/legal/legal-prose";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contact Us · TeachPad",
  description: "How to reach the TeachPad team for support, billing, and privacy enquiries.",
};

export default function ContactPage() {
  return (
    <>
      <LegalDocHeader
        title="Contact Us"
        intro={`We’d love to hear from you. Reach the ${LEGAL.brand} team using the details below.`}
      />

      <LegalProse>
        <h2>Business details</h2>
        <ul>
          <li><strong>Operated by:</strong> {LEGAL.company}</li>
          <li><strong>Address:</strong> {LEGAL.address}</li>
          <li><strong>Website:</strong> <a href={LEGAL.website} target="_blank" rel="noopener noreferrer">{LEGAL.website}</a></li>
        </ul>

        <h2>Get in touch</h2>
        <ul>
          <li>
            <strong>General &amp; billing support:</strong>{" "}
            <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
          </li>
          <li>
            <strong>Privacy &amp; data requests:</strong>{" "}
            <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>
          </li>
        </ul>
        <p>
          We aim to respond to enquiries within a few business days.
        </p>

        <h2>Grievance Officer</h2>
        <p>
          For concerns about how we handle your personal data, you can contact our
          Grievance Officer under India’s Digital Personal Data Protection Act, 2023:
        </p>
        <ul>
          <li><strong>Name:</strong> {LEGAL.grievanceOfficer.name}</li>
          <li><strong>Email:</strong> <a href={`mailto:${LEGAL.grievanceOfficer.email}`}>{LEGAL.grievanceOfficer.email}</a></li>
        </ul>

        <h2>Our policies</h2>
        <ul>
          <li><Link href={LEGAL_LINKS.privacy}>Privacy Policy</Link></li>
          <li><Link href={LEGAL_LINKS.terms}>Terms of Service</Link></li>
          <li><Link href={LEGAL_LINKS.refund}>Refund &amp; Cancellation Policy</Link></li>
        </ul>
      </LegalProse>
    </>
  );
}
