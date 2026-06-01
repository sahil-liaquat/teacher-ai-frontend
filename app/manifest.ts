import type { MetadataRoute } from "next";

// Served by Next at /manifest.webmanifest; the <link rel="manifest"> is injected
// automatically. Icons reference files emitted by scripts/generate-icons.mjs.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TeachPad",
    short_name: "TeachPad",
    description: "Textbook-grounded lesson plans, worksheets, and presentations for teachers",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0165fd",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
