# TeachPad SEO Audit Report

Date: 04 June 2026  
Site reviewed: `https://teachpad.in` codebase running locally at `http://localhost:3000`  
Scope: Public marketing pages, AI tool landing pages, auth entry pages, metadata, crawlability, indexability, internal links, structured data, image SEO, and content quality.

## Executive Summary

TeachPad has a strong SEO foundation on the five main AI tool landing pages: lesson plan generator, worksheet generator, notes generator, presentation generator, and classroom activity generator. These pages have clear search intent, unique title/description metadata, canonical URLs, helpful page copy, JSON-LD, and good image alt coverage.

The main SEO risk is not the page content itself. The main risk is technical housekeeping around crawl discovery, broken internal links, and index control. A local crawl found 36 internal links returning 404 from public pages. The frontend also currently has no sitemap or robots route/file, and several pages use generic metadata or have no canonical URL. Login, signup, dashboard, and admin surfaces should be explicitly controlled so Google focuses on the public acquisition pages.

Overall SEO readiness: B-  
After sitemap/robots, broken links, canonicals, noindex rules, and alt text fixes: A-

## Methodology

1. Reviewed the Next.js frontend source under `/Users/sahilliaquat/Desktop/teachpad/teacher-ai-frontend`.
2. Crawled public pages on the local Next.js dev server at `http://localhost:3000`.
3. Checked page status, title tags, meta descriptions, canonical tags, H1 text, JSON-LD count, image count, and missing alt attributes.
4. Crawled internal links from the public marketing and generator pages.
5. Compared findings against Google Search Central guidance:
   - SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
   - Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
   - robots.txt: https://developers.google.com/search/docs/crawling-indexing/robots/intro
   - Title links: https://developers.google.com/search/docs/appearance/title-link
   - Snippets/meta descriptions: https://developers.google.com/search/docs/appearance/snippet
   - Structured data: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
   - JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
   - Image SEO: https://developers.google.com/search/docs/appearance/google-images

## Priority Findings

### 1. Missing Sitemap and robots.txt

Severity: High  
Current state: No `robots.txt`, `sitemap.xml`, `app/robots.ts`, or `app/sitemap.ts` was found in the frontend.

Why it matters: Google says a sitemap helps search engines crawl important pages more efficiently, especially for newer sites or sites with limited external links. A robots.txt file is useful for crawler traffic management and for pointing crawlers to the sitemap.

Recommended fix:

- Add `app/sitemap.ts` with only indexable public URLs.
- Add `app/robots.ts` that allows public pages, disallows private app/admin/dashboard areas, and references the sitemap.
- Include:
  - `/`
  - `/ai-tools`
  - `/lesson-plan-generator`
  - `/worksheet-generator`
  - `/notes-generator`
  - `/presentation-generator`
  - `/classroom-activity-generator`
  - `/boards-curriculums`
  - `/pricing`
  - Legal/contact pages if you want them indexed.

Implementation files:

- `/Users/sahilliaquat/Desktop/teachpad/teacher-ai-frontend/app/sitemap.ts`
- `/Users/sahilliaquat/Desktop/teachpad/teacher-ai-frontend/app/robots.ts`

### 2. Broken Public Internal Links

Severity: High  
Current state: Public page crawl found 52 unique internal links. 16 returned OK and 36 returned 404.

Broken URLs found:

- `/activity-ideas-for-teachers`
- `/ai-ppt-generator`
- `/chapter-summary-presentation`
- `/classroom-activities-for-teachers`
- `/classroom-game-generator`
- `/classroom-ppt-generator`
- `/classroom-presentation-maker`
- `/discussion-activity-generator`
- `/editable-ppt-generator`
- `/english-activity-generator`
- `/english-presentation-generator`
- `/exit-ticket-generator`
- `/group-activity-generator`
- `/hands-on-activity-generator`
- `/hindi-activity-generator`
- `/hindi-presentation-generator`
- `/jkbose-presentation-generator`
- `/lesson-activity-generator`
- `/lesson-ppt-generator`
- `/lesson-presentation-generator`
- `/maths-activity-generator`
- `/maths-presentation-generator`
- `/mcq-generator`
- `/ncert-presentation-generator`
- `/ppt-generator-for-teachers`
- `/presentation-with-speaker-notes`
- `/question-paper-generator`
- `/quiz-presentation-generator`
- `/revision-presentation-generator`
- `/role-play-activity-generator`
- `/science-activity-generator`
- `/science-presentation-generator`
- `/student-engagement-activity-generator`
- `/teaching-presentation-generator`
- `/think-pair-share-activity`
- `/warm-up-activity-generator`

