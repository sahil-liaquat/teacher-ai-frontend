import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  GraduationCap,
  Sparkles,
  Star,
  WandSparkles
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";

const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/pricing`;
const pageTitle = "TeachPad Pricing for Teachers and Schools";
const pageDescription = "Compare TeachPad pricing for teachers and schools. Start free, upgrade for AI lesson plans, worksheets, presentations, exports, and textbook-grounded tools.";
const previewImage = "/landing/teachpad-main-hero-centered.png";

export const metadata: Metadata = {
  title: "Pricing | TeachPad",
  description: pageDescription,
  alternates: {
    canonical: "/pricing"
  },
  openGraph: {
    title: pageTitle,
    description: "Compare TeachPad plans for AI lesson plans, worksheets, presentations, exports, and textbook-grounded classroom tools.",
    url: "/pricing",
    siteName: "TeachPad",
    images: [
      {
        url: "/landing/teachpad-main-hero-centered.png",
        width: 1672,
        height: 941,
        alt: "TeachPad dashboard with AI teaching tools for lesson planning and classroom resources."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "TeachPad Pricing for Teachers and Schools",
    description: "Start free and upgrade for AI lesson plans, worksheets, presentations, exports, and textbook-grounded tools.",
    images: ["/landing/teachpad-main-hero-centered.png"]
  }
};

const plans = [
  {
    name: "Starter",
    eyebrow: "Try TeachPad",
    price: "Free",
    period: "to start",
    description: "Explore textbook-grounded generation and create your first teaching resources.",
    href: "/signup",
    cta: "Start Free",
    tone: "slate",
    features: ["Textbook-grounded setup", "Lesson plan and worksheet access", "Saved resources preview", "Upgrade when you need more"]
  },
  {
    name: "Pro",
    eyebrow: "For teachers",
    price: "₹199",
    period: "/month",
    altPrice: "or ₹1,699/year",
    description: "For teachers who want every classroom resource ready in seconds.",
    href: "/signup",
    cta: "Start Creating",
    tone: "blue",
    badge: "Best value",
    features: ["Unlimited lesson plans & worksheets", "Presentation generator", "Export to PDF, DOCX & PPTX", "RAG-grounded textbook AI", "Priority generation queue"]
  },
  {
    name: "School",
    eyebrow: "For teams",
    price: "Custom",
    period: "school plan",
    description: "Bring TeachPad to every teacher with aligned formats, shared curriculum setup, and school support.",
    href: "/signup",
    cta: "Book a School Demo",
    tone: "green",
    features: ["Teacher onboarding support", "School format alignment", "Curriculum and textbook setup", "Central admin visibility", "Priority support"]
  }
] as const;

const comparison = [
  "Lesson plans",
  "Worksheets",
  "Presentations",
  "Notes",
  "Activities",
  "Textbook-grounded generation",
  "Saved resource library"
];

const faqs = [
  {
    question: "Can I start without paying?",
    answer: "Yes. You can create an account and try TeachPad before choosing a paid plan."
  },
  {
    question: "Which plan should an individual teacher choose?",
    answer: "Most individual teachers should choose Pro Monthly or Pro Annual. Annual gives the best effective monthly price."
  },
  {
    question: "Do school plans include custom formats?",
    answer: "School plans can support school-specific lesson-plan formats and curriculum setup where available."
  }
];

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
    name: "TeachPad",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: siteUrl,
    image: `${siteUrl}${previewImage}`,
    description: "TeachPad creates textbook-grounded lesson plans, worksheets, presentations, notes, quizzes, and classroom activities for teachers.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "0",
      highPrice: "1699",
      offerCount: plans.length,
      offers: [
        {
          "@type": "Offer",
          name: "TeachPad Starter",
          price: "0",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/signup`
        },
        {
          "@type": "Offer",
          name: "TeachPad Pro Monthly",
          price: "199",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/signup`
        },
        {
          "@type": "Offer",
          name: "TeachPad Pro Annual",
          price: "1699",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/signup`
        }
      ]
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "TeachPad",
    image: `${siteUrl}${previewImage}`,
    description: pageDescription,
    brand: {
      "@type": "Brand",
      name: "TeachPad"
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "0",
      highPrice: "1699",
      offerCount: plans.length,
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "0",
          priceCurrency: "INR",
          url: `${siteUrl}/signup`
        },
        {
          "@type": "Offer",
          name: "Pro Monthly",
          price: "199",
          priceCurrency: "INR",
          url: `${siteUrl}/signup`
        },
        {
          "@type": "Offer",
          name: "Pro Annual",
          price: "1699",
          priceCurrency: "INR",
          url: `${siteUrl}/signup`
        }
      ]
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
        name: "Pricing",
        item: pageUrl
      }
    ]
  }
];

