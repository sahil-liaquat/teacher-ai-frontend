"use client";

/**
 * Motion + media primitives for /school-excellence.
 *
 * The page is illustration-led: ten of its twelve images are transparent PNGs
 * that float directly on the page background rather than sitting in a card. So
 * the job of this module is to make a bare image feel deliberate — depth from
 * scroll parallax, life from a slow float, focus from an ambient glow, and
 * response from a pointer tilt.
 *
 * Every effect here degrades to "the image, still and correct" under
 * `prefers-reduced-motion`. Nothing on this page depends on motion to be
 * readable.
 */

import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef, type ReactNode } from "react";
import { EASE_PREMIUM } from "@/lib/use-motion";

// ─── Scroll parallax ─────────────────────────────────────────────────

/**
 * Vertical drift as an element crosses the viewport. `strength` is the total
 * travel in pixels across the whole crossing, so 60 means +30 → −30.
 */
function useParallax(ref: React.RefObject<HTMLElement | null>, strength: number): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 26, restDelta: 0.001 });
  return useTransform(smooth, [0, 1], [strength / 2, -strength / 2]);
}

// ─── Pointer tilt ────────────────────────────────────────────────────

/**
 * 3D tilt that follows the pointer. Returns the handlers plus the two spring
 * values, so a caller can hang other effects (a moving highlight, a shadow) off
 * the same gesture.
 */
function useTilt(max: number, enabled: boolean) {
  const rotateX = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const pointerX = useSpring(useMotionValue(50), { stiffness: 120, damping: 20 });
  const pointerY = useSpring(useMotionValue(50), { stiffness: 120, damping: 20 });

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!enabled || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - bounds.left) / bounds.width;
    const py = (event.clientY - bounds.top) / bounds.height;
    rotateY.set((px - 0.5) * max * 2);
    rotateX.set((0.5 - py) * max * 2);
    pointerX.set(px * 100);
    pointerY.set(py * 100);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
    pointerX.set(50);
    pointerY.set(50);
  }

  return { rotateX, rotateY, pointerX, pointerY, onPointerMove, onPointerLeave };
}

// ─── Floating artwork ────────────────────────────────────────────────

export type FloatArtProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Total parallax travel in px across the viewport crossing. 0 disables it. */
  parallax?: number;
  /** Adds the slow idle bob. Off for the largest visuals, which drift instead. */
  float?: boolean;
  /** Pointer tilt in degrees. 0 disables it. */
  tilt?: number;
  /** Ambient colour wash behind the artwork. */
  glow?: "none" | "soft" | "strong";
  /** Scales up slightly as it enters — reads as "arriving", not "popping". */
  zoomIn?: boolean;
  /**
   * The scroll entrance. Turn it off for anything above the fold: an element
   * animating up from `opacity: 0` cannot register as the Largest Contentful
   * Paint, so the hero artwork would be penalised for its own animation.
   */
  entrance?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imageClassName?: string;
};

/**
 * A transparent illustration presented as a floating object: no frame, no card,
 * no border. Depth comes from the glow and the parallax, not from a box.
 */
