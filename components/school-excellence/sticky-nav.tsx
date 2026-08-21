"use client";

/**
 * In-page navigation for /school-excellence.
 *
 * Sits directly beneath the site header and sticks once the reader leaves the
 * hero. Scroll-spy uses a narrow observation band near the top of the viewport
 * so the highlighted item matches what the reader is actually looking at.
 * On small screens the links scroll horizontally and the CTA stays pinned.
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLeadForm } from "./lead-form";

const items = [
  { id: "overview", label: "Overview" },
  { id: "what-changes", label: "What Changes" },
  { id: "programme", label: "The Programme" },
  { id: "journey", label: "Implementation" },
  { id: "ai", label: "AI" },
  { id: "for-teachers", label: "For Teachers" },
  { id: "for-leadership", label: "For Leadership" },
  { id: "pilot", label: "60-Day Pilot" },
] as const;

export function StickyNav() {
  const [active, setActive] = useState<string>("overview");
  const { openLeadForm } = useLeadForm();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);

    if (targets.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }

        // Highest section still inside the band wins, so the label matches the
        // heading the reader has most recently passed.
        const current = items.find((item) => visible.has(item.id));
        if (current) setActive(current.id);
      },
      { rootMargin: "-152px 0px -62% 0px", threshold: 0 }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="School Excellence Program sections"
      className="sticky top-16 z-40 border-b border-[var(--se-line)] bg-[rgba(255,255,255,0.9)] backdrop-blur-xl sm:top-20"
    >
      <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-5 sm:px-8">
        <ul className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const isActive = active === item.id;

            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative inline-flex items-center whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-semibold transition-colors ${
                    isActive
                      ? "text-[var(--se-accent-deep)]"
                      : "text-[var(--se-muted)] hover:text-[var(--se-ink)]"
                  }`}
                >
                  {/* One pill, shared across every item via `layoutId`, so it
                      travels to the new section instead of blinking out here and
                      in again over there. */}
                  {isActive ? (
                    <motion.span
                      aria-hidden="true"
                      layoutId="se-nav-pill"
                      transition={
                        prefersReduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 38, mass: 0.7 }
                      }
                      className="absolute inset-0 rounded-md bg-[var(--se-accent-tint)]"
                    />
                  ) : null}
                  <span className="relative">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => openLeadForm("consultation")}
          className="shrink-0 rounded-md bg-[var(--se-accent)] px-3.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--se-accent-deep)] sm:px-4"
        >
          Book a Consultation
        </button>
      </div>
    </nav>
  );
}