export default function PricingPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#07111f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="pricing" />
      <HeroSection />
      <PlansSection />
      <ComparisonSection />
      <FaqSection />
      <FinalCtaSection />
      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_10%,#eef6ff_0,transparent_30%),radial-gradient(circle_at_88%_14%,#f4fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-10 pt-10 text-center sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-16 lg:pt-14 lg:text-left">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
            <Sparkles className="h-4 w-4" />
            Simple pricing
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:mx-0 lg:text-[72px]">
            Start free. Upgrade when TeachPad becomes part of your classroom.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
            Choose a plan for textbook-grounded lesson plans, worksheets, presentations, notes, and activities, all designed for real teachers and schools.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700">
              Start Creating Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#plans" className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600">
              View Plans
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[760px] lg:-mr-10 lg:max-w-none">
          <Image
            src="/landing/teachpad-main-hero-centered.png"
            alt="TeachPad creates teaching resources from one textbook."
            width={1672}
            height={941}
            priority
            className="h-auto w-full drop-shadow-[0_34px_54px_rgba(47,79,129,0.16)]"
          />
        </div>
      </div>
    </section>
  );
}

function PlansSection() {
  return (
    <section id="plans" className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Plans</p>
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Pick the plan that fits how you teach.
        </h2>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`relative flex min-h-[560px] flex-col rounded-2xl border p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-7 ${
              plan.tone === "blue"
                ? "border-blue-200 bg-[linear-gradient(180deg,#ffffff_0%,#f4f9ff_100%)]"
                : "border-slate-200 bg-white"
            }`}
          >
            {"badge" in plan && plan.badge ? (
              <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                <Star className="h-3.5 w-3.5 fill-current" />
                {plan.badge}
              </span>
            ) : null}

            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">{plan.eyebrow}</p>
            <h3 className="mt-4 text-3xl font-black text-slate-950">{plan.name}</h3>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-5xl font-black tracking-tight text-slate-950">{plan.price}</span>
              <span className="pb-2 text-sm font-bold text-slate-500">{plan.period}</span>
            </div>
            {"altPrice" in plan ? <p className="mt-2 text-sm font-black text-blue-600">{plan.altPrice}</p> : <div className="mt-2 h-5" />}
            <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">{plan.description}</p>
            <ul className="mt-7 space-y-4">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-black transition hover:-translate-y-0.5 ${
                plan.tone === "blue"
                  ? "bg-blue-600 text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] hover:bg-blue-700"
                  : "border border-slate-200 bg-white text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              {plan.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
            <WandSparkles className="h-4 w-4" />
            What Pro unlocks
          </span>
          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Every core classroom resource from one chapter.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            Pro is for teachers who repeatedly create teaching material and want the full TeachPad workflow available whenever planning starts.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {comparison.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <span className="text-sm font-black text-slate-800">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Questions</p>
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Pricing without surprises.
        </h2>
      </div>
      <div className="mx-auto mt-10 grid max-w-4xl gap-4">
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
            <h3 className="text-lg font-black text-slate-950">{faq.question}</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="overflow-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-16">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
            <GraduationCap className="h-4 w-4" />
            Built for Indian teachers and schools
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:mx-0">
            Start with your textbook. Choose the plan when you are ready.
          </h2>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700">
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600">
              Book a School Demo
            </Link>
          </div>
        </div>

        <Image
          src="/landing/backpack-globe-v2.png"
          alt="Backpack, globe, books, and stationery illustration"
          width={1600}
          height={900}
          className="marketing-float-slow mx-auto h-auto w-full max-w-xl"
        />
      </div>
    </section>
  );
}
