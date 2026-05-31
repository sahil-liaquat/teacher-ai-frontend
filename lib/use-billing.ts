"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi, type BillingMe } from "@/lib/api";

export const BILLING_QUERY_KEY = ["billing-me"] as const;

/**
 * React Query hook wrapping billingMe().
 * staleTime: 2 minutes — plan status doesn't change often, but we want
 * the banner/modal to reflect upgrades/gifts within a short window.
 */
export function useBilling() {
  const queryClient = useQueryClient();

  const query = useQuery<BillingMe>({
    queryKey: BILLING_QUERY_KEY,
    queryFn: () => backendApi.billingMe(),
    staleTime: 2 * 60 * 1000,   // 2 minutes
    gcTime: 5 * 60 * 1000,       // keep cached for 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  });

  function refetch() {
    return queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
  }

  return { ...query, refetch };
}
