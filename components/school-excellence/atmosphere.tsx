"use client";

/**
 * Atmosphere — the page's background craft.
 *
 * These are the layers that sit *behind* content: lit fields, grain, beams, a
 * light that follows the cursor, and the seams that blend one section into the
 * next so the page stops reading as stacked rectangles.
 *
 * All of it is CSS transforms, opacity and filters. No WebGL: the page has to
 * stay fast on the mid-range phone a principal will actually open it on, and a
 * well-layered blur composition reads as expensive without shipping a renderer.
 *
 * Every continuous effect here is switched off under `prefers-reduced-motion`
 * (see the block at the foot of `school-excellence.css`), and the pointer-driven
 * ones never attach on touch.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

type Tone = "light" | "dark";

// ─── Lit field ───────────────────────────────────────────────────────

/**
 * Four slow gradient blobs on independent orbits. This is the base layer for
 * every full-bleed section — it is what makes a background read as lit space
 * rather than a flat tint.
 */
export function MeshField({
  tone = "light",
  className = "",
  opacity = 1,
}: {
  tone?: Tone;
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{ opacity }}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        tone === "dark" ? "se-mesh-dark" : ""
      } ${className}`}
    >
      <span className="se-mesh se-mesh-1" />
      <span className="se-mesh se-mesh-2" />
      <span className="se-mesh se-mesh-3" />
      <span className="se-mesh se-mesh-4" />
    </div>
  );
}

// ─── Light beams ─────────────────────────────────────────────────────

/** Two soft shafts raking across a dark section. Dark sections only. */
export function Beams({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <span className="se-beam se-beam-a" />
      <span className="se-beam se-beam-b" />
    </div>
  );
}

// ─── Pointer light ───────────────────────────────────────────────────

/**
 * A large soft light that trails the cursor across the section it is dropped
 * into. Springs, so it lags the pointer slightly — an instant follow reads as
 * a cheap hover effect, a lagging one reads as a light with mass.
 *
 * Never attaches on touch or under reduced motion.
 */
export function PointerLight({ tone = "light", size = 620 }: { tone?: Tone; size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const x = useSpring(useMotionValue(-9999), { stiffness: 42, damping: 22, mass: 0.7 });
  const y = useSpring(useMotionValue(-9999), { stiffness: 42, damping: 22, mass: 0.7 });

  useEffect(() => {
    if (prefersReduced) return;
    const node = ref.current?.parentElement;
    if (!node) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const onMove = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect();
      x.set(event.clientX - bounds.left);
      y.set(event.clientY - bounds.top);
      ref.current?.setAttribute("data-active", "true");
    };
    const onLeave = () => ref.current?.setAttribute("data-active", "false");

    node.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [prefersReduced, x, y]);

  const glow =
    tone === "dark"
      ? "rgba(138,180,255,0.13), rgba(124,92,255,0.07) 45%, transparent 70%"
      : "rgba(1,101,253,0.09), rgba(124,92,255,0.05) 45%, transparent 70%";
  const background = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, ${glow})`;

  if (prefersReduced) return null;

  return <motion.div ref={ref} aria-hidden="true" style={{ background }} className="se-pointer-light" />;
}

// ─── Section seams ───────────────────────────────────────────────────

const SEAM_COLOR = {
  paper: "#ffffff",
  warm: "#f8fafc",
  navy: "#0f172a",
} as const;

/**
 * The band that blends one section's background into the next. Without these
 * the page is a stack of hard-edged rectangles; with them the light carries
 * across the join.
 */
export function Seam({
  from,
  to,
  hairline = true,
}: {
  from: keyof typeof SEAM_COLOR;
  to: keyof typeof SEAM_COLOR;
  hairline?: boolean;
}) {
  const onNavy = from === "navy" || to === "navy";

  return (
    <div
      aria-hidden="true"
      className="se-seam"
      style={{ background: `linear-gradient(180deg, ${SEAM_COLOR[from]}, ${SEAM_COLOR[to]})` }}
    >
      {hairline ? (
        <span className={`se-seam-hairline ${onNavy ? "se-seam-hairline-navy" : ""}`} />
      ) : null}
    </div>
  );
}

// ─── Depth ───────────────────────────────────────────────────────────

/**
 * Scroll parallax for a background or foreground layer. `speed` is the total
 * travel in pixels across the element's whole crossing of the viewport, so 120
 * means +60 → −60. Negative values move against the scroll.
 */
export function Parallax({
  speed = 80,
  className = "",
  children,
}: {
  speed?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 64, damping: 24, restDelta: 0.001 });
  const y = useTransform(smooth, [0, 1], [speed / 2, -speed / 2]);

  return (
    <motion.div ref={ref} style={prefersReduced ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Scroll cue ──────────────────────────────────────────────────────

/** The "there is more below" marker at the foot of the hero. */
export function ScrollCue({ label = "Scroll" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="se-ui text-[10px] font-black uppercase tracking-[0.22em] text-[var(--se-muted)]">
        {label}
      </span>
      <span aria-hidden="true" className="se-scroll-cue" />
    </div>
  );
}

// ─── Edge light ──────────────────────────────────────────────────────

/**
 * A wide soft glow along a section's top or bottom edge.
 *
 * This is what stops a dark section from meeting a light one at a hard line:
 * the boundary reads as light spilling across the join rather than as two
 * rectangles stacked on top of each other.
 */
export function EdgeGlow({
  position = "top",
  tone = "dark",
  height = 420,
}: {
  position?: "top" | "bottom";
  tone?: Tone;
  height?: number;
}) {
  const color =
    tone === "dark" ? "rgba(1,101,253,0.32)" : "rgba(1,101,253,0.14)";

  return (
    <div
      aria-hidden="true"
      style={{
        height,
        background: `radial-gradient(62% 100% at 50% ${position === "top" ? "0%" : "100%"}, ${color}, transparent 70%)`,
      }}
      className={`pointer-events-none absolute inset-x-0 ${position === "top" ? "top-0" : "bottom-0"}`}
    />
  );
}


// ─── WebGL gate ──────────────────────────────────────────────────────

/**
 * Whether the hero should load its WebGL depth layer.
 *
 * Four conditions, all of which have to hold: the device has a working WebGL
 * context, the viewport is wide enough for the objects to sit in the margins
 * rather than over the content, there is a real pointer for them to react to,
 * and the reader has not asked for reduced motion.
 *
 * It starts `false` and only turns on after mount, which is what keeps the
 * three.js chunk off the critical path — and off the wire entirely for everyone
 * who fails one of the checks.
 */
export function useHeroDepthEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let webgl = false;
    try {
      const probe = document.createElement("canvas");
      webgl = Boolean(
        window.WebGLRenderingContext && (probe.getContext("webgl2") || probe.getContext("webgl"))
      );
    } catch {
      webgl = false;
    }
    if (!webgl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

    const evaluate = () => setEnabled(wide.matches && fine.matches && !reduced.matches);
    evaluate();

    reduced.addEventListener("change", evaluate);
    wide.addEventListener("change", evaluate);
    fine.addEventListener("change", evaluate);
    return () => {
      reduced.removeEventListener("change", evaluate);
      wide.removeEventListener("change", evaluate);
      fine.removeEventListener("change", evaluate);
    };
  }, []);

  return enabled;
}
