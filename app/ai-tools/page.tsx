import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Play, Sparkles } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { AiToolsShowcase } from "./showcase";

const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/ai-tools`;
const pageTitle = "TeachPad AI Tools for Teachers";
const pageDescription = "Explore TeachPad AI tools for teachers to create textbook-based lesson plans, worksheets, presentations, notes, quizzes, and classroom activities in minutes.";
const previewImage = "/ai-tools/ai-tools-hero.png";

export const metadata: Metadata = {
  title: "AI Tools | TeachPad",
  description: pageDescription,
  alternates: {
    canonical: "/ai-tools"
  },
  openGraph: {
    title: pageTitle,
    description: "Create textbook-based lesson plans, worksheets, presentations, notes, quizzes, and classroom activities with TeachPad AI tools.",
    url: "/ai-tools",
    siteName: "TeachPad",
    images: [
      {
        url: "/ai-tools/ai-tools-hero.png",
        width: 1448,
        height: 1086,
        alt: "TeachPad AI tools for creating teaching resources from textbook chapters."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "TeachPad AI Tools for Teachers",
    description: "Create lesson plans, worksheets, presentations, notes, quizzes, and activities from textbook chapters.",
    images: ["/ai-tools/ai-tools-hero.png"]
  }
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TeachPad",
    url: siteUrl,
    logo: `${siteUrl}/assets/teachpad-logo.png`
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TeachPad",
    url: siteUrl,
    description: "TeachPad helps teachers create textbook-grounded classroom resources with AI."
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TeachPad AI Tools",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: pageUrl,
    image: `${siteUrl}${previewImage}`,
    description: pageDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/signup`
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "TeachPad AI Tools",
    image: `${siteUrl}${previewImage}`,
    description: pageDescription,
    brand: {
      "@type": "Brand",
      name: "TeachPad"
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/pricing`
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "AI Tools",
        item: pageUrl
      }
    ]
  }
];

export default function AiToolsPage() {
  return (
    <main className="min-h-screen w-full max-w-full bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="ai-tools" />
      <HeroSection />
      <AiToolsShowcase />
      <TextbookAlignedSection />
      <FinalCtaSection />
      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#eef6ff_0,transparent_28%),radial-gradient(circle_at_88%_16%,#f4fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-10 pt-9 sm:px-6 md:pb-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-20 lg:pt-14">
        <div className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
            <Sparkles className="h-4 w-4" />
            AI tools
          </div>
          <h1 className="text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]">
            <span className="text-blue-600">One textbook.</span>
            <br />
            Every teaching resource.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0">
            TeachPad turns your selected textbook chapter into lesson plans, worksheets, presentations, notes, activities, and quizzes &mdash; all aligned with what you actually teach.
          </p>

          <div className="mx-auto mt-7 flex max-w-[420px] flex-col justify-center gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center lg:mx-0 lg:justify-start">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Start Creating Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#showcase"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-600">
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </span>
              See How It Works
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[820px] lg:-mr-12 lg:max-w-none">
          <Image
            src="/ai-tools/ai-tools-hero.png"
            alt="TeachPad turns one textbook chapter into AI-generated teaching resources."
            width={1448}
            height={1086}
            priority
            className="h-auto w-full drop-shadow-[0_34px_54px_rgba(47,79,129,0.18)]"
          />
        </div>
      </div>
    </section>
  );
}

function TextbookAlignedSection() {
  const points = [
    "Starts from the selected board, class, subject, textbook, and chapter.",
    "Keeps lessons, worksheets, notes, and activities tied to what teachers actually cover.",
    "Helps schools keep classroom resources consistent across sections."
  ];

  return (
    <section className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
            <BookOpen className="h-4 w-4" />
            Textbook grounded
          </span>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            The chapter stays at the center.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            TeachPad does not create generic AI output. It uses the textbook chapter as the source, then shapes each resource for real classroom use.
          </p>
          <ul className="mt-7 space-y-4">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[680px] lg:max-w-none">
          <Image
            src="/assets/illustrations/textbook-library-header.png"
            alt="Open textbook with classroom learning materials."
            width={1672}
            height={941}
            className="marketing-float-slow h-auto w-full drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
          />
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
        <div className="text-center lg:text-left">
          <h2 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:mx-0">
            Start with your textbook. Create everything you need to teach.
          </h2>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
            >
              Book a School Demo
            </Link>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">No credit card required</p>
        </div>

        <div>
          <Image
            src="/landing/backpack-globe-v2.png"
            alt="Backpack, globe, books, and stationery illustration"
            width={1600}
            height={900}
            className="marketing-float-slow mx-auto h-auto w-full max-w-xl"
          />
        </div>
      </div>
    </section>
  );
}
