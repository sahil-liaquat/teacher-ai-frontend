"use client";

import { useState, type ImgHTMLAttributes, type ReactNode } from "react";
import { resolveUploadUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type WorkshopImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  bannerUrl?: string | null;
  fallback: ReactNode;
};

export function WorkshopImage({
  bannerUrl,
  fallback,
  className,
  ...imageProps
}: WorkshopImageProps) {
  const src = resolveUploadUrl(bannerUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!src || failedUrl === src) return fallback;

  return (
    <img
      {...imageProps}
      src={src}
      className={cn(className, "h-full w-full object-cover object-center")}
      onError={() => setFailedUrl(src)}
    />
  );
}
