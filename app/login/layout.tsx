import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | TeachPad",
  description: "Log in to your TeachPad teaching workspace.",
  robots: {
    index: false,
    follow: false
  }
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