Why it matters: Broken internal links waste crawl budget, create weak user experience, and make the site look unfinished to search engines and users. The issue is especially important because these links appear on SEO-focused landing pages.

Recommended fix:

- If these are just conversion chips, point them to `/signup`, matching the user-requested behavior already applied to lesson, notes, and worksheet resource sections.
- If the business wants to rank for these queries, create real landing pages with unique useful content, not thin duplicates.
- Short-term: redirect all nonexistent resource URLs to the closest existing generator page or `/signup`.
- Long-term: build a controlled resource page cluster with canonical, unique page copy, and clear internal linking.

### 3. Canonical URL Coverage Is Incomplete

Severity: High  
Current state:

- Canonicals are present on the five main generator pages.
- Canonicals are missing on `/`, `/ai-tools`, `/boards-curriculums`, `/pricing`, `/privacy`, `/terms`, `/refund`, `/contact`, `/login`, and `/signup`.

Why it matters: Canonical URLs give search engines a preferred URL when duplicates or near-duplicates exist. This matters for Next.js deployments where trailing slash, preview, query, or alternate host versions can appear.

Recommended fix:

- Add canonical metadata to all public indexable pages.
- Add `noindex` metadata to pages that should not rank, such as login, signup, reset-password, auth callback, dashboard, and admin routes.

Example:

```ts
export const metadata: Metadata = {
  title: "AI Teaching Tools for Indian Teachers | TeachPad",
  description: "...",
  alternates: { canonical: "/" }
};
```

### 4. Auth and App Pages Need Index Control

Severity: High  
Current state:

- `/login` returns 200 with title `TeachPad`, default description, no canonical, and H1 `Checking your session`.
- `/signup` returns 200 with title `TeachPad`, default description, no canonical, and missing image alt text.
- Dashboard/admin routes exist in the app tree and should not appear in search results.

Why it matters: Google notes that robots.txt is not a reliable way to keep web pages out of search results; pages that should not be indexed should use `noindex` or be protected. Login/signup can be indexable if intentionally optimized, but dashboard/admin/auth pages should be excluded.

Recommended fix:

- Add `robots: { index: false, follow: false }` to auth, callback, reset password, dashboard, and admin layouts/pages.
- Decide whether `/signup` should be indexable. If it is just a conversion destination for resource chips, `noindex, follow` is cleaner.
- If signup should rank, give it its own title and description, for example:
  - Title: `Create Your TeachPad Account | AI Tools for Teachers`
  - Description: `Sign up for TeachPad to create textbook-based lesson plans, worksheets, notes, presentations, and classroom activities.`

### 5. Missing Alt Text on Several Public Pages

Severity: High  
Current crawl results:

- `/`: 14 images, 7 missing alt attributes.
- `/ai-tools`: 10 images, 5 missing alt attributes.
- `/boards-curriculums`: 7 images, 2 missing alt attributes.
- `/signup`: 3 images, 2 missing alt attributes.
- Generator pages: 0 missing alt attributes.

Why it matters: Google image SEO guidance recommends using standard image elements and meaningful alt text so crawlers can understand images. Alt text also improves accessibility.

Recommended fix:

- Add descriptive alt text for meaningful screenshots/illustrations.
- Use empty alt text only for purely decorative images.
- Prioritize home and AI tools pages because they are top-level acquisition pages.

### 6. Generic Home Metadata

Severity: High  
Current state:

