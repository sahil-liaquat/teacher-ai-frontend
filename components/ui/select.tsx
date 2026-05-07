"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
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

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, disabled, name, onChange, onBlur, value, defaultValue, ...props }, forwardedRef) => {
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
      <div className={cn("relative min-w-0 w-full", className)}>
        <select
          ref={setHiddenRef}
          aria-hidden="true"
          tabIndex={-1}
          name={name}
          defaultValue={selectedValue}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          className="pointer-events-none absolute h-px w-px opacity-0"
          {...props}
        >
          {children}
        </select>

        <SelectPrimitive.Root
          value={toRadixValue(selectedOption?.value ?? selectedValue)}
          disabled={disabled}
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
              "tat-select-trigger flex h-11 w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-[14px] border border-[#e5e1f1] bg-white px-4 text-left text-sm font-semibold text-[#101039] shadow-[0_8px_20px_rgba(39,30,91,0.04)] outline-none transition duration-200 hover:border-[#d8ccf4] focus:border-[#b998f6] focus:ring-4 focus:ring-[#8d57f6]/10 data-[disabled]:cursor-not-allowed data-[disabled]:bg-[#f8f6fb] data-[disabled]:text-[#a19bb2] 2xl:h-12 [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:overflow-hidden",
              className
            )}
          >
            <SelectPrimitive.Value>
              <span className={selectedOption ? "block min-w-0 max-w-full truncate text-[#071343]" : "block min-w-0 max-w-full truncate text-[#6d7791]"}>
                {selectedOption?.label || "Select an option"}
              </span>
            </SelectPrimitive.Value>
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 shrink-0 text-[#8a4df7]" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={8}
              avoidCollisions
              className="z-[100] max-h-[320px] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#dfe6f5] bg-white shadow-[0_24px_70px_-30px_rgba(29,43,77,0.55)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
            >
              <SelectPrimitive.Viewport className="max-h-[300px] overflow-y-auto p-2">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={toRadixValue(option.value)}
                    disabled={option.disabled}
                    className="group relative flex min-h-11 cursor-pointer select-none items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#071343] outline-none transition data-[highlighted]:scale-[1.01] data-[highlighted]:bg-[#f5f1ff] data-[state=checked]:bg-[#f1edff] data-[state=checked]:text-[#5b2de2] data-[disabled]:pointer-events-none data-[disabled]:opacity-45"
                  >
                    <SelectPrimitive.ItemText>
                      <span className="block min-w-0 whitespace-normal break-words leading-5">{option.label}</span>
                    </SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4 text-[#6d38f2]" />
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
