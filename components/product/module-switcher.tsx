"use client";

import Link from "next/link";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronsUpDown } from "lucide-react";

import { PRODUCT_MODULES, activeModule, type ProductModule } from "@/lib/product-nav";
import { cn } from "@/lib/utils";

/**
 * The module switcher — how School Admin becomes one module of a larger product.
 *
 * ⚠ A SWITCHER, NOT A SECOND SIDEBAR. Seven modules rendered as seven permanent
 * rows would push Academic's own five navigation items below the fold on a
 * laptop, which would change the thing an administrator uses every day in order
 * to advertise six things they use rarely. The collapsed control costs one row.
 *
 * ⚠ Built on the same Radix dropdown as `ActionMenu`, for the same reasons:
 * roving focus, typeahead, Escape, outside-click, and a Portal so no ancestor's
 * `overflow` can clip the panel. See `components/ui/action-menu.tsx`.
 *
 * ⚠ Each module states the QUESTION it answers, not a description of its
 * contents. "What is actually happening?" tells an administrator when to open
 * Insights; "Metrics and dashboards" does not.
 */
export function ModuleSwitcher({ pathname }: { pathname: string }) {
  const current = activeModule(pathname);
  const CurrentIcon = current.icon;

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "mt-6 flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition",
          "hover:border-blue-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
        )}
        aria-label={`Current module: ${current.label}. Switch module`}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
          <CurrentIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Module</span>
          <span className="block truncate text-sm font-semibold text-slate-950">{current.label}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[min(20rem,88vw)] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
        >
          <p className="px-2.5 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            TeachPad School Excellence
          </p>
          {PRODUCT_MODULES.map((module) => (
            <ModuleRow key={module.key} module={module} current={current} />
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ModuleRow({ module, current }: { module: ProductModule; current: ProductModule }) {
  const Icon = module.icon;
  const active = module.key === current.key;
  return (
    <Menu.Item asChild>
      <Link
        href={module.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2 outline-none transition",
          active ? "bg-blue-50" : "focus:bg-slate-50 data-[highlighted]:bg-slate-50",
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg",
            active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={cn("truncate text-sm font-semibold", active ? "text-blue-800" : "text-slate-900")}>
              {module.label}
            </span>
            {/* Says so on the label rather than letting an empty screen imply a bug. */}
            {module.status === "foundation" ? (
              <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Soon
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-xs leading-5 text-slate-500">{module.question}</span>
        </span>
        {active ? <Check className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" /> : null}
      </Link>
    </Menu.Item>
  );
}
