import { redirect, notFound } from "next/navigation";
import { libraryPathForCatalogCategorySlug } from "@/lib/primary-library-taxonomy";

export default async function ResourceCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const path = libraryPathForCatalogCategorySlug(category);
  if (!path) notFound();
  redirect(`/primary/library?category=${path.category}&type=${path.type}`);
}
