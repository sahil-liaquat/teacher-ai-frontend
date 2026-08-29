import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge only reads `text-*` as a font size for t-shirt sizes and arbitrary lengths,
// and `shadow-*` as a shadow for its own scale, so the design tokens below would fall through
// to text-color / shadow-color and be dropped by any colour class on the same element.
// The keys are tailwind-merge's group names (`rounded`, `shadow`), not Tailwind's.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["micro", "lead", "h1", "h2", "h3", "display"] }],
      rounded: [{ rounded: ["chip", "control", "card", "sheet"] }],
      shadow: [{ shadow: ["e1", "e2", "e3"] }]
    }
  }
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
