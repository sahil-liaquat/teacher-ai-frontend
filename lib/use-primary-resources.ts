import { useMemo } from "react";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { backendApi } from "./api";
import { adaptApiResource } from "./primary-resource-adapter";
import { PRIMARY_RESOURCES, type PrimaryResource } from "./primary-resource-catalog";
import { themeContent } from "./primary-theme-content";

export const USE_BACKEND_CATALOGUE = process.env.NEXT_PUBLIC_USE_BACKEND_CATALOGUE === "true";

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
  const useBackend = USE_BACKEND_CATALOGUE;

  // -------------------------------------------------------------------------
  // 1. Saved Resources Resolution (when isSavedView is true and backend is ON)
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
      enabled: useBackend && filters.isSavedView === true && savedIdsArray.length > 0,
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const resolvedSavedResources = useMemo(() => {
    if (!useBackend || !filters.isSavedView) return [];
    return savedQueries
      .map((q) => q.data)
      .filter((item): item is PrimaryResource => item !== null && item !== undefined);
  }, [savedQueries, useBackend, filters.isSavedView]);

  const isSavedQueriesLoading = useMemo(() => {
    if (!useBackend || !filters.isSavedView) return false;
    return savedQueries.some((q) => q.isLoading);
  }, [savedQueries, useBackend, filters.isSavedView]);

  const isSavedQueriesError = useMemo(() => {
    if (!useBackend || !filters.isSavedView) return false;
    // Don't fail the whole view if one resource 404s, but if all queries fail it might be an error
    return savedQueries.length > 0 && savedQueries.every((q) => q.isError);
  }, [savedQueries, useBackend, filters.isSavedView]);

  // -------------------------------------------------------------------------
  // 2. Main paginated query (when isSavedView is false and backend is ON)
  // -------------------------------------------------------------------------
  const backendInfiniteQuery = useInfiniteQuery({
    queryKey: ["primary-resources-list", { ...filters, isSavedView: false, savedIds: undefined }],
    queryFn: async ({ pageParam }) => {
      try {
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
      } catch (err) {
        console.error("[Resource Catalogue] API failed, check NEXT_PUBLIC_USE_BACKEND_CATALOGUE and backend health:", err);
        throw err;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    enabled: useBackend && !filters.isSavedView,
    staleTime: 30_000,
  });

  // -------------------------------------------------------------------------
  // 3. Unify responses for Backend vs Fallback
  // -------------------------------------------------------------------------
  if (useBackend) {
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
    } else {
      const resources = useMemo(() => {
        if (!backendInfiniteQuery.data) return [];
        return backendInfiniteQuery.data.pages.flatMap((page) =>
          page.items.map((item) => adaptApiResource(item))
        );
      }, [backendInfiniteQuery.data]);

      const total = backendInfiniteQuery.data?.pages[0]?.total ?? 0;

      return {
        resources,
        total,
        isLoading: backendInfiniteQuery.isLoading,
        isError: backendInfiniteQuery.isError,
        hasMore: !!backendInfiniteQuery.hasNextPage,
        fetchNextPage: () => backendInfiniteQuery.fetchNextPage(),
        refetch: () => backendInfiniteQuery.refetch(),
        unresolvedIds: [] as string[],
      };
    }
  }

  // Fallback (use local hardcoded PRIMARY_RESOURCES array)
  // Standard local resolved saved resources
  const localResolvedSaved = useMemo(() => {
    if (!filters.isSavedView || !filters.savedIds) return { resolved: [], unresolvedIds: [] };
    const resolved: PrimaryResource[] = [];
    const unresolvedIds: string[] = [];
    filters.savedIds.forEach((id) => {
      const found = PRIMARY_RESOURCES.find((r) => r.id === id);
      if (found) {
        if (!resolved.some((r) => r.id === found.id)) resolved.push(found);
      } else {
        if (!unresolvedIds.includes(id)) unresolvedIds.push(id);
      }
    });
    return { resolved, unresolvedIds };
  }, [filters.isSavedView, filters.savedIds]);

  const catalogue = filters.isSavedView ? localResolvedSaved.resolved : PRIMARY_RESOURCES;

  // Apply frontend filters
  const content = useMemo(() => {
    return themeContent(filters.theme, filters.subject || "");
  }, [filters.theme, filters.subject]);

  const visible = useMemo(() => {
    return catalogue.filter((resource) => {
      const text = `${resource.title} ${resource.category} ${resource.keywords.join(" ")} ${resource.skills.join(" ")}`.toLowerCase();
      if (filters.category && filters.category !== "All Resources" && resource.category !== filters.category) return false;
      if (filters.search) {
        const clean = filters.search.trim().toLowerCase();
        if (clean && !text.includes(clean)) return false;
      }
      if (filters.subject && !resource.subjects.includes(filters.subject)) return false;
      if (filters.theme) {
        const themed = resource.themes.includes(filters.theme);
        if (!themed && !content.keywords.some((keyword) => text.includes(keyword.toLowerCase()))) return false;
      }
      if (filters.level && resource.levels.length > 0 && !resource.levels.includes(filters.level)) return false;
      if (filters.language && resource.languages.length > 0 && !resource.languages.includes(filters.language)) return false;
      return true;
    });
  }, [catalogue, filters.category, filters.search, filters.subject, filters.theme, content]);

  return {
    resources: visible,
    total: visible.length,
    isLoading: false,
    isError: false,
    hasMore: false,
    fetchNextPage: () => {},
    refetch: () => {},
    unresolvedIds: filters.isSavedView ? localResolvedSaved.unresolvedIds : [],
  };
}
