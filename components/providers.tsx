"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/toast";

/**
 * The client was previously constructed with no options at all, which left every
 * query on React Query's defaults — staleTime 0 above all. That marks data stale
 * the instant it arrives, so the cache only ever de-duplicated in-flight
 * requests and every mount and every tab return refetched from scratch.
 *
 * A one-minute floor is deliberately conservative: it is long enough to kill the
 * remount storms, short enough that nothing here goes visibly out of date, and
 * it does not weaken invalidateQueries, which still marks and refetches
 * immediately after a mutation. Reference data that genuinely does not move
 * opts into a longer window itself — see CATALOGUE_STALE_TIME in
 * lib/use-catalogue.ts.
 *
 * refetchOnWindowFocus stays on: it is what bounds how long a teacher can sit on
 * a cached list after someone else changes it.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: true,
            // Three retries with backoff means a genuinely failing request takes
            // several seconds to surface its error to the teacher.
            retry: 1
          }
        }
      })
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
