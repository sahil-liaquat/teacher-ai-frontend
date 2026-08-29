/**
 * The wiring behind `<Field>`: which id the label points at, and which
 * messages the control announces. Kept separate from the component because it
 * is the part with branches, and the part a screen reader depends on.
 */

export type FieldAriaInput = {
  /** Explicit id from the caller. Wins over everything. */
  htmlFor?: string;
  /** An id the child control already carries. */
  childId?: string;
  /** `useId()` output — used only when nothing else supplies an id. */
  fallbackId: string;
  hasHelper: boolean;
  hasError: boolean;
  required?: boolean;
};

export type FieldAria = {
  controlId: string;
  helperId: string;
  errorId: string;
  /** Space-separated ids, or undefined when there is nothing to describe. */
  describedBy: string | undefined;
  invalid: true | undefined;
  required: true | undefined;
};

export function fieldAria({
  htmlFor,
  childId,
  fallbackId,
  hasHelper,
  hasError,
  required = false
}: FieldAriaInput): FieldAria {
  const controlId = htmlFor || childId || fallbackId;
  const helperId = `${controlId}-helper`;
  const errorId = `${controlId}-error`;

  const described = [hasHelper ? helperId : null, hasError ? errorId : null].filter(Boolean);

  return {
    controlId,
    helperId,
    errorId,
    describedBy: described.length > 0 ? described.join(" ") : undefined,
    invalid: hasError || undefined,
    required: required || undefined
  };
}
