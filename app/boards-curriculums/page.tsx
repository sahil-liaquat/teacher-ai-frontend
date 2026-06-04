import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  Grid2X2,
  HelpCircle,
  Library,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const siteUrl = "https://teachpad.in";
const pageUrl = `${siteUrl}/boards-curriculums`;
const pageTitle = "Boards and Curriculums Supported by TeachPad";
const pageDescription = "Explore TeachPad supported boards, curriculums, classes, subjects, and textbooks for AI lesson plans, worksheets, presentations, notes, and activities.";
const previewImage = "/landing/boards-curriculums-hero.png";

export const metadata: Metadata = {
  title: "Boards & Curriculums | TeachPad",
  description: pageDescription,
  alternates: {
    canonical: "/boards-curriculums"
  },
  openGraph: {
    title: pageTitle,
    description: "Explore supported boards, curriculums, classes, subjects, and textbooks for textbook-grounded AI teaching resources.",
    url: "/boards-curriculums",
    siteName: "TeachPad",
    images: [
      {
        url: "/landing/boards-curriculums-hero.png",
        width: 1500,
        height: 1030,
        alt: "TeachPad boards and curriculums support for textbook-grounded teaching resources."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Boards and Curriculums Supported by TeachPad",
    description: "Find supported boards, curriculums, classes, subjects, and textbooks for AI teaching resources.",
    images: ["/landing/boards-curriculums-hero.png"]
  }
};

const stats = [
  { value: "4", label: "Boards Supported", detail: "and growing", Icon: Building2 },
  { value: "80+", label: "Textbooks Available", detail: "and counting", Icon: BookOpen },
  { value: "10", label: "Classes Covered", detail: "(6 to 12)", Icon: UsersRound },
  { value: "12", label: "Subjects Covered", detail: "across boards", Icon: Grid2X2 }
];

const boards = [
  {
    title: "JKBOSE",
    description: "Jammu & Kashmir Board of School Education",
    status: "Active",
    tone: "green",
    logo: <JkboseMark />,
    textbooks: "24",
    actions: ["View Textbooks"]
  },
  {
    title: "NCERT / CBSE",
    description: "National curriculum and CBSE-aligned textbooks",
    status: "Active",
    tone: "green",
    logo: <NcertMark />,
    textbooks: "40",
    actions: ["View Textbooks"]
  },
  {
    title: "Custom School Curriculum",
    description: "Upload and manage your school's own curriculum and textbooks",
    status: "Custom",
    tone: "purple",
    logo: <CustomMark />,
    textbooks: "Based on uploads",
    actions: ["View Textbooks", "Manage"]
  },
  {
    title: "Other State Boards",
    description: "Support for additional Indian state boards",
    status: "Coming Soon",
    tone: "orange",
    logo: <StateBoardMark />,
    textbooks: "0",
    actions: ["Request Access"]
  }
];

const groundingSteps = [
  "Select your board & class",
  "Choose subject, book & chapter",
  "Generate textbook-grounded content",
  "Save time & improve learning outcomes"
];

const faqs = [
  {
    question: 'What does "textbook-grounded" mean?',
    answer: "It means TeachPad generates content using the actual textbook, chapter, and curriculum you select.",
    Icon: HelpCircle
  },
  {
    question: "Which classes are currently supported?",
    answer: "We currently support classes 6 to 12. More classes will be added soon.",
    Icon: FileText
  },
  {
    question: "Can I upload my own school curriculum?",
    answer: "Yes! You can upload and manage your own books and curriculum under Custom School Curriculum.",
    Icon: UsersRound
  },
  {
    question: "Can I request a state board to be added?",
    answer: "Yes, you can request access for a state board. Our team will prioritize based on demand.",
    Icon: Building2
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
    name: "TeachPad Curriculum Tools",
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
    name: "TeachPad Curriculum Support",
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
        name: "Boards & Curriculums",
        item: pageUrl
      }
    ]
  }
];

