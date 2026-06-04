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
  async redirects() {
    return signupRedirectSources.map((source) => ({
      source,
      destination: "/signup",
      permanent: false
    }));
  }
};

export default nextConfig;
