"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { LIBRARY_CATEGORIES, findLibraryCategory, findLibraryType } from "@/lib/primary-library-taxonomy";
import { cn } from "@/lib/utils";

type ResourcesComponent = React.ComponentType<{
  notify: (s: string) => void;
  resourceCategory?: string;
  hideCategoryTabs?: boolean;
}>;

const catalogCategorySlug = (category: string) => category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function PrimaryLibraryPage({
  Resources,
  notify,
}: {
  Resources: ResourcesComponent;
  notify: (s: string) => void;
}) {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") || undefined;
  const typeSlug = searchParams.get("type") || undefined;

  const category = categorySlug ? findLibraryCategory(categorySlug) : undefined;
  const type = category && typeSlug ? findLibraryType(category.slug, typeSlug) : undefined;

  const breadcrumb = (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-slate-400">
      <Link href="/primary/library" className={cn("hover:text-indigo-600", !category && "text-slate-900")}>
        Library
      </Link>
      {category && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link href={`/primary/library?category=${category.slug}`} className={cn("hover:text-indigo-600", !type && "text-slate-900")}>
            {category.name}
          </Link>
        </>
      )}
      {type && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-slate-900">{type.name}</span>
        </>
      )}
    </nav>
  );

  // Level 3 — the actual resource library for one specific resource type.
  if (category && type) {
    if (!type.catalogCategory) {
      return (
        <div className="space-y-6">
          {breadcrumb}
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/40 p-12 text-center">
            <span className="text-4xl">{category.emoji}</span>
            <h2 className="mt-3 text-lg font-black text-slate-900">{type.name} is coming soon</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm font-medium text-slate-400">
              We&apos;re still building this collection. Check back soon, or explore another {category.name.toLowerCase()} resource type.
            </p>
            <Link
              href={`/primary/library?category=${category.slug}`}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#6e41f5] px-4 py-2 text-xs font-black text-white shadow-md shadow-violet-100"
            >
              Back to {category.name}
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {breadcrumb}
        <Resources notify={notify} resourceCategory={catalogCategorySlug(type.catalogCategory)} hideCategoryTabs />
      </div>
    );
  }

  // Level 2 — resource-type cards for one category.
  if (category) {
    return (
      <div className="space-y-6">
        {breadcrumb}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {category.emoji} {category.name}
          </h2>
          <p className="text-sm font-medium text-slate-600">{category.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {category.types.map((t) => (
            <Link
              key={t.slug}
              href={`/primary/library?category=${category.slug}&type=${t.slug}`}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-[20px] border border-white/60 bg-gradient-to-br p-4 text-center shadow-sm shadow-slate-100/50 transition duration-300 hover:-translate-y-1 hover:shadow-md",
                category.gradient
              )}
            >
              <span className={cn("grid h-12 w-12 place-items-center rounded-2xl text-xl shadow-sm ring-1 transition duration-300 group-hover:scale-105", category.iconBg)}>
                {category.emoji}
              </span>
              <b className="text-xs font-black text-slate-800">{t.name}</b>
              {!t.catalogCategory && <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Coming soon</span>}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Level 1 — the 7 category cards.
  return (
    <div className="space-y-6">
      {breadcrumb}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {LIBRARY_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/primary/library?category=${c.slug}`}
            className={cn(
              "group flex flex-col gap-3 rounded-[22px] border border-white/60 bg-gradient-to-br p-5 shadow-sm shadow-slate-100/50 transition duration-300 hover:-translate-y-1 hover:shadow-md",
              c.gradient
            )}
          >
            <span className={cn("grid h-14 w-14 place-items-center rounded-2xl text-3xl shadow-sm ring-1 transition duration-300 group-hover:scale-105", c.iconBg)}>
              {c.emoji}
            </span>
            <div>
              <b className="block text-base font-black text-slate-900">{c.name}</b>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">{c.description}</p>
            </div>
            <span className="mt-auto text-xs font-bold text-slate-400">{c.types.length} resource types</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
