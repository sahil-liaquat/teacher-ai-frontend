"use client";

import { useEffect, useState } from "react";

// Supabase GoTrue accepts one auth email per address per 60 seconds.
export const RESEND_COOLDOWN_SECONDS = 60;

export function useResendCooldown(durationSeconds = RESEND_COOLDOWN_SECONDS) {
  const [expiries, setExpiries] = useState<Record<string, number>>({});
  const [, setTick] = useState(0);

  const hasActive = Object.values(expiries).some((expiry) => expiry > Date.now());

  useEffect(() => {
    if (!hasActive) return;
    const timer = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(timer);
  }, [hasActive]);

  function start(key = "default") {
    setExpiries((current) => ({ ...current, [key]: Date.now() + durationSeconds * 1000 }));
  }

  function secondsLeft(key = "default") {
    const expiry = expiries[key];
    if (!expiry) return 0;
    return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
  }

  return { start, secondsLeft };
}
