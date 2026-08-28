import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { StartFlow } from "@/components/start/start-flow";
import { StepShellFallback } from "@/components/start/step-shell";

export const metadata: Metadata = {
  title: "Get started | TeachPad",
  robots: {
    index: false,
    follow: false
  }
};

export default function StartPage() {
  return (
    <AppShell>
      <Suspense fallback={<StepShellFallback />}>
        <StartFlow />
      </Suspense>
    </AppShell>
  );
}
