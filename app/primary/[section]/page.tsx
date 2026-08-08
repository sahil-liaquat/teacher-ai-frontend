import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

const redirects: Record<string, string> = {
  planning: "/primary/today",
  "teaching-kits": "/primary/today",
  "teaching-resources": "/primary/today",
  "resource-library": "/primary/library",
  "printable-activities": "/primary/library",
  "worksheet-library": "/primary/library",
  "classroom-resources": "/primary/library",
  "ai-studio": "/primary",
  "classroom-activities": "/primary/library",
  "creative-corner": "/primary/library",
  "lesson-plan": "/primary/today",
};

export default async function PrimarySection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { section } = await params;
  const target = redirects[section];
  if (!target) notFound();

  // Preserve query parameters
  const sp = await searchParams;
  const qp = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val !== undefined) {
      if (Array.isArray(val)) {
        val.forEach((v) => qp.append(key, v));
      } else {
        qp.append(key, val);
      }
    }
  }

  const queryString = qp.toString();
  redirect(queryString ? `${target}?${queryString}` : target);
}
