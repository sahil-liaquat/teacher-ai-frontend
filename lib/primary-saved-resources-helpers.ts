import { type PrimaryResource } from "./primary-resource-catalog.ts";

export type SavedResourceResolution = {
  resolved: PrimaryResource[];
  unresolvedIds: string[];
};

export function resolveSavedResources(
  savedIds: Set<string> | string[],
  catalogue: PrimaryResource[]
): SavedResourceResolution {
  const resolved: PrimaryResource[] = [];
  const unresolvedIds: string[] = [];
  const ids = Array.isArray(savedIds) ? savedIds : Array.from(savedIds);

  for (const id of ids) {
    const found = catalogue.find((r) => r.id === id);
    if (found) {
      if (!resolved.some((r) => r.id === found.id)) {
        resolved.push(found);
      }
    } else {
      if (!unresolvedIds.includes(id)) {
        unresolvedIds.push(id);
      }
    }
  }

  return { resolved, unresolvedIds };
}