export function FloatArt({
  src,
  alt,
  width,
  height,
  parallax = 56,
  float = true,
  tilt = 5,
  glow = "soft",
  zoomIn = true,
  entrance = true,
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 1100px",
  className = "",
  imageClassName = "",
}: FloatArtProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const enabled = !prefersReduced;
  const y = useParallax(ref, enabled && parallax ? parallax : 0);
  const { rotateX, rotateY, onPointerMove, onPointerLeave } = useTilt(tilt, enabled && tilt > 0);

  return (
    <motion.div
      ref={ref}
      style={enabled ? { y } : undefined}
      className={`relative ${className}`}
      initial={enabled && entrance ? { opacity: 0, scale: zoomIn ? 0.94 : 1, y: 26 } : undefined}
      whileInView={enabled && entrance ? { opacity: 1, scale: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 1, ease: EASE_PREMIUM }}
    >
      {glow !== "none" ? (
        <span
          aria-hidden="true"
          className={`se-art-glow ${glow === "strong" ? "se-art-glow-strong" : ""}`}
        />
      ) : null}

      <motion.div
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={enabled && tilt > 0 ? { rotateX, rotateY, transformPerspective: 1400 } : undefined}
        className={`relative ${enabled && float ? "se-float" : ""}`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          className={`relative h-auto w-full se-art-shadow ${imageClassName}`}
        />
      </motion.div>
    </motion.div>
  );
}

// ─── Framed screenshot ───────────────────────────────────────────────

/**
 * For the two opaque images (the classroom photograph and the printed cycle
 * poster). These do need an edge, so they get a soft frame, a scroll-driven
 * unmask and a one-shot light sweep when they arrive.
 */
export function FramedArt({
  src,
  alt,
  width,
  height,
  parallax = 44,
  priority = false,
  rounded = "rounded-[26px]",
  sizes = "(max-width: 1024px) 100vw, 900px",
  className = "",
  children,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  parallax?: number;
  priority?: boolean;
  rounded?: string;
  sizes?: string;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const enabled = !prefersReduced;
  const y = useParallax(ref, enabled ? parallax : 0);

  return (
    <motion.div ref={ref} style={enabled ? { y } : undefined} className={`relative ${className}`}>
      <motion.div
        initial={enabled ? { opacity: 0, clipPath: "inset(14% 8% 14% 8% round 26px)" } : undefined}
        whileInView={enabled ? { opacity: 1, clipPath: "inset(0% 0% 0% 0% round 26px)" } : undefined}
        viewport={{ once: true, margin: "-90px" }}
        transition={{ duration: 1.1, ease: EASE_PREMIUM }}
        className={`se-photo-frame relative overflow-hidden ${rounded}`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          className="h-auto w-full"
        />
        <span aria-hidden="true" className="se-sweep" />
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Text ────────────────────────────────────────────────────────────

/**
 * Word-by-word rise. Applied only to the page's largest headings — used on every
 * heading it would read as a tic rather than an entrance.
 */
export function WordReveal({
  text,
  id,
  className = "",
  as: Tag = "span",
  delay = 0,
  accentFrom,
  onNavy = false,
}: {
  text: string;
  /** Passed through so a revealed heading can still be a section's `labelledBy`. */
  id?: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  delay?: number;
  /** Word index from which the accent colour takes over. */
  accentFrom?: number;
  /** `--se-accent` is too dark to carry a heading on navy; use its light tint. */
  onNavy?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const words = text.split(" ");
  const MotionTag = motion[Tag];
  const accentClass = onNavy ? "se-display-soft-navy" : "se-display-soft";

  if (prefersReduced) {
    return (
      <Tag id={id} className={className}>
        {words.map((word, index) => (
          <span key={`${word}-${index}`} className={accentFrom !== undefined && index >= accentFrom ? accentClass : ""}>
            {word}{index < words.length - 1 ? " " : ""}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <MotionTag
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-70px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.055, delayChildren: delay } } }}
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className={`inline-block ${accentFrom !== undefined && index >= accentFrom ? accentClass : ""}`}
            variants={{
              hidden: { y: "108%", opacity: 0 },
              visible: { y: "0%", opacity: 1, transition: { duration: 0.75, ease: EASE_PREMIUM } },
            }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

// ─── Controls ────────────────────────────────────────────────────────

/**
 * CTA that leans toward the cursor. The pull is small (8px at the edge) — enough
 * to feel responsive, not enough to make the button hard to hit.
 */
export function MagneticCta({
  children,
  onClick,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "onnavy" | "ghost-onnavy";
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 20 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 20 });

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (prefersReduced || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 16);
    y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 10);
  }

  const variantClass =
    variant === "primary"
      ? "se-cta-primary"
      : variant === "secondary"
        ? "se-cta-secondary"
        : variant === "onnavy"
          ? "se-cta-onnavy"
          : "se-cta-ghost-onnavy";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={prefersReduced ? undefined : { x, y }}
      className={`se-cta ${variantClass} se-cta-shine ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ─── Marquee ─────────────────────────────────────────────────────────

/**
 * Edge-to-edge scrolling strip. The children are rendered twice and the track
 * translates exactly −50%, so the loop has no seam.
 */
export function Marquee({
  children,
  speed = 46,
  reverse = false,
  className = "",
}: {
  children: ReactNode;
  /** Seconds for one full pass. */
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`se-marquee ${className}`}>
      <div
        className={`se-marquee-track ${reverse ? "se-marquee-reverse" : ""}`}
        style={{ animationDuration: `${speed}s` }}
      >
        <div className="se-marquee-run" aria-hidden={false}>
          {children}
        </div>
        <div className="se-marquee-run" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Reading progress ────────────────────────────────────────────────

/** Hairline progress bar pinned under the site header. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[linear-gradient(90deg,#0165fd,#7c5cff,#0165fd)]"
    />
  );
}

// ─── Small decorations ───────────────────────────────────────────────

/** Numbered badge that draws its ring on reveal. */
export function StepBadge({ index, onNavy = false }: { index: number; onNavy?: boolean }) {
  const prefersReduced = useReducedMotion();

  return (
    <span className={`se-step-badge ${onNavy ? "se-step-badge-navy" : ""}`}>
      <svg viewBox="0 0 44 44" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <motion.circle
          cx="22"
          cy="22"
          r="20.5"
          fill="none"
          stroke="var(--se-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength={1}
          initial={prefersReduced ? undefined : { pathLength: 0, opacity: 0.2 }}
          whileInView={prefersReduced ? undefined : { pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, ease: EASE_PREMIUM }}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="se-ui relative text-[13px] font-black">{String(index).padStart(2, "0")}</span>
    </span>
  );
}

/**
 * A chip that floats beside an illustration — the "82% coverage" style callout.
 * `at` positions it against the artwork with Tailwind position utilities.
 */
export function FloatChip({
  children,
  at,
  delay = 0,
  drift = 1,
}: {
  children: ReactNode;
  /**
   * Position utilities to pin the chip over an illustration. Omit it to let the
   * chip sit in normal flow — which is what the hero does, because anything
   * floated on top of these renders lands on a label they already carry.
   */
  at?: string;
  delay?: number;
  /** 1 | 2 | 3 — picks one of three float rhythms so chips never move in lockstep. */
  drift?: 1 | 2 | 3;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.span
      initial={prefersReduced ? undefined : { opacity: 0, scale: 0.8, y: 10 }}
      whileInView={prefersReduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, ease: EASE_PREMIUM, delay }}
      className={at ? `absolute z-10 hidden md:flex ${at}` : "flex"}
    >
      <span className={`se-float-chip ${prefersReduced ? "" : `se-drift-${drift}`}`}>{children}</span>
    </motion.span>
  );
}

/** Pointer-following highlight used on the dark sections' cards. */
export function SpotlightCard({
  children,
  className = "",
  onNavy = false,
}: {
  children: ReactNode;
  className?: string;
  onNavy?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  // `0` degrees of rotation, but the hook still has to be enabled — it is what
  // tracks the pointer position the highlight is drawn from.
  const { pointerX, pointerY, onPointerMove, onPointerLeave } = useTilt(0, !prefersReduced);
  const background = useMotionTemplate`radial-gradient(340px circle at ${pointerX}% ${pointerY}%, ${
    onNavy ? "rgba(138,180,255,0.16)" : "rgba(1,101,253,0.09)"
  }, transparent 68%)`;

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`group relative overflow-hidden ${className}`}
    >
      {prefersReduced ? null : (
        <motion.span
          aria-hidden="true"
          style={{ background }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
