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
      }
    ];
  }
};

export default nextConfig;
