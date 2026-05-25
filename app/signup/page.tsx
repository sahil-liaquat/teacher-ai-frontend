"use client";

import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-hidden bg-[#f6f9ff] px-4 py-4 text-[#07111f] sm:px-6">
      <section className="relative grid min-h-[calc(100vh-2rem)] w-full max-w-full place-items-center overflow-hidden rounded-lg bg-white px-5 py-8 text-center shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(219,239,255,0.78)_0,transparent_32%),radial-gradient(circle_at_86%_84%,rgba(220,255,238,0.72)_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]" />
        <Link href="/" aria-label="TeachPad home" className="absolute left-5 top-5 z-20 inline-flex sm:left-8 sm:top-8">
          <Image
            src="/assets/teachpad-logo.png"
            alt="TeachPad.in"
            width={1385}
            height={279}
            className="h-auto w-36 lg:w-44"
            priority
          />
        </Link>

        <div className="relative z-10 w-full max-w-md">
          <span className="inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
            Signup paused
          </span>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950">
            New signups are temporarily disabled.
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
            We are not accepting new accounts right now. Existing users can still log in and continue using TeachPad.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-black text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Go to login
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
