import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi, type SavedPrimaryResource } from "@/lib/api";

export const SAVED_RESOURCES_QUERY_KEY = ["primary-saved-resources"];

export function useSavedResourceIds(): {
  ids: Set<string>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const query = useQuery({
    queryKey: SAVED_RESOURCES_QUERY_KEY,
    queryFn: () => backendApi.savedPrimaryResources(),
    staleTime: 15_000,
    retry: 1,
  });
  const ids = useMemo(() => new Set((query.data ?? []).map((record) => record.resourceId)), [query.data]);
  return {
    ids,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}

export function useToggleSavePrimaryResource() {
  const queryClient = useQueryClient();
  const applyOptimistic = (resourceId: string, saved: boolean) => {
    queryClient.setQueryData<SavedPrimaryResource[]>(SAVED_RESOURCES_QUERY_KEY, (current = []) => {
      if (saved) {
        if (current.some((record) => record.resourceId === resourceId)) return current;
        return [
          ...current,
          { id: `optimistic-${resourceId}`, userId: "", resourceId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];
      }
      return current.filter((record) => record.resourceId !== resourceId);
    });
  };
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: SAVED_RESOURCES_QUERY_KEY });

  const save = useMutation({
    mutationFn: (resourceId: string) => backendApi.savePrimaryResource(resourceId),
    onMutate: async (resourceId) => {
      await queryClient.cancelQueries({ queryKey: SAVED_RESOURCES_QUERY_KEY });
      const previous = queryClient.getQueryData<SavedPrimaryResource[]>(SAVED_RESOURCES_QUERY_KEY);
      applyOptimistic(resourceId, true);
      return { previous };
    },
    onError: (_error, resourceId, context) => {
      applyOptimistic(resourceId, false);
      if (context?.previous) queryClient.setQueryData(SAVED_RESOURCES_QUERY_KEY, context.previous);
    },
    onSettled: invalidate,
  });

  const unsave = useMutation({
    mutationFn: (resourceId: string) => backendApi.unsavePrimaryResource(resourceId),
    onMutate: async (resourceId) => {
      await queryClient.cancelQueries({ queryKey: SAVED_RESOURCES_QUERY_KEY });
      const previous = queryClient.getQueryData<SavedPrimaryResource[]>(SAVED_RESOURCES_QUERY_KEY);
      applyOptimistic(resourceId, false);
      return { previous };
    },
    onError: (_error, resourceId, context) => {
      applyOptimistic(resourceId, true);
      if (context?.previous) queryClient.setQueryData(SAVED_RESOURCES_QUERY_KEY, context.previous);
    },
    onSettled: invalidate,
  });

  return { save, unsave };
}

export { resolveSavedResources } from "./primary-saved-resources-helpers.ts";
export type { SavedResourceResolution } from "./primary-saved-resources-helpers.ts";