export default function BoardsCurriculumsPage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_45%,#ffffff_100%)] text-[#07133b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader active="boards-curriculums" />
      <div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-10 lg:px-16">
        <HeroSection />
        <StatsSection />
        <BoardsSection />
        <GroundingSection />
        <CtaBand />
        <FaqSection />
      </div>
      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="grid min-h-[430px] overflow-hidden rounded-[28px] border border-blue-100 bg-[radial-gradient(circle_at_16%_12%,#f7fbff_0,transparent_32%),radial-gradient(circle_at_86%_20%,#dfeeff_0,transparent_34%),linear-gradient(135deg,#ffffff_0%,#f4faff_100%)] shadow-[0_24px_70px_rgba(30,82,153,0.12)] lg:grid-cols-[0.86fr_1.14fr]">
      <div className="relative z-10 px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
        <h1 className="max-w-xl text-[44px] font-black leading-none text-slate-950 sm:text-[58px] lg:text-[68px]">
          Boards &
          <span className="block text-blue-600">Curriculums</span>
        </h1>
        <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-slate-600 sm:text-lg sm:leading-8">
          Explore the boards and curriculums supported by TeachPad. Create textbook-grounded lesson plans, worksheets,
          presentations, and quizzes based on your selected curriculum.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <FeaturePill Icon={Sparkles} title="Textbook Grounded" description="Aligned with real textbooks and chapters" />
          <FeaturePill Icon={ShieldCheck} title="Teacher Focused" description="Built to save time and improve classroom impact" />
        </div>
      </div>

      <div className="relative flex min-h-[250px] items-center justify-center px-4 pb-6 sm:min-h-[340px] lg:min-h-[430px] lg:px-0 lg:pb-0">
        <Image
          src="/landing/boards-curriculums-hero.png"
          alt="Stacked subject textbooks with curriculum building, globe, checklist, and graduation cap"
          width={1672}
          height={941}
          priority
          className="relative z-10 h-auto w-full max-w-[620px] object-contain drop-shadow-[0_34px_54px_rgba(47,79,129,0.18)] lg:absolute lg:right-[-46px] lg:top-1/2 lg:max-w-[810px] lg:-translate-y-1/2"
        />
      </div>
    </section>
  );
}

function FeaturePill({ Icon, title, description }: { Icon: typeof Sparkles; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-[0_14px_30px_rgba(37,99,235,0.1)]">
        <Icon className="h-7 w-7" />
      </span>
      <span>
        <span className="block text-sm font-black text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">{description}</span>
      </span>
    </div>
  );
}

