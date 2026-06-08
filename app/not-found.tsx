import type { Metadata } from "next";
import { ErrorPageShell } from "@/components/error-page-shell";

export const metadata: Metadata = {
  title: "Page Not Found | TeachPad",
  description: "The TeachPad page you are looking for could not be found."
};

export default function NotFound() {
  return (
    <ErrorPageShell
      eyebrow="Page not found"
      statusCode="404"
      title="This page is not in the TeachPad."
      description="The link may be old, moved, or typed incorrectly. Head back to TeachPad or explore the AI tools teachers use most."
      primaryHref="/"
      primaryLabel="Back to Home"
      secondaryHref="/ai-tools"
      secondaryLabel="Explore AI Tools"
    />
  );
}
