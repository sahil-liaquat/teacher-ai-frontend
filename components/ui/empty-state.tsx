import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  /** One sentence. If a teacher needs two, the screen is doing too much. */
  message: string;
  /** Exactly one way out. An empty state with no action is a dead end. */
  action?: { label: string; href: string };
  className?: string;
};

export function EmptyState({ icon: Icon, message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed border-teachpad-cardBorder bg-surface-sunken p-6 text-center",
        className
      )}
    >
      <Icon aria-hidden="true" className="h-10 w-10 text-teachpad-muted/50" />
      <p className="mt-3 text-sm font-semibold text-fg-muted">{message}</p>
      {action ? (
        <Link href={action.href} className="mt-4">
          <Button size="sm" variant="outline">
            {action.label}
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
