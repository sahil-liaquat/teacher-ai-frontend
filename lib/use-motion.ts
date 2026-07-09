"use client";

// ─── Shared motion configuration ─────────────────────────────────────
// One easing curve, two duration tiers, used everywhere.

export const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;
export const DURATION_MICRO = 0.2; // 200ms — buttons, links, hovers
export const DURATION_REVEAL = 0.65; // 650ms — section/content reveals

// ─── Framer-motion variant presets ───────────────────────────────────

/** Container that staggers its children on reveal */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      ease: EASE_PREMIUM,
    },
  },
};

/** Fade + slide-up item for use inside a stagger container */
export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_REVEAL, ease: EASE_PREMIUM },
  },
};

/** Fade + scale-in item (for tool cards) */
export const staggerScaleItem = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION_REVEAL, ease: EASE_PREMIUM },
  },
};

/** Simple fade + slide-up for standalone elements */
export const fadeSlideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_REVEAL, ease: EASE_PREMIUM },
  },
};

/** Slide from left */
export const slideFromLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION_REVEAL, ease: EASE_PREMIUM },
  },
};

/** Slide from right */
export const slideFromRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION_REVEAL, ease: EASE_PREMIUM },
  },
};

/** Scale-in for mockup images */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION_REVEAL, ease: EASE_PREMIUM },
  },
};

/** Stagger container for checklist items */
export const checklistContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      ease: EASE_PREMIUM,
    },
  },
};

/** Checklist item: icon scales in, then text fades */
export const checklistItem = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: EASE_PREMIUM },
  },
};
