"use client";

import { useCallback, useEffect, useState } from "react";

import { COOLDOWN_MS, cooldownRemaining, startCooldown } from "./resend-cooldown.ts";

export const RESEND_COOLDOWN_SECONDS = COOLDOWN_MS / 1000;

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode / storage disabled — degrade to no cooldown */
  }
};

/** Per-email resend cooldown, shared across the login and signup screens. */
export function useResendCooldown() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const start = useCallback((email: string) => startCooldown(email, Date.now(), write), []);
  const secondsLeft = useCallback((email: string) => {
    if (typeof window === "undefined" || !email) return 0;
    return cooldownRemaining(email, Date.now(), read);
  }, []);

  return { start, secondsLeft };
}
