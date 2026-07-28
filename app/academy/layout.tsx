import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teacher Growth Hub | TeachPad",
  description: "Join practical TeachPad workshops and grow your classroom skills."
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
