import type { MetadataRoute } from "next";

const siteUrl = "https://teachpad.in";

const routes = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/ai-tools", priority: 0.9, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/boards-curriculums", priority: 0.8, changeFrequency: "monthly" },
  { path: "/lesson-plan-generator", priority: 0.8, changeFrequency: "weekly" },
  { path: "/worksheet-generator", priority: 0.8, changeFrequency: "weekly" },
  { path: "/presentation-generator", priority: 0.8, changeFrequency: "weekly" },
  { path: "/classroom-activity-generator", priority: 0.8, changeFrequency: "weekly" },
  { path: "/notes-generator", priority: 0.8, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/refund", priority: 0.4, changeFrequency: "yearly" }
] as const satisfies ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: new URL(route.path, siteUrl).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
