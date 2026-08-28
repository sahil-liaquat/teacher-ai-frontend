/** True only when we actually hold ingested textbooks for this board/class. */
export function hasIngestedContent(entity: { ingested_books?: number }): boolean {
  return (entity.ingested_books ?? 0) > 0;
}

/** Drop hollow rows — e.g. JKBOSE Class 1 exists with zero books. */
export function usableClasses<T extends { ingested_books?: number }>(classes: T[]): T[] {
  return classes.filter(hasIngestedContent);
}