- Home title: `TeachPad`
- Description: `Textbook-grounded lesson plans and worksheets for teachers`
- H1 crawl text: `Teach from your textbook.Let AI do the preparation.`

Why it matters: Google title guidance emphasizes concise, descriptive, distinct titles. The current home title is too generic for a search result and undersells the product category.

Recommended fix:

- Use a search-intent title:
  - `TeachPad | AI Teaching Tools for Lesson Plans, Worksheets & Notes`
- Use a richer description:
  - `TeachPad helps teachers turn textbook chapters into lesson plans, worksheets, notes, presentations, quizzes, and classroom activities in seconds.`
- Fix H1 spacing so crawlers and screen readers read it naturally:
  - `Teach from your textbook. Let AI do the preparation.`

## Page-by-Page SEO Review

### Home Page: `/`

Strengths:

- Clear product positioning.
- Strong internal linking to main tool pages.
- Good visual storytelling.

Issues:

- Title is too generic.
- No canonical URL.
- No JSON-LD.
- 7 images missing alt text.
- H1 text lacks spacing between sentence fragments.

Recommended improvements:

- Add canonical `/`.
- Add Organization and WebSite JSON-LD.
- Improve title and description.
- Add missing alt text.
- Add one short section for supported use cases: lesson plans, worksheets, notes, presentations, activities, and quizzes.

### AI Tools Page: `/ai-tools`

Strengths:

- Clear hub page for product categories.
- Good internal links to main tool pages.
- Page intent is commercially useful.

Issues:

- No canonical URL.
- No JSON-LD.
- 5 missing image alt attributes.
- H1 crawl text lacks spacing: `One textbook.Every teaching resource.`

Recommended improvements:

- Add canonical `/ai-tools`.
- Add ItemList JSON-LD for the tool list.
- Improve alt text on tool preview images.
- Fix H1 spacing.

### Lesson Plan Generator: `/lesson-plan-generator`

Strengths:

- Strong title and meta description.
- Canonical present.
- JSON-LD present.
- Clear sections for format, example output, steps, FAQs, and related resources.
- No missing image alt attributes.
- PDF sample download supports user trust.

Issues:

- Meta description is close to snippet truncation length.
- Resource sections were recently redirected to signup, which is acceptable for conversion, but less ideal if the SEO plan is to rank for every listed resource keyword.

Recommended improvements:

- Keep as primary landing page.
- Add BreadcrumbList structured data if not already included.
- Monitor Search Console queries for "lesson plan format", "lesson plan pdf", and "lesson plan generator for teachers".

### Worksheet Generator: `/worksheet-generator`

Strengths:

- Clear target keyword and intent.
- Canonical present.
- JSON-LD present.
- Strong output preview image.
- Resource links now redirect to signup.
- No missing image alt attributes.

Issues:

- Resource links to signup are good for immediate conversion but do not capture long-tail SEO unless dedicated pages are built.

Recommended improvements:

- Consider building unique pages for high-value variants later: printable worksheet generator, worksheet with answers, NCERT worksheet generator, JKBOSE worksheet generator.
- Add breadcrumb structured data.

### Notes Generator: `/notes-generator`

Strengths:

- Strong page content and metadata.
- Canonical present.
- JSON-LD present.
- Resource links redirect to signup.
- No missing image alt attributes.

Issues:

- Similar keyword chips could become a thin-content risk if converted into many pages without unique content.

Recommended improvements:

- Keep the current page as the canonical hub for all notes generator queries.
- Build separate pages only where there is enough distinct user intent.

### Presentation Generator: `/presentation-generator`

Strengths:

- Strong title and description.
- Canonical present.
- JSON-LD present.
- Good visual sections and examples.
- No missing image alt attributes.

Issues:

- Internal crawl found many 404s related to presentation resource links, such as `/ai-ppt-generator`, `/lesson-ppt-generator`, `/science-presentation-generator`, and similar.

Recommended improvements:

