"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Check, ImageIcon, Loader2, UploadCloud } from "lucide-react";
import { backendApi, resolveUploadUrl } from "@/lib/api";
import {
  isBuiltInPrimaryHero,
  PRIMARY_BUILT_IN_HEROES,
} from "@/lib/primary-hero-library";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";

type HeroImagePickerProps = {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
};

export function PrimaryHeroImagePicker({ value, onChange, compact = false }: HeroImagePickerProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"built-in" | "custom">(
    isBuiltInPrimaryHero(value) ? "built-in" : "custom"
  );
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMode(isBuiltInPrimaryHero(value) ? "built-in" : "custom");
  }, [value]);

  async function uploadCustomHero(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await backendApi.adminUploadPrimaryHero(file);
      onChange(uploaded.path);
      setMode("custom");
      toast({ title: "Custom hero uploaded", description: "Save the theme to publish this banner." });
    } catch (error) {
      toast({
        title: "Couldn't upload hero",
        description: getErrorMessage(error, "Choose another image and try again."),
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-teachpad-blue" />
            <h3 className="text-sm font-bold text-slate-900">Hero Image</h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">Always included</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Choose a ready-made banner, or upload your own image optionally.</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-bold shadow-sm">
          <button
            type="button"
            onClick={() => setMode("built-in")}
            className={cn("rounded-lg px-3 py-2", mode === "built-in" ? "bg-blue-600 text-white" : "text-slate-600")}
          >
            Built-in library
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={cn("rounded-lg px-3 py-2", mode === "custom" ? "bg-blue-600 text-white" : "text-slate-600")}
          >
            Custom upload
          </button>
        </div>
      </div>

      {mode === "built-in" ? (
        <div className={cn("mt-4 grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4")}>
          {PRIMARY_BUILT_IN_HEROES.map((hero) => {
            const selected = value === hero.src;
            return (
              <button
                type="button"
                key={hero.id}
                aria-pressed={selected}
                onClick={() => onChange(hero.src)}
                className={cn(
                  "group overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md",
                  selected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
                )}
              >
                <div className="relative aspect-[16/3] overflow-hidden bg-slate-100">
                  <img src={hero.src} alt="" className="h-full w-full object-cover" />
                  {selected ? <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white shadow"><Check className="h-3.5 w-3.5" /></span> : null}
                </div>
                <span className="block truncate px-2.5 py-2 text-xs font-bold text-slate-700">{hero.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {value && !isBuiltInPrimaryHero(value) ? (
              <img src={resolveUploadUrl(value)} alt="Current custom hero preview" className="aspect-[16/3] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/3] place-items-center bg-slate-100 text-xs font-semibold text-slate-400">No custom image uploaded</div>
            )}
          </div>
          <div>
            <label className={cn("inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm", uploading && "pointer-events-none opacity-60")}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload custom hero"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={uploadCustomHero} disabled={uploading} />
            </label>
            <p className="mt-2 text-xs leading-5 text-slate-500">Optional. PNG, JPG, or WebP. A wide image works best. You can switch back to the built-in library anytime.</p>
          </div>
        </div>
      )}
    </section>
  );
}
