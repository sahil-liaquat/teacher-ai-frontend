"use client";

/**
 * Shared building blocks for /school-excellence.
 *
 * These are page-scoped on purpose: the marketing site's primitives are styled
 * for the teacher-facing product (rounded-full pills, pastel tints, font-black).
 * This page speaks to school leadership, so it uses hairline rules, a serif
 * display face and restrained motion. Styles live in
 * `app/school-excellence/school-excellence.css` under `.se`.
 */

import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { EASE_PREMIUM } from "@/lib/use-motion";

// ─── Layout ──────────────────────────────────────────────────────────

/**
 * One section = one vertical rhythm unit. `tone` swaps the background between
 * white, warm paper and deep navy so the page reads as chapters rather than an
 * endless scroll of cards.
 *
 * ⚠ To contain decoration that bleeds sideways (the aurora, a tilted
 * illustration), pass `overflow-x-clip` — never `overflow-hidden`. `hidden`
 * makes the section a scroll container, and `position: sticky` descendants then
 * resolve against it instead of the viewport, which silently kills the sticky
 * panels in `principals-view` and `before-after`. `clip` does not create one.
 */
export function Section({
  id,
  tone = "paper",
  className = "",
  children,
  labelledBy,
}: {
  id?: string;
  tone?: "paper" | "warm" | "navy" | "transparent";
  className?: string;
  children: ReactNode;
  labelledBy?: string;
}) {
  const toneClass =
    tone === "warm"
      ? "bg-[var(--se-paper-warm)]"
      : tone === "navy"
        ? "bg-[var(--se-navy)] text-[var(--se-navy-ink)]"
        : tone === "transparent"
          ? ""
          : "bg-[var(--se-paper)]";

  return (
    <section
      id={id}
      data-se-anchor={id ? "" : undefined}
      aria-labelledby={labelledBy}
      className={`relative ${toneClass} ${className}`}
    >
      {children}
    </section>
  );
}

/** Standard page gutter + max width. Text blocks get their own narrower caps. */
export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[1180px] px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** Vertical padding scale used by every section. */
export const SECTION_PAD = "py-20 sm:py-28 lg:py-36";
export const SECTION_PAD_TIGHT = "py-16 sm:py-20 lg:py-24";

// ─── Type ────────────────────────────────────────────────────────────

/**
 * Section label. Rendered as a pill with a pulsing dot so it reads as a marker
 * above the headline rather than as a first line of copy — the illustration-led
 * sections need the eye to skip past it to the artwork.
 */
export function Eyebrow({
  children,
  onNavy = false,
  className = "",
}: {
  children: ReactNode;
  onNavy?: boolean;
  className?: string;
}) {
  return (
    <span className={`se-tag ${onNavy ? "se-tag-navy" : ""} ${className}`}>
      <span aria-hidden="true" className="se-tag-dot" />
      {children}
    </span>
  );
}

/**
 * Section headline. `lead` is the first line, `trail` the quieter second line —
 * the two-line construction the brief uses throughout ("Schools plan the
 * academic year once. / Teachers rebuild it every day.").
 */
export function Headline({
  id,
  lead,
  trail,
  as: Tag = "h2",
  size = "lg",
  onNavy = false,
  className = "",
}: {
  id?: string;
  lead: ReactNode;
  trail?: ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: "sm" | "md" | "lg" | "xl";
  onNavy?: boolean;
  className?: string;
}) {
  const sizeClass =
    size === "xl"
      ? "text-[34px] leading-[1.08] min-[390px]:text-[40px] sm:text-[54px] lg:text-[64px]"
      : size === "lg"
        ? "text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[42px] lg:text-[50px]"
        : size === "md"
          ? "text-[24px] leading-[1.16] sm:text-[32px] lg:text-[38px]"
          : "text-[20px] leading-[1.2] sm:text-[25px]";

  return (
    <Tag
      id={id}
      className={`se-display ${sizeClass} ${onNavy ? "se-on-navy" : ""} ${className}`}
    >
      {lead}
      {trail ? (
        <>
          <br />
          <span className={onNavy ? "se-display-soft-navy" : "se-display-soft"}>{trail}</span>
        </>
      ) : null}
    </Tag>
  );
}