- Immediately update these resource links to `/signup` or working pages.
- If SEO expansion is desired, create a smaller number of high-quality pages first:
  - `/ai-ppt-generator`
  - `/ppt-generator-for-teachers`
  - `/science-presentation-generator`
  - `/presentation-with-speaker-notes`

### Classroom Activity Generator: `/classroom-activity-generator`

Strengths:

- Clear page intent.
- Canonical present.
- JSON-LD present.
- Strong activity example image.
- No missing image alt attributes.

Issues:

- Crawl found many 404s related to activity resource links, such as `/warm-up-activity-generator`, `/group-activity-generator`, `/exit-ticket-generator`, and similar.

Recommended improvements:

- Update all activity resource links to `/signup` for now.
- Later create a curated cluster only for highest-value activity terms.

### Boards & Curriculums: `/boards-curriculums`

Strengths:

- Important credibility page for Indian curriculum coverage.
- Good target area for NCERT, JKBOSE, CBSE, and school curriculum terms.

Issues:

- No canonical URL.
- 2 missing image alt attributes.
- H1 crawl text appears as `Boards &amp;Curriculums`, with no readable space.
- Metadata is short and generic.

Recommended improvements:

- Add canonical `/boards-curriculums`.
- Improve title:
  - `Supported Boards & Curriculums | NCERT, CBSE, JKBOSE | TeachPad`
- Improve description:
  - `TeachPad supports textbook-grounded teaching resources for NCERT, CBSE, JKBOSE, and custom school curriculums.`
- Add content sections for each supported board.

### Pricing: `/pricing`

Strengths:

- Simple, readable pricing page.
- Title and description are acceptable.

Issues:

- No canonical URL.
- No structured data.
- Description is short and could be stronger.

Recommended improvements:

- Add canonical `/pricing`.
- Add Product or Offer structured data only if pricing details are stable and accurate.
- Add FAQ content for common buying objections: free plan, school plan, billing, cancellation, usage limits.

### Legal and Contact Pages

Pages reviewed:

- `/privacy`
- `/terms`
- `/refund`
- `/contact`

Strengths:

- Each page has specific metadata.
- No missing alt issues.

Issues:

- No canonical URLs.
- No structured data.

Recommended improvements:

- Add canonical URLs.
- Add Organization/ContactPoint structured data on `/contact`.
- Legal pages may remain indexable, but they do not need heavy SEO work.

## Technical SEO

### Rendering

The site is built in Next.js and the public pages return rendered HTML successfully in the local crawl. This is good. Google can process JavaScript, but Google Search Central explains that JavaScript pages go through crawling, rendering, and indexing phases. Server-rendered public content reduces dependency on delayed rendering.

Recommendation:

- Keep primary SEO text in server-rendered page content.
- Avoid hiding important copy behind client-only interactions.

### Internal Linking

Current internal linking is strong in concept but risky in execution. The resource link sections are good SEO architecture if the URLs exist. Right now, many do not.

Recommendation:

- Treat each resource chip as either:
  - A conversion CTA to `/signup`, or
  - A real landing page with unique content.
- Do not leave SEO keyword chips pointing to 404s.

### Canonicals

Generator pages use canonical metadata well. This pattern should be copied to other public pages.

Recommended canonical map:

- `/` -> `https://teachpad.in/`
- `/ai-tools` -> `https://teachpad.in/ai-tools`
- `/lesson-plan-generator` -> `https://teachpad.in/lesson-plan-generator`
- `/worksheet-generator` -> `https://teachpad.in/worksheet-generator`
- `/notes-generator` -> `https://teachpad.in/notes-generator`
- `/presentation-generator` -> `https://teachpad.in/presentation-generator`
- `/classroom-activity-generator` -> `https://teachpad.in/classroom-activity-generator`
- `/boards-curriculums` -> `https://teachpad.in/boards-curriculums`
- `/pricing` -> `https://teachpad.in/pricing`
- Legal/contact pages as exact self-canonicals.

### Structured Data

Current state:

- Main generator pages include JSON-LD.
- Home, AI tools, pricing, board/curriculum, and legal/contact pages do not.

