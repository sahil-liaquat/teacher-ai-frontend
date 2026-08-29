"use client";

import * as React from "react";
import { fieldAria } from "@/lib/field-aria";
import { cn } from "@/lib/utils";

/** The subset of a control's props `Field` fills in for you. */
type ControlProps = {
  id?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-required"?: boolean;
};

type FieldProps = {
  label: React.ReactNode;
  /** Static guidance, rendered under the control. */
  helper?: React.ReactNode;
  /** Validation message. Its line is reserved whether or not this is set. */
  error?: React.ReactNode;
  required?: boolean;
  /** Only needed when the control's id is fixed by the caller. */
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * One field anatomy: label → control → helper → error.
 *
 * The control's `id`, `aria-invalid` and `aria-describedby` are wired from the
 * label and messages, so a screen reader hears the same field a sighted user
 * sees. The error line is always in the layout — it is empty until it isn't —
 * so validation never pushes the rest of the form down the page.
 */
export function Field({
  label,
  helper,
  error,
  required = false,
  htmlFor,
  className,
  children
}: FieldProps) {
  const fallbackId = React.useId();
  const control = React.isValidElement<ControlProps>(children) ? children : null;
  const { controlId, helperId, errorId, describedBy, invalid, required: isRequired } = fieldAria({
    htmlFor,
    childId: control?.props.id,
    fallbackId,
    hasHelper: Boolean(helper),
    hasError: Boolean(error),
    required
  });

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={controlId} className="text-sm font-semibold text-fg">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-rose-600">
            *
          </span>
        ) : null}
      </label>

      {control
        ? React.cloneElement(control, {
            id: controlId,
            "aria-invalid": invalid ?? control.props["aria-invalid"],
            "aria-describedby": describedBy ?? control.props["aria-describedby"],
            "aria-required": isRequired ?? control.props["aria-required"]
          })
        : children}

      {helper ? (
        <p id={helperId} className="text-micro text-fg-muted">
          {helper}
        </p>
      ) : null}

      <p id={errorId} role="alert" className="min-h-5 text-micro font-semibold text-rose-600">
        {error}
      </p>
    </div>
  );
}
