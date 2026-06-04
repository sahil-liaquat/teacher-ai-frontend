"use client";

import { useEffect } from "react";
import { ErrorPageShell } from "@/components/error-page-shell";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorPageShell
      eyebrow="Something went wrong"
      statusCode="500"
      title="TeachPad hit a small snag."
      description="The page could not finish loading. Try again, or return to the AI tools page and continue creating teaching resources."
      onRetry={reset}
      retryLabel="Try Again"
      secondaryHref="/ai-tools"
      secondaryLabel="Explore AI Tools"
    />
  );
}