Recommended structured data:

- Sitewide/home:
  - Organization
  - WebSite
- AI Tools:
  - ItemList of available tools
- Generator pages:
  - SoftwareApplication or WebApplication where appropriate
  - FAQPage only when FAQs are visible on the page
  - BreadcrumbList
- Contact:
  - Organization with ContactPoint

Important caution:

- Structured data must match visible content. Do not add FAQ structured data for questions that are not visible on the page.

### Image SEO

The recent generator page images are visually strong and alt-complete. The remaining issue is on home, AI tools, boards/curriculums, and signup.

Recommendations:

- Add meaningful alt text to all non-decorative screenshots.
- Use `priority` on above-the-fold hero images that are likely LCP candidates.
- Keep screenshots as actual `<img>`/Next `<Image>` elements. Google image guidance states that standard HTML image elements help crawlers discover images.
- Consider image sitemap entries if image traffic matters.

### Performance and Core Web Vitals

This audit did not run Lighthouse or production Web Vitals, but the codebase uses large visual assets heavily. Above-the-fold hero images may affect LCP.

Recommendations:

- Run Lighthouse on production build for:
  - `/`
  - `/ai-tools`
  - each generator page.
- Add `priority` to one primary above-fold image per page.
- Ensure image dimensions are explicit to avoid layout shifts.
- Compress large PNG screenshots where transparency is not required.
- Prefer WebP/AVIF variants for large screenshots if visual quality remains acceptable.

## Content and Keyword Strategy

### Strong Existing Keyword Targets

The site already has strong pages for:

- AI lesson plan generator
- AI worksheet generator
- AI notes generator
- AI presentation generator
- Classroom activity generator
- Lesson plan format
- Lesson plan PDF
- Worksheet with answers
- Revision notes generator
- Presentation generator for teachers

### Recommended SEO Cluster Strategy

Do not create dozens of thin keyword pages at once. Build pages only where the query intent is distinct.

Best first expansion pages:

1. `/ai-ppt-generator`
2. `/ppt-generator-for-teachers`
3. `/question-paper-generator`
4. `/mcq-generator`
5. `/lesson-plan-format`
6. `/lesson-plan-pdf`
7. `/worksheet-with-answers`
8. `/revision-notes-generator`
9. `/ncert-lesson-plan-generator`
10. `/jkbose-lesson-plan-generator`

Each page should have:

- Unique title and description.
- One clear H1.
- Specific examples.
- Visible FAQs.
- Internal links to the parent generator page.
- Canonical self-reference.
- Conversion CTA to signup.

### Duplicate Content Risk

The long resource lists are useful for navigation, but if every chip becomes a page with the same layout and only the keyword changed, Google may treat them as low-value near-duplicates.

Recommendation:

- Use one strong hub page for each tool.
- Create only high-demand child pages with truly different content.
- Merge low-demand keywords into FAQ sections instead of separate pages.

## Recommended 30/60/90 Day Plan

### First 30 Days: Technical Cleanup

1. Add `app/sitemap.ts`.
2. Add `app/robots.ts`.
3. Fix all 36 broken internal links.
4. Add canonicals to public pages.
5. Add `noindex` to auth, dashboard, admin, callback, reset-password, and private app pages.
6. Fix missing alt text on home, AI tools, boards/curriculums, and signup.
7. Improve home title, description, and H1 spacing.
8. Submit sitemap in Google Search Console.

### Days 31-60: Structured Data and Performance

1. Add Organization and WebSite JSON-LD on home.
2. Add ItemList JSON-LD on `/ai-tools`.
3. Add BreadcrumbList JSON-LD to generator pages.
4. Run Lighthouse on production pages.
5. Optimize large hero images and screenshots.
6. Add `priority` to main above-fold images.
7. Review Search Console indexing report for excluded or duplicate URLs.

### Days 61-90: Content Expansion

