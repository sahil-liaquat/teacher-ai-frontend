"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Always required — it is what a screen reader announces on open. */
  title: React.ReactNode;
  /** Keep the title for assistive tech but draw your own heading. */
  hideTitle?: boolean;
  description?: React.ReactNode;
  /** False for a modal the user must answer rather than dismiss. */
  dismissible?: boolean;
  showClose?: boolean;
  /** Classes for the sheet itself — width, padding, and nothing else usually. */
  className?: string;
  children: React.ReactNode;
};

/**
 * The dialog primitive. Radix gives the focus trap, Escape, backdrop dismiss,
 * `aria-modal`, the labelled title, the background scroll lock and focus
 * restore to the trigger — all of which the 28 hand-rolled `fixed inset-0`
 * overlays in this codebase did not have.
 *
 * The sheet caps at 90dvh and scrolls inside itself, because several of those
 * overlays were taller than a 360x640 viewport with no way to reach the button
 * at the bottom.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  hideTitle = false,
  description,
  dismissible = true,
  showClose = true,
  className,
  children
}: ModalProps) {
  const block = (event: { preventDefault: () => void }) => {
    if (!dismissible) event.preventDefault();
  };

  // Radix restores focus to a `Dialog.Trigger`, and none of our modals use one
  // — they are opened from context or an effect, so `triggerRef` is null and
  // focus would land on <body>. Capture whatever was focused as the dialog
  // opens, and put focus back there on close.
  const restoreTo = React.useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-teachpad-ink/30 backdrop-blur-sm" />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          aria-modal="true"
          onEscapeKeyDown={block}
          onPointerDownOutside={block}
          onInteractOutside={block}
          onOpenAutoFocus={() => {
            const active = document.activeElement;
            restoreTo.current = active instanceof HTMLElement ? active : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreTo.current?.focus();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-sheet border border-teachpad-cardBorder bg-white p-6 shadow-e3 focus:outline-none",
            className
          )}
        >
          {/* One block, so the sheet's own `gap` sees a header rather than two
              loose elements. Collapses to nothing when the title is hidden. */}
          <div className={cn("flex flex-col gap-1.5", showClose && !hideTitle && "pr-8")}>
            <Dialog.Title className={hideTitle ? "sr-only" : "text-h3 font-bold text-fg"}>
              {title}
            </Dialog.Title>
            {description ? (
              <Dialog.Description className="text-sm text-fg-muted">{description}</Dialog.Description>
            ) : null}
          </div>

          {children}

          {showClose ? (
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-control text-teachpad-muted transition-colors hover:bg-teachpad-tag hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