function StatsSection() {
  return (
    <section className="mt-5 grid rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={stat.label} className={`flex items-center gap-5 py-2 ${index > 0 ? "lg:border-l lg:border-slate-200 lg:pl-10" : ""}`}>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
            <stat.Icon className="h-9 w-9" />
          </span>
          <span>
            <span className="block text-4xl font-black leading-none text-slate-950">{stat.value}</span>
            <span className="mt-2 block text-sm font-bold leading-5 text-slate-700">{stat.label}</span>
            <span className="block text-sm text-slate-600">{stat.detail}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

function BoardsSection() {
  return (
    <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            aria-label="Search board or curriculum"
            placeholder="Search board or curriculum..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          {["All", "Active", "Coming Soon", "Custom"].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`h-10 min-w-24 rounded-full border px-5 text-sm font-bold transition ${
                filter === "All" ? "border-blue-600 bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.22)]" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {boards.map((board) => (
          <BoardCard key={board.title} board={board} />
        ))}
      </div>
    </section>
  );
}

function BoardCard({ board }: { board: (typeof boards)[number] }) {
  const badgeClass =
    board.tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : board.tone === "purple"
        ? "bg-violet-50 text-violet-700"
        : "bg-orange-50 text-orange-600";

  return (
    <article className="group flex min-h-[360px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_28px_70px_rgba(30,82,153,0.12)]">
      <div className="flex items-start justify-between gap-4">
        {board.logo}
        <span className={`rounded-full px-4 py-2 text-sm font-bold ${badgeClass}`}>{board.status}</span>
      </div>
      <h2 className="mt-5 text-2xl font-black leading-7 text-slate-950">{board.title}</h2>
      <p className="mt-3 min-h-[54px] text-base leading-6 text-slate-700">{board.description}</p>

      <div className="mt-5 space-y-3 text-sm text-slate-700">
        <BoardMeta label="Textbooks" value={board.textbooks} Icon={FileText} />
      </div>

      <div className="mt-auto flex gap-3 pt-5">
        {board.actions.map((action) =>
          action === "Manage" ? (
            <Link key={action} href="/dashboard/textbooks" className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-blue-200 px-3 text-xs font-black text-blue-600 transition hover:bg-blue-50 sm:px-4 sm:text-sm">
              {action}
            </Link>
          ) : (
            <Link
              key={action}
              href={action === "Request Access" ? "/signup" : "/dashboard/textbooks"}
              className={`inline-flex h-11 flex-[1.35] items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-xs font-black transition sm:text-sm ${
                action === "Request Access" ? "border border-blue-600 bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:bg-blue-700"
              }`}
            >
              {action}
              {action !== "Request Access" ? <ArrowRight className="h-4 w-4" /> : null}
            </Link>
          )
        )}
      </div>
    </article>
  );
}

function BoardMeta({ label, value, Icon }: { label: string; value: string; Icon: typeof Library }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
      <p>
        <span className="font-black text-[#07133b]">{label}: </span>
        {value}
      </p>
    </div>
  );
}

function GroundingSection() {
  return (
    <section className="mt-6 grid items-center gap-6 rounded-3xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff7ff_100%)] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.06)] lg:grid-cols-[220px_1fr_380px]">
      <Image src="/landing/textbook-grounded-v2.png" alt="Open textbook with curriculum grounding checklist for TeachPad content generation." width={300} height={225} className="mx-auto h-32 w-48 object-contain drop-shadow-[0_16px_24px_rgba(37,99,235,0.18)] lg:h-40 lg:w-56" />
      <div>
        <h2 className="text-2xl font-black text-slate-950">How curriculum grounding works</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          TeachPad uses the selected board, class, subject, textbook, and chapter to generate classroom-ready content.
          This helps teachers create lesson plans, worksheets, presentations, and quizzes that stay aligned with the actual
          textbook instead of producing generic AI output.
        </p>
      </div>
      <ul className="space-y-4">
        {groundingSteps.map((step) => (
          <li key={step} className="flex items-center gap-3 text-sm font-bold text-[#07133b]">
            <CheckCircle2 className="h-5 w-5 fill-blue-600 text-white" />
            {step}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="mt-6 grid items-center gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef7ff_100%)] px-7 py-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[1fr_420px]">
      <div>
        <h2 className="text-2xl font-black text-slate-950">All your teaching. Aligned with the right curriculum.</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
          Join thousands of teachers who trust TeachPad for curriculum-aligned, textbook-grounded teaching.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700">
            Get Started Free
          </Link>
          <Link href="/#features" className="inline-flex h-12 items-center justify-center rounded-full border border-blue-200 bg-white px-6 text-sm font-black text-blue-600 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-300">
            Explore Features
          </Link>
        </div>
      </div>
      <Image src="/landing/backpack-globe-v2.png" alt="Backpack, globe, books, and stationery representing curriculum-aligned teaching resources." width={560} height={280} className="mx-auto h-40 w-full object-contain object-center lg:h-48" />
    </section>
  );
}

function FaqSection() {
  return (
    <section className="py-9">
      <h2 className="text-center text-2xl font-black text-slate-950">Frequently Asked Questions</h2>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {faqs.map((faq) => (
          <article key={faq.question} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(25,78,140,0.05)]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <faq.Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-[#07133b]">{faq.question}</h3>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{faq.answer}</p>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />
          </article>
        ))}
      </div>
    </section>
  );
}

function JkboseMark() {
  return (
    <span className="grid h-32 w-32 place-items-center">
      <Image
        src="/landing/board-logos/jkbose-logo.png"
        alt="Jammu and Kashmir Board of School Education logo"
        width={448}
        height={409}
        className="h-32 w-32 object-contain"
      />
    </span>
  );
}

function NcertMark() {
  return (
    <span className="grid h-32 w-32 place-items-center">
      <Image
        src="/landing/board-logos/cbse-logo.png"
        alt="Central Board of Secondary Education logo"
        width={620}
        height={655}
        className="h-32 w-32 object-contain"
      />
    </span>
  );
}

function CustomMark() {
  return (
    <span className="grid h-32 w-32 place-items-center rounded-lg bg-violet-50 text-violet-600">
      <Building2 className="h-24 w-24 fill-violet-200" />
    </span>
  );
}

function StateBoardMark() {
  return (
    <span className="grid h-32 w-32 place-items-center rounded-lg bg-orange-50 text-orange-500">
      <MapPinned className="h-24 w-24 fill-orange-200" />
    </span>
  );
}
