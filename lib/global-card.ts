/**
 * One-at-a-time claim for the cards the dashboard shell mounts globally: the
 * post-artifact phone ask and the first-use feedback prompt. Both fire off the
 * same generation event, and two cards stacked on one screen is how a nudge
 * becomes a wall.
 *
 * A module-level claim rather than shared React state: both components are
 * mounted once, in the same shell, in one JS context, and neither needs to
 * re-render when the other opens — each only asks "is anything showing?" at the
 * instant it wants to open. That also keeps this unit-testable.
 */
export type GlobalCard = "phone-ask" | "feedback";

let held: GlobalCard | null = null;

/** True if `card` now holds the slot; false if a different card holds it. */
export function claimGlobalCard(card: GlobalCard): boolean {
  if (held !== null && held !== card) return false;
  held = card;
  return true;
}

export function releaseGlobalCard(card: GlobalCard): void {
  if (held === card) held = null;
}

export function activeGlobalCard(): GlobalCard | null {
  return held;
}
