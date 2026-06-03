"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const EMPTY_VALUE = "__teacher_ai_empty__";

function toRadixValue(value: string) {
  return value === "" ? EMPTY_VALUE : value;
}

function fromRadixValue(value: string) {
  return value === EMPTY_VALUE ? "" : value;
}

function getOptionLabel(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(getOptionLabel).join("");
  }
  return "";
}

function collectOptions(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<React.OptionHTMLAttributes<HTMLOptionElement>>(child)) {
      return;
    }
    if (child.type !== "option") {
      return;
    }
    const label = getOptionLabel(child.props.children).trim();
    const value = child.props.value === undefined ? label : String(child.props.value);
    options.push({
      value,
      label,
      disabled: child.props.disabled
    });
  });
  return options;
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref) {
    ref.current = value;
  }
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  isLoading?: boolean;
  loadingLabel?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, disabled, isLoading = false, loadingLabel = "Loading...", name, onChange, onBlur, value, defaultValue, ...props }, forwardedRef) => {
    const options = React.useMemo(() => collectOptions(children), [children]);
    const optionValues = React.useMemo(() => options.map((option) => option.value).join("\u0000"), [options]);
    const initialValue = String(value ?? defaultValue ?? options[0]?.value ?? "");
    const [selectedValue, setSelectedValue] = React.useState(initialValue);
    const hiddenSelectRef = React.useRef<HTMLSelectElement | null>(null);

    const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0];

    const setHiddenRef = React.useCallback(
      (node: HTMLSelectElement | null) => {
        hiddenSelectRef.current = node;
        assignRef(forwardedRef, node);
      },
      [forwardedRef]
    );

    React.useEffect(() => {
      const syncFromSelect = () => {
        const nextValue = String(value ?? hiddenSelectRef.current?.value ?? defaultValue ?? options[0]?.value ?? "");
        if (hiddenSelectRef.current && hiddenSelectRef.current.value !== nextValue) {
          hiddenSelectRef.current.value = nextValue;
        }
        if (nextValue !== selectedValue) {
          setSelectedValue(nextValue);
        }
      };
      syncFromSelect();
      const frame = window.requestAnimationFrame(syncFromSelect);
      return () => window.cancelAnimationFrame(frame);
    }, [defaultValue, optionValues, options, selectedValue, value]);

    function handleValueChange(nextRadixValue: string) {
      const nextValue = fromRadixValue(nextRadixValue);
      setSelectedValue(nextValue);
      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = nextValue;
      }
      if (hiddenSelectRef.current && onChange) {
        onChange({
          target: hiddenSelectRef.current,
          currentTarget: hiddenSelectRef.current,
          type: "change"
        } as React.ChangeEvent<HTMLSelectElement>);
      }
    }

    function syncDisplayFromHiddenSelect() {
      const nextValue = hiddenSelectRef.current?.value;
      if (nextValue !== undefined && nextValue !== selectedValue) {
        setSelectedValue(nextValue);
      }
    }

    return (
      <div className={cn("relative block w-full min-w-0 max-w-full self-stretch", className)}>
        <select
          ref={setHiddenRef}
          aria-hidden="true"
          tabIndex={-1}
          name={name}
          defaultValue={selectedValue}
          disabled={disabled || isLoading}
          onChange={onChange}
          onBlur={onBlur}
          className="pointer-events-none absolute h-px w-px opacity-0"
          {...props}
        >
          {children}
        </select>

        <SelectPrimitive.Root
          value={toRadixValue(selectedOption?.value ?? selectedValue)}
          disabled={disabled || isLoading}
          onValueChange={handleValueChange}
          onOpenChange={(open) => {
            if (!open && hiddenSelectRef.current && onBlur) {
              onBlur({
                target: hiddenSelectRef.current,
                currentTarget: hiddenSelectRef.current,
                type: "blur"
              } as React.FocusEvent<HTMLSelectElement>);
            }
          }}
        >
          <SelectPrimitive.Trigger
            onFocus={syncDisplayFromHiddenSelect}
            onPointerDown={syncDisplayFromHiddenSelect}
            className={cn(
              "tat-select-trigger flex h-10 w-full min-w-0 max-w-full items-center justify-between gap-2.5 overflow-hidden rounded-xl border border-teachpad-cardBorder bg-teachpad-input px-3.5 text-left text-base font-semibold text-teachpad-ink shadow-sm outline-none transition-colors duration-200 hover:border-blue-200 focus:border-teachpad-blue focus:bg-white focus:ring-4 focus:ring-blue-100/60 data-[disabled]:cursor-not-allowed data-[disabled]:bg-teachpad-tag data-[disabled]:text-[var(--teachpad-placeholderText)] sm:text-sm [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:overflow-hidden",
              className
            )}
          >
            <SelectPrimitive.Value>
              <span className={isLoading ? "block min-w-0 max-w-full truncate text-teachpad-muted" : selectedOption ? "block min-w-0 max-w-full truncate text-teachpad-ink" : "block min-w-0 max-w-full truncate text-teachpad-muted"}>
                {isLoading ? loadingLabel : selectedOption?.label || "Select an option"}
              </span>
            </SelectPrimitive.Value>
            {isLoading ? (
              <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-teachpad-blue" />
            ) : (
              <SelectPrimitive.Icon asChild>
                <ChevronDown className="h-4 w-4 shrink-0 text-teachpad-muted" />
              </SelectPrimitive.Icon>
            )}
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={8}
              avoidCollisions
              className="z-[100] max-h-[280px] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-teachpad-cardBorder bg-white/95 shadow-[0_20px_50px_-28px_var(--teachpad-shadowCard)] backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
            >
              <SelectPrimitive.Viewport className="max-h-[260px] overflow-y-auto p-1.5">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={toRadixValue(option.value)}
                    disabled={option.disabled}
                    className="group relative flex min-h-9 cursor-pointer select-none items-start justify-between gap-2.5 rounded-lg px-2.5 py-2 text-base font-semibold text-teachpad-ink outline-none transition data-[highlighted]:scale-[1.01] data-[highlighted]:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-teachpad-blue data-[disabled]:pointer-events-none data-[disabled]:opacity-45 sm:text-sm"
                  >
                    <SelectPrimitive.ItemText>
                      <span className="block min-w-0 whitespace-normal break-words leading-5">{option.label}</span>
                    </SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4 text-teachpad-blue" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  }
);
Select.displayName = "Select";
