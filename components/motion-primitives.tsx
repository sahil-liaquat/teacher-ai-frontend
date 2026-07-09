"use client";

import { type ReactNode, useRef, useState, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  EASE_PREMIUM,
  DURATION_REVEAL,
  staggerContainer,
  staggerItem,
  staggerScaleItem,
  fadeSlideUp,
} from "@/lib/use-motion";

// ─── RevealOnScroll ──────────────────────────────────────────────────
// Wraps children in a fade+slideUp triggered when scrolled into view.

export function RevealOnScroll({
  children,
  className,
  width = "100%",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  width?: string;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION_REVEAL, ease: EASE_PREMIUM, delay },
        },
      }}
      className={className}
      style={{ width }}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerGroup + StaggerItem ──────────────────────────────────────
// Container + children that stagger-reveal on scroll.

export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerFadeItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerScaleItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerScaleItem} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Hero Load Stagger ───────────────────────────────────────────────
// Container + children that stagger-reveal on load.

export function HeroStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? "visible" : "hidden"}
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroStaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Card3DTilt ──────────────────────────────────────────────────────
// 3D cursor-following tilt for cards. Max 6-8° rotation on hover.

export function Card3DTilt({
  children,
  className,
  maxTilt = 7,
  showShadow = true,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  showShadow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(
    "perspective(800px) rotateX(0deg) rotateY(0deg)"
  );
  const [shadow, setShadow] = useState(
    showShadow ? "0 10px 30px rgba(15, 23, 42, 0.08)" : "none"
  );
  const prefersReduced = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReduced) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - y) * maxTilt * 2;
      setTransform(
        `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`
      );
      if (showShadow) {
        setShadow(
          `0 ${14 + Math.abs(rotateX) * 2}px ${30 + Math.abs(rotateX) * 3}px rgba(15, 23, 42, ${(0.08 + Math.abs(rotateX) * 0.012).toFixed(3)})`
        );
      }
    },
    [maxTilt, prefersReduced, showShadow]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform("perspective(800px) rotateX(0deg) rotateY(0deg)");
    setShadow(showShadow ? "0 10px 30px rgba(15, 23, 42, 0.08)" : "none");
  }, [showShadow]);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transform,
        boxShadow: showShadow ? shadow : undefined,
        transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

// ─── ParallaxTilt ────────────────────────────────────────────────────
// Mouse-move parallax tilt with lerp smoothing. Max 3-4° rotation.

export function ParallaxTilt({
  children,
  className,
  maxDeg = 3.5,
}: {
  children: ReactNode;
  className?: string;
  maxDeg?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const animFrame = useRef<number>(0);
  const current = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const prefersReduced = useReducedMotion();

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const animate = useCallback(() => {
    current.current.x = lerp(current.current.x, target.current.x, 0.08);
    current.current.y = lerp(current.current.y, target.current.y, 0.08);
    if (ref.current) {
      ref.current.style.transform = `perspective(1000px) rotateX(${current.current.y.toFixed(3)}deg) rotateY(${current.current.x.toFixed(3)}deg)`;
    }
    animFrame.current = requestAnimationFrame(animate);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReduced) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = ((e.clientX - centerX) / (rect.width / 2)) * maxDeg;
      const y = ((centerY - e.clientY) / (rect.height / 2)) * maxDeg;
      target.current = { x, y };
    },
    [maxDeg, prefersReduced]
  );

  const handleMouseEnter = useCallback(() => {
    if (prefersReduced) return;
    animFrame.current = requestAnimationFrame(animate);
  }, [animate, prefersReduced]);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(animFrame.current);
    target.current = { x: 0, y: 0 };
    // Smooth return
    const returnToZero = () => {
      current.current.x = lerp(current.current.x, 0, 0.1);
      current.current.y = lerp(current.current.y, 0, 0.1);
      if (ref.current) {
        ref.current.style.transform = `perspective(1000px) rotateX(${current.current.y.toFixed(3)}deg) rotateY(${current.current.x.toFixed(3)}deg)`;
      }
      if (Math.abs(current.current.x) > 0.01 || Math.abs(current.current.y) > 0.01) {
        requestAnimationFrame(returnToZero);
      } else {
        if (ref.current) {
          ref.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
        }
      }
    };
    requestAnimationFrame(returnToZero);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ willChange: "transform" }}
    >
      {children}
    </div>
  );
}

// ─── AnimatedCheckmark ───────────────────────────────────────────────
// SVG stroke-draw checkmark icon.

export function AnimatedCheckmark({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ overflow: "visible" }}
    >
      <motion.path
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: EASE_PREMIUM, delay: 0.15 }}
      />
    </motion.svg>
  );
}

// ─── CrossfadeTabs ───────────────────────────────────────────────────
// Tab controls with crossfade content transitions.

export function CrossfadeTabs({
  tabs,
  className,
}: {
  tabs: { label: string; content: ReactNode }[];
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={className}>
      <div className="flex gap-2">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
              i === activeIndex
                ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
            style={{ transitionDuration: "200ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="relative mt-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_PREMIUM }}
          >
            {tabs[activeIndex].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── StrokeLine ──────────────────────────────────────────────────────
// SVG line that draws itself on scroll.

export function StrokeLine({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 1200 8"
      fill="none"
      className={className}
      preserveAspectRatio="none"
    >
      <motion.line
        x1="0"
        y1="4"
        x2="1200"
        y2="4"
        stroke="url(#line-gradient)"
        strokeWidth={2}
        strokeDasharray="8 6"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.2, ease: EASE_PREMIUM }}
      />
      <defs>
        <linearGradient id="line-gradient" x1="0" y1="0" x2="1200" y2="0">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
