import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account | TeachPad",
  description: "Create your TeachPad account and start building classroom resources.",
  robots: {
    index: false,
    follow: false
  }
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
