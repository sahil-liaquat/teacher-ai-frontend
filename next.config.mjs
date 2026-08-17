import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const signupRedirectSources = [
  "/activity-ideas-for-teachers",
  "/ai-ppt-generator",
  "/chapter-summary-presentation",
  "/classroom-activities-for-teachers",
  "/classroom-game-generator",
  "/classroom-ppt-generator",
  "/classroom-presentation-maker",
  "/discussion-activity-generator",
  "/editable-ppt-generator",
  "/english-activity-generator",
  "/english-presentation-generator",
  "/exit-ticket-generator",
  "/group-activity-generator",
  "/hands-on-activity-generator",
  "/hindi-activity-generator",
  "/hindi-presentation-generator",
  "/jkbose-presentation-generator",
  "/lesson-activity-generator",
  "/lesson-ppt-generator",
  "/lesson-presentation-generator",
  "/maths-activity-generator",
  "/maths-presentation-generator",
  "/mcq-generator",
  "/ncert-presentation-generator",
  "/ppt-generator-for-teachers",
  "/presentation-with-speaker-notes",
  "/question-paper-generator",
  "/quiz-presentation-generator",
  "/revision-presentation-generator",
  "/role-play-activity-generator",
  "/science-activity-generator",
  "/science-presentation-generator",
  "/student-engagement-activity-generator",
  "/teaching-presentation-generator",
  "/think-pair-share-activity",
  "/warm-up-activity-generator"
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname
  },
  webpack(config, { webpack }) {
    // pptxgenjs exposes optional Node-only export paths even when it is bundled
    // for the browser. Webpack tries to resolve those `node:` imports while
    // compiling Saved Resources, which crashes the development server before
    // the browser-safe code can run.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      https: false,
      os: false,
      path: false
    };
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^node:(fs|https)$/
      })
    );
    return config;
  },
  images: {
    // Primary's 861 printables are served from Cloudinary, not /public.
    // next/image refuses external hosts unless they are listed here, and it
    // fails at RUNTIME — `next build` passes either way, so a missing entry
    // ships a Library page of broken images.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/wzdp7tgg/**"
      }
    ]
  },
  async redirects() {
    return [
      ...signupRedirectSources.map((source) => ({
        source,
        destination: "/signup",
        permanent: false
      })),
      {
        source: "/dashboard/reports",
        destination: "/dashboard",
        permanent: false
      },
      // School Admin information architecture: nine top-level items became five
      // jobs. Almost every URL stayed put — only these two genuinely moved.
      //
      // /school-admin/classes rendered the SAME ClassManager as the foot of the
      // Teachers workspace: two doors into one CRUD. Classes now live under
      // People, and this keeps the old address working.
      //
      // /school-admin/progress became Teaching → Coverage, which is where the
      // question it asked actually belongs once execution data is wired in.
      //
      // Non-permanent on purpose: a 308 would pin these in admins' browsers,
      // and the People/Teaching grouping is newer than the routes it replaces.
      {
        source: "/school-admin/classes",
        destination: "/school-admin/people",
        permanent: false
      },
      {
        source: "/school-admin/progress",
        destination: "/school-admin/teaching",
        permanent: false
      },
      // Renamed in the Master Curriculum cutover: this page administers the
      // platform-owned master curriculum (/admin/master/*), not the school one.
      // Kept non-permanent so a stale 308 can't pin the old path in admins'
      // browsers if /admin/primary is renamed next. Query is preserved, so
      // bookmarked ?tab=... deep links still land on the right tab.
      {
        source: "/admin/primary-curriculum",
        destination: "/admin/master-curriculum",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
