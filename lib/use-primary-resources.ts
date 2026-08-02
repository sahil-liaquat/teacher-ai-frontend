import { useMemo } from "react";
import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { backendApi } from "./api";
import { adaptApiResource, type PrimaryResource } from "./primary-resource-adapter";

export type UsePrimaryResourcesFilters = {
  search?: string;
  category?: string;
  subject?: string;
  level?: string;
  theme?: string;
  language?: string;
  isSavedView?: boolean;
  savedIds?: Set<string>;
};

export function usePrimaryResources(filters: UsePrimaryResourcesFilters) {
  // -------------------------------------------------------------------------
  // 1. Saved Resources Resolution (when isSavedView is true)
  // -------------------------------------------------------------------------
  const savedIdsArray = useMemo(() => {
    return filters.isSavedView && filters.savedIds ? Array.from(filters.savedIds) : [];
  }, [filters.isSavedView, filters.savedIds]);

  const savedQueries = useQueries({
    queries: savedIdsArray.map((id) => ({
      queryKey: ["primary-resource", id],
      queryFn: async () => {
        try {
          const res = await backendApi.primaryResource(id);
          return adaptApiResource(res);
        } catch (err) {
          console.warn(`[Saved Resource Resolution] Failed to fetch saved resource ${id}:`, err);
          return null;
        }
      },
      enabled: filters.isSavedView === true && savedIdsArray.length > 0,
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const resolvedSavedResources = useMemo(() => {
    if (!filters.isSavedView) return [];
    return savedQueries
      .map((q) => q.data)
      .filter((item): item is PrimaryResource => item !== null && item !== undefined);
  }, [savedQueries, filters.isSavedView]);

  const isSavedQueriesLoading = useMemo(() => {
    if (!filters.isSavedView) return false;
    return savedQueries.some((q) => q.isLoading);
  }, [savedQueries, filters.isSavedView]);

  const isSavedQueriesError = useMemo(() => {
    if (!filters.isSavedView) return false;
    // Don't fail the whole view if one resource 404s, but if all queries fail it might be an error
    return savedQueries.length > 0 && savedQueries.every((q) => q.isError);
  }, [savedQueries, filters.isSavedView]);

  // -------------------------------------------------------------------------
  // 2. Main paginated query (when isSavedView is false)
  // -------------------------------------------------------------------------
  const backendInfiniteQuery = useInfiniteQuery({
    queryKey: ["primary-resources-list", { ...filters, isSavedView: false, savedIds: undefined }],
    queryFn: async ({ pageParam }) => {
      return await backendApi.primaryResources({
        search: filters.search,
        category: filters.category,
        subject: filters.subject,
        level: filters.level,
        theme: filters.theme,
        language: filters.language,
        page: pageParam,
        page_size: 24,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.has_more ? allPages.length + 1 : undefined;
    },
    enabled: !filters.isSavedView,
    staleTime: 30_000,
  });

  const backendResources = useMemo(() => {
    if (!backendInfiniteQuery.data) return [];
    return backendInfiniteQuery.data.pages.flatMap((page) =>
      page.items.map((item) => adaptApiResource(item))
    );
  }, [backendInfiniteQuery.data]);

  if (filters.isSavedView) {
    const unresolvedIds = savedIdsArray.filter((id, index) => {
      const queryResult = savedQueries[index];
      const isLoaded = resolvedSavedResources.some((r) => r.id === id);
      const isLoading = queryResult ? queryResult.isLoading : false;
      return !isLoaded && !isLoading;
    });

    return {
      resources: resolvedSavedResources,
      total: resolvedSavedResources.length,
      isLoading: isSavedQueriesLoading,
      isError: isSavedQueriesError,
      hasMore: false,
      fetchNextPage: () => {},
      refetch: () => {
        savedQueries.forEach((q) => q.refetch());
      },
      unresolvedIds,
    };
  }

  return {
    resources: backendResources,
    total: backendInfiniteQuery.data?.pages[0]?.total ?? 0,
    isLoading: backendInfiniteQuery.isLoading,
    isError: backendInfiniteQuery.isError,
    hasMore: !!backendInfiniteQuery.hasNextPage,
    fetchNextPage: () => backendInfiniteQuery.fetchNextPage(),
    refetch: () => backendInfiniteQuery.refetch(),
    unresolvedIds: [] as string[],
  };
}
