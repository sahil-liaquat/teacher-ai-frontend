import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/86 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" aria-label="teachpad.in home" className="shrink-0">
          <TeachPadLogo />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/ai-tools" className="hidden text-sm font-semibold text-slate-800 transition hover:text-blue-600 md:inline">
            AI Tools
          </Link>
          <Link href="/login" className="hidden text-sm font-semibold text-slate-800 transition hover:text-blue-600 sm:inline">
            Login
          </Link>
          <Link
            href="/signup"
            className="hidden h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-700 sm:inline-flex"
          >
            <span className="sm:hidden">Start Free</span>
            <span className="hidden sm:inline">Get Started Free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function TeachPadLogo() {
  return (
    <Image src="/assets/teachpad-logo.png" alt="TeachPad.in" width={1385} height={279} className="h-auto w-32 sm:w-44" priority />
  );
}