/** Body copy under a headline. */
export function Lede({
  children,
  onNavy = false,
  className = "",
}: {
  children: ReactNode;
  onNavy?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`max-w-[62ch] text-[16px] leading-[1.75] sm:text-[17px] sm:leading-[1.8] ${
        onNavy ? "text-[var(--se-navy-muted)]" : "text-[var(--se-body)]"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * A full-width statement — the page's punctuation between chapters. Used for
 * lines like "The problem is not planning."
 */
export function Statement({
  lead,
  trail,
  support,
  tone = "warm",
  align = "center",
}: {
  lead: ReactNode;
  trail?: ReactNode;
  support?: ReactNode;
  tone?: "warm" | "paper" | "navy";
  align?: "center" | "left";
}) {
  const onNavy = tone === "navy";

  return (
    <div
      className={`se-noise relative overflow-x-clip border-y ${
        onNavy ? "se-noise-dark border-[var(--se-navy-line)]" : "border-[var(--se-line)]"
      } ${tone === "warm" ? "bg-[var(--se-paper-warm)]" : onNavy ? "bg-[var(--se-navy)]" : "bg-[var(--se-paper)]"}`}
    >
      <span
        aria-hidden="true"
        className={`se-statement-wash ${onNavy ? "se-statement-wash-navy" : ""}`}
      />

      <Container className={`relative z-[2] py-16 sm:py-24 ${align === "center" ? "text-center" : ""}`}>
        {/* No outer `Reveal` here: the mask is the entrance. Stacking a fade and
            a lift on top of it would read as two separate arrivals. */}
        <p
          className={`se-display mx-auto text-[25px] leading-[1.2] sm:text-[36px] lg:text-[44px] ${
            align === "center" ? "max-w-[24ch]" : "max-w-[30ch]"
          } ${onNavy ? "se-on-navy" : ""}`}
        >
          <MaskLine>{lead}</MaskLine>
          {trail ? (
            <MaskLine delay={0.12} className={onNavy ? "se-display-soft-navy" : "se-display-soft"}>
              {trail}
            </MaskLine>
          ) : null}
        </p>
        {support ? (
          <Reveal delay={0.3}>
            <p
              className={`mx-auto mt-5 max-w-[52ch] text-[15px] font-medium leading-[1.7] sm:text-base ${
                onNavy ? "text-[var(--se-navy-muted)]" : "text-[var(--se-muted)]"
              }`}
            >
              {support}
            </p>
          </Reveal>
        ) : null}
      </Container>
    </div>
  );
}

/** Small uppercase index label ("01", "WEEK 3") used on modules and timelines. */
export function Index({ children, onNavy = false }: { children: ReactNode; onNavy?: boolean }) {
  return (
    <span
      className={`se-ui text-[12px] font-bold tracking-[0.16em] ${
        onNavy ? "text-[var(--se-navy-muted)]" : "text-[var(--se-muted)]"
      }`}
    >
      {children}
    </span>
  );
}

// ─── Motion ──────────────────────────────────────────────────────────

/**
 * A line that rises out from behind its own edge.
 *
 * Distinct from `Reveal` on purpose. `Reveal` is the page's workhorse — a fade
 * and a small lift, applied to almost everything. This is reserved for the big
 * display lines, where the copy is doing the heavy lifting and deserves a
 * gesture of its own: the text is masked by its container and slides up into
 * place, so it reads as being *revealed* rather than as arriving.
 *
 * The padding/negative-margin pair gives descenders room — without it the mask
 * shears the tails off every g, y and p once the animation settles.
 *
 * ⚠ The trigger watches the *outer* span, and it has to. `whileInView` observes
 * the element it is declared on, and this element starts translated a full line
 * below its own mask — which means it is entirely clipped by that mask's
 * `overflow: hidden`, and an IntersectionObserver reports a clipped target as
 * not intersecting. Declaring `whileInView` on the inner span therefore
 * deadlocks: it cannot animate in because it is hidden, and it is hidden
 * because it has not animated. Observing the unclipped parent breaks the loop.
 */
export function MaskLine({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-70px" });

  return (
    <span ref={ref} className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
      <motion.span
        className={`block ${className}`}
        initial={prefersReduced ? undefined : { y: "112%" }}
        animate={prefersReduced ? undefined : { y: inView ? "0%" : "112%" }}
        transition={{ duration: 0.9, ease: EASE_PREMIUM, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Fade + 18px rise, once, on scroll. The page's single reveal gesture. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const prefersReduced = useReducedMotion();
  const MotionTag = motion[as];

  return (
    <MotionTag
      initial={prefersReduced ? undefined : { opacity: 0, y: 18 }}
      whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE_PREMIUM, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/** Staggered variant for grids and lists. */
export function RevealGroup({
  children,
  className = "",
  stagger = 0.09,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ul" | "ol";
}) {
  const prefersReduced = useReducedMotion();
  const MotionTag = motion[as];

  return (
    <MotionTag
      initial={prefersReduced ? undefined : "hidden"}
      whileInView={prefersReduced ? undefined : "visible"}
      viewport={{ once: true, margin: "-70px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export function RevealItem({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const MotionTag = motion[as];

  return (
    <MotionTag
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_PREMIUM } },
      }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Counts up to `value` when scrolled into view. Only ever used on figures that
 * are explicitly labelled as illustrative dashboard examples.
 */
export function CountUp({
  value,
  suffix = "",
  duration = 1100,
  className = "",
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // Reduced motion shows the figure straight away — never wait for the
    // element to be scrolled into view, or the number can be stuck at zero.
    if (prefersReduced) {
      setDisplay(value);
      return;
    }
    if (!inView) return;

    let frame = 0;
    // ⚠ The clock has to come from the first frame, not from `performance.now()`
    // here: rAF hands the callback the time the *frame* began, which can be
    // earlier than the moment the frame was requested. Measuring against the
    // later timestamp yields a negative progress on the first tick, and
    // easeOutExpo turns that into a briefly negative figure on screen.
    let start = 0;

    const tick = (now: number) => {
      if (start === 0) start = now;
      const progress = Math.min(Math.max((now - start) / duration, 0), 1);
      // easeOutExpo — fast settle, no bounce
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, prefersReduced, value, duration]);

  return (
    <span ref={ref} className={`se-ui ${className}`}>
      {display}
      {suffix}
    </span>
  );
}

/** Horizontal meter that fills on reveal. `value` is a percentage. */
export function Meter({
  value,
  tone = "accent",
  className = "",
  height = "h-1.5",
}: {
  value: number;
  tone?: "accent" | "taught" | "assessed" | "pending" | "muted" | "light" | "sky";
  className?: string;
  height?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReduced = useReducedMotion();
  const filled = inView || prefersReduced;

  const toneColor =
    tone === "taught"
      ? "var(--se-status-taught)"
      : tone === "assessed"
        ? "var(--se-status-assessed)"
        : tone === "pending"
          ? "var(--se-status-pending)"
          : tone === "muted"
            ? "var(--se-status-planned)"
            : tone === "light"
              ? "rgba(255,255,255,0.85)"
              : tone === "sky"
                ? "#8ab4ff"
                : "var(--se-accent)";
  const onDark = tone === "light" || tone === "sky";

  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden rounded-full ${height} ${
        onDark ? "bg-white/[0.14]" : "bg-[rgba(13,26,43,0.08)]"
      } ${className}`}
    >
      <div
        className="se-meter-fill absolute inset-y-0 left-0 w-full rounded-full"
        style={{
          background: toneColor,
          transform: `scaleX(${filled ? Math.max(0, Math.min(value, 100)) / 100 : 0})`,
        }}
      />
    </div>
  );
}

