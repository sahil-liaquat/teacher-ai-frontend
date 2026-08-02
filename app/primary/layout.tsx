import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "TeachPad Primary" };

export default function PrimaryLayout({ children }: { children: React.ReactNode }) {
  return <AppShell><div className="primary-embedded">{children}</div></AppShell>;
}