1. Create 5-10 high-intent child landing pages.
2. Build real example resources for each page.
3. Add comparison or guide content for teachers.
4. Add internal links from home and AI tools to the strongest commercial pages.
5. Track rankings and impressions in Search Console.
6. Prune or merge pages that do not gain impressions.

## Implementation Checklist

High priority:

- [ ] Create `/app/sitemap.ts`.
- [ ] Create `/app/robots.ts`.
- [ ] Fix presentation and classroom activity resource 404 links.
- [ ] Add canonical metadata to `/`, `/ai-tools`, `/boards-curriculums`, `/pricing`, legal, and contact pages.
- [ ] Add `noindex` metadata to login, signup if desired, reset password, auth callback, dashboard, and admin.
- [ ] Add missing image alt text.
- [ ] Improve home metadata.

Medium priority:

- [ ] Add Organization and WebSite JSON-LD.
- [ ] Add ItemList JSON-LD to AI tools page.
- [ ] Add BreadcrumbList JSON-LD to tool pages.
- [ ] Fix H1 spacing on home, AI tools, and boards/curriculums.
- [ ] Run Lighthouse and optimize LCP images.

Lower priority:

- [ ] Add ContactPoint structured data.
- [ ] Create selective long-tail landing pages.
- [ ] Add image sitemap entries if image search matters.
- [ ] Decide whether sample PDFs should be indexed.

## Crawl Appendix

### Public Page Metadata Snapshot

| URL | Status | Title | Canonical | H1 | JSON-LD | Images | Missing Alt |
|---|---:|---|---|---|---:|---:|---:|
| `/` | 200 | `TeachPad` | Missing | `Teach from your textbook.Let AI do the preparation.` | 0 | 14 | 7 |
| `/ai-tools` | 200 | `AI Tools \| TeachPad` | Missing | `One textbook.Every teaching resource.` | 0 | 10 | 5 |
| `/lesson-plan-generator` | 200 | `AI Lesson Plan Generator for Teachers \| TeachPad` | Present | Good | Present | 8 | 0 |
| `/worksheet-generator` | 200 | `AI Worksheet Generator for Teachers \| TeachPad` | Present | Good | Present | 7 | 0 |
| `/notes-generator` | 200 | `AI Notes Generator for Teachers \| TeachPad` | Present | Good | Present | 7 | 0 |
| `/presentation-generator` | 200 | `AI Presentation Generator for Teachers \| TeachPad` | Present | Good | Present | 6 | 0 |
| `/classroom-activity-generator` | 200 | `AI Classroom Activity Generator for Teachers \| TeachPad` | Present | Good | Present | 7 | 0 |
| `/boards-curriculums` | 200 | `Boards & Curriculums \| TeachPad` | Missing | `Boards &amp;Curriculums` | 0 | 7 | 2 |
| `/pricing` | 200 | `Pricing \| TeachPad` | Missing | Good | 0 | 4 | 0 |
| `/privacy` | 200 | `Privacy Policy · TeachPad` | Missing | Good | 0 | 2 | 0 |
| `/terms` | 200 | `Terms of Service · TeachPad` | Missing | Good | 0 | 2 | 0 |
| `/refund` | 200 | `Refund & Cancellation Policy · TeachPad` | Missing | Good | 0 | 2 | 0 |
| `/contact` | 200 | `Contact Us · TeachPad` | Missing | Good | 0 | 2 | 0 |
| `/login` | 200 | `TeachPad` | Missing | `Checking your session` | 0 | 0 | 0 |
| `/signup` | 200 | `TeachPad` | Missing | `Create account` | 0 | 3 | 2 |

### Broken Link Summary

36 public internal links returned 404 during crawl. The majority are resource keyword links from presentation and classroom activity sections. These should either redirect to `/signup` or become real landing pages.

## Final Recommendation

TeachPad should prioritize technical SEO cleanup before expanding content. The current generator landing pages are good enough to build on, but the site is losing quality signals through missing discovery files, incomplete canonical/noindex strategy, and many broken keyword links. Fixing those issues will make the existing content easier to crawl, easier to understand, and cleaner to convert from search traffic.
