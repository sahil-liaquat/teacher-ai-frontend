"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Home, RefreshCcw, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ErrorPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusCode?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorPageShell({
  eyebrow,
  title,
  description,
  statusCode,
  primaryHref = "/",
  primaryLabel = "Back to Home",
  secondaryHref = "/ai-tools",
  secondaryLabel = "Explore AI Tools",
  onRetry,
  retryLabel = "Try Again"
}: ErrorPageShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#eef6ff_0,transparent_28%),radial-gradient(circle_at_88%_16%,#f4fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-[#07111f]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-6 lg:px-8">
        <Link href="/" aria-label="teachpad.in home" className="inline-flex w-fit">
          <Image
            src="/assets/teachpad-logo.png"
            alt="TeachPad.in"
            width={1385}
            height={279}
            quality={100}
            className="h-auto w-36 sm:w-44"
            priority
          />
        </Link>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
              <Search className="h-4 w-4" />
              {eyebrow}
            </div>

            {statusCode ? (
              <p className="mt-7 text-6xl font-black leading-none tracking-tight text-blue-600 sm:text-7xl">
                {statusCode}
              </p>
            ) : null}

            <h1 className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]">
              {title}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
              {description}
            </p>

            <div className="mx-auto mt-8 flex max-w-[460px] flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:mx-0 lg:justify-start">
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  <RefreshCcw className="h-4 w-4" />
                  {retryLabel}
                </button>
              ) : (
                <Link
                  href={primaryHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  <Home className="h-4 w-4" />
                  {primaryLabel}
                </Link>
              )}

              <Link
                href={secondaryHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
              >
                {secondaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto grid w-full max-w-[620px] place-items-center lg:max-w-none">
            <div className="absolute inset-x-8 bottom-6 h-24 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="relative aspect-square w-full max-w-[520px] rounded-[2rem] border border-blue-100 bg-white p-5 shadow-[0_34px_70px_rgba(47,79,129,0.16)]">
              <ErrorAnimation />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ErrorAnimation() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animation: { destroy: () => void } | null = null;
    let cancelled = false;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    async function loadAnimation() {
      if (prefersReducedMotion) return;

      const lottie = (await import("lottie-web")).default;
      if (!containerRef.current || cancelled) return;

      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/assets/illustrations/error-animation.json"
      });
    }

    loadAnimation();

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="h-full w-full"
    />
  );
}
