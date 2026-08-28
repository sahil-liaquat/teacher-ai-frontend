"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CURRENT_USER_QUERY_KEY, getCurrentUser, type ApiUser } from "@/lib/api";
import { shouldRedirectToStart } from "@/lib/first-run";

const REDIRECTED_KEY = "teachpad_start_redirected";

// Once per tab. A teacher who walks back to the dashboard from /start has said
// what they want; bouncing them a second time would rebuild the wall this
// change exists to remove. Picking a board on /start records the preference and
// marks onboarding done, so the redirect stops on its own after that.
let redirectedThisTab = false;

function alreadyRedirected() {
  if (redirectedThisTab) return true;
  try {
    return sessionStorage.getItem(REDIRECTED_KEY) === "1";
  } catch {
    return false;
  }
}

function markRedirected() {
  redirectedThisTab = true;
  try {
    sessionStorage.setItem(REDIRECTED_KEY, "1");
  } catch {
    // Storage blocked: the in-memory guard still holds until a hard reload.
  }
}

/**
 * Sends a teacher who has never onboarded into /start instead of rendering the
 * old wizard over the dashboard. Renders nothing. Only active under
 * `first_run_v2`, and never for admins.
 */
export function StartRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    staleTime: Infinity,
    retry: false
  });

  useEffect(() => {
    if (!shouldRedirectToStart(user)) return;
    if (pathname?.startsWith("/start")) return;
    if (alreadyRedirected()) return;
    markRedirected();
    router.replace("/start");
  }, [user, pathname, router]);

  return null;
}
