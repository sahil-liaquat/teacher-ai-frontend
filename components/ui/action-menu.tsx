"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one action menu for School Admin.
 *
 * Replaces two broken patterns that were spread across the surface:
 *
 * 1. `<details>/<summary>` used as a menu (curriculum week actions, resource
 *    cards, theme cards). No menu semantics, no Escape, no outside-click close,
 *    and several could sit open at once.
 * 2. A hand-rolled `useState` + `mousedown` listener menu (the teacher roster
 *    row). Semantically correct, but clipped: its card ancestors set
 *    `overflow-hidden`, and the roster's `overflow-x-auto` forces `overflow-y`
 *    to compute to `auto` rather than `visible`, so the panel was cut off
 *    instead of overlaying — worst on the last row of the table.
 *
 * Both are solved at the primitive rather than per call site. Radix supplies the
 * roving focus, typeahead, Escape and outside-click behaviour, and `Portal`
 * renders the panel at the document root so no ancestor's `overflow` can clip
 * it however the card around it is styled.
 */
export function ActionMenu({
  label,
  children,
  trigger,
  align = "end",
}: {
  /** Accessible name — always specific, e.g. "Actions for Nursery A". */
  label: string;
  children: ReactNode;
  trigger?: ReactNode;
  align?: "start" | "end";
}) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label={label}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 data-[state=open]:bg-slate-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className="z-50 min-w-[11rem] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
        >
          {children}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function ActionMenuItem({
  children,
  onSelect,
  destructive = false,
  disabled = false,
}: {
  children: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Menu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold outline-none transition",
        destructive
          ? "text-rose-600 data-[highlighted]:bg-rose-50"
          : "text-slate-700 data-[highlighted]:bg-slate-50",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      )}
    >
      {children}
    </Menu.Item>
  );
}
