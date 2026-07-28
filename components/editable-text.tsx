"use client";

import { createElement, type FocusEvent, type KeyboardEvent } from "react";

/** A contentEditable span/p that commits its text on blur. */
export function EditableText({
  as = "span",
  value,
  onCommit,
  className,
  ariaLabel,
  singleLine = false
}: {
  as?: keyof HTMLElementTagNameMap;
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  ariaLabel: string;
  singleLine?: boolean;
}) {
  const editableClassName = [
    "min-w-0 rounded-[6px] outline-none ring-[#1677ff]/20 transition focus:bg-[#f8ffff] focus:ring-2",
    className || ""
  ].join(" ");

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!singleLine || event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
  }

  return createElement(
    as,
    {
      contentEditable: true,
      suppressContentEditableWarning: true,
      role: "textbox",
      "aria-label": ariaLabel,
      className: editableClassName,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const text = event.currentTarget.innerText.replace(/\u00a0/g, " ").trim();
        if (text !== value) onCommit(text);
      },
      onKeyDown: handleKeyDown
    },
    value
  );
}
