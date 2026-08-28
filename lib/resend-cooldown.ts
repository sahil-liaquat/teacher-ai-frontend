/** GoTrue accepts one auth email per address per 60 seconds. */
export const COOLDOWN_MS = 60_000;

export type StorageRead = (key: string) => string | null;
export type StorageWrite = (key: string, value: string) => void;

function keyFor(email: string): string {
  return `teachpad_resend:${email.trim().toLowerCase()}`;
}

/** Seconds still to wait before another send to *email* is allowed. */
export function cooldownRemaining(email: string, now: number, read: StorageRead): number {
  const raw = read(keyFor(email));
  if (!raw) return 0;
  const startedAt = Number(raw);
  if (!Number.isFinite(startedAt)) return 0;
  const remaining = startedAt + COOLDOWN_MS - now;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export function startCooldown(email: string, now: number, write: StorageWrite): void {
  write(keyFor(email), String(now));
}