// ─── Surfaces ────────────────────────────────────────────────────────

/** Implementation-status token, shared by the dashboard and the legend. */
export const STATUS_TONES = {
  Planned: "var(--se-status-planned)",
  Taught: "var(--se-status-taught)",
  Pending: "var(--se-status-pending)",
  Rescheduled: "var(--se-status-rescheduled)",
  Skipped: "var(--se-status-skipped)",
  Assessed: "var(--se-status-assessed)",
} as const;

export type StatusName = keyof typeof STATUS_TONES;

export function StatusTag({ status, className = "" }: { status: StatusName; className?: string }) {
  const color = STATUS_TONES[status];

  return (
    <span
      className={`se-ui inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
      style={{ borderColor: `${color}33`, color, background: `${color}0f` }}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {status}
    </span>
  );
}

/**
 * Slot for real proof — school references, pilot outcomes, report excerpts.
 * Renders `children` when real evidence is supplied. While empty it shows a
 * build-time reminder in development and renders nothing in production, so the
 * live page never displays an unfinished placeholder.
 */
export function EvidenceSlot({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint: string;
  children?: ReactNode;
  className?: string;
}) {
  if (children) return <div className={className}>{children}</div>;
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      className={`rounded-xl border border-dashed border-[var(--se-line-strong)] bg-[var(--se-paper-warm)] p-6 ${className}`}
    >
      <p className="se-eyebrow">Evidence slot · development only</p>
      <p className="se-display mt-2 text-[19px] leading-snug">{title}</p>
      <p className="mt-2 max-w-[62ch] text-[13px] font-medium leading-[1.65] text-[var(--se-muted)]">{hint}</p>
    </div>
  );
}

/** Hairline list row — the page's default way to show a list of specifics. */
export function RuleRow({
  children,
  onNavy = false,
  className = "",
}: {
  children: ReactNode;
  onNavy?: boolean;
  className?: string;
}) {
  return (
    <li
      className={`flex items-start gap-3 border-b py-3 text-[14px] font-medium leading-[1.6] last:border-b-0 ${
        onNavy
          ? "border-[var(--se-navy-line)] text-[var(--se-navy-muted)]"
          : "border-[var(--se-line)] text-[var(--se-body)]"
      } ${className}`}
    >
      {children}
    </li>
  );
}
