import type { CSSProperties } from "react";
import { resolveUploadUrl, type PrimaryCurriculumTheme } from "./api";
import { builtInHeroForThemeName, DEFAULT_PRIMARY_HERO_URL } from "./primary-hero-library";

export type PrimaryThemeVisuals = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
  heroImage?: string;
  backgroundImage?: string;
  illustrations: string[];
  style: CSSProperties & Record<`--primary-${string}`, string>;
};

const fallback = {
  primary: "#2563eb",
  secondary: "#8b5cf6",
  accent: "#f59e0b",
  surface: "#eff6ff",
  text: "#172554",
};

function color(palette: Record<string, string> | undefined, key: keyof typeof fallback) {
  const value = palette?.[key];
  return typeof value === "string" && value.trim() ? value : fallback[key];
}

export function primaryThemeVisuals(theme?: PrimaryCurriculumTheme | null): PrimaryThemeVisuals {
  const primary = color(theme?.color_palette, "primary");
  const secondary = color(theme?.color_palette, "secondary");
  const accent = color(theme?.color_palette, "accent");
  const surface = color(theme?.color_palette, "surface");
  const text = color(theme?.color_palette, "text");
  return {
    primary,
    secondary,
    accent,
    surface,
    text,
    heroImage: resolveUploadUrl(theme?.hero_image_url || (theme ? builtInHeroForThemeName(theme.name).src : DEFAULT_PRIMARY_HERO_URL)),
    backgroundImage: resolveUploadUrl(theme?.background_image_url),
    illustrations: theme?.illustration_pack ?? [],
    style: {
      "--primary-theme": primary,
      "--primary-theme-secondary": secondary,
      "--primary-theme-accent": accent,
      "--primary-theme-surface": surface,
      "--primary-theme-text": text,
    },
  };
}

export function illustrationFor(visuals: PrimaryThemeVisuals, index: number): string | undefined {
  if (!visuals.illustrations.length) return undefined;
  return visuals.illustrations[index % visuals.illustrations.length];
}
