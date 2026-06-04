"use client";

import { useEffect } from "react";
import { ErrorPageShell } from "@/components/error-page-shell";
import "./globals.css";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <ErrorPageShell
          eyebrow="Application error"
          statusCode="500"
          title="TeachPad needs a quick refresh."
          description="Something interrupted the app before it could load properly. Try refreshing the page to get back to your teaching resources."
          onRetry={reset}
          retryLabel="Refresh Page"
          secondaryHref="/"
          secondaryLabel="Back to Home"
        />
      </body>
    </html>
  );
}
