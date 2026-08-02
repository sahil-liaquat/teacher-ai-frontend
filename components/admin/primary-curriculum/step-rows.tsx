"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  RESOURCE_CATEGORIES,
  STEP_TYPES,
  createStepDraft,
  moveStep,
  renumberSteps,
  type StepDraft,
} from "@/lib/primary-authoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function titleCase(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Markup over `lib/primary-authoring.ts` — no logic of its own. Every mutation
 * (reorder, add, delete, edit a field) goes through `moveStep`/`renumberSteps`
 * so positions stay contiguous, which is what the server requires.
 */
export function StepRows({
  steps,
  onChange,
  disabled = false,
}: {
  steps: StepDraft[];
  onChange: (steps: StepDraft[]) => void;
  disabled?: boolean;
}) {
  function updateStep(index: number, patch: Partial<StepDraft>) {
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  function removeStep(index: number) {
    onChange(renumberSteps(steps.filter((_, i) => i !== index)));
  }

  function addStep() {
    onChange([...steps, createStepDraft(steps.length)]);
  }

  return (
    <div className="space-y-4">
      {steps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No steps yet. A lesson with no steps can&apos;t be published — add at least one.
        </p>
      ) : null}

      {steps.map((step, index) => (
        <div key={step.id ?? `draft-${index}`} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-teachpad-blue">
              {index + 1}
            </span>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-gray-500">Step type</span>
                <Select
                  value={step.step_type}
                  onChange={(event) => updateStep(index, { step_type: event.target.value as StepDraft["step_type"] })}
                  disabled={disabled}
                >
                  {STEP_TYPES.map((type) => (
                    <option key={type} value={type}>{titleCase(type)}</option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-gray-500">Resource category</span>
                <Select
                  value={step.resource_category ?? ""}
                  onChange={(event) => updateStep(index, { resource_category: event.target.value || null })}
                  disabled={disabled}
                >
                  <option value="">No printable attached</option>
                  {RESOURCE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </label>
            </div>
            <div className="flex shrink-0 flex-col gap-1 pt-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Move up"
                disabled={disabled || index === 0}
                onClick={() => onChange(moveStep(steps, index, index - 1))}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Move down"
                disabled={disabled || index === steps.length - 1}
                onClick={() => onChange(moveStep(steps, index, index + 1))}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Title</span>
              <Input
                value={step.title}
                onChange={(event) => updateStep(index, { title: event.target.value })}
                placeholder="e.g. Warm-up rhyme"
                disabled={disabled}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Duration (minutes)</span>
              <Input
                type="number"
                min={1}
                max={120}
                value={step.duration_minutes}
                onChange={(event) => updateStep(index, { duration_minutes: Number(event.target.value) || 0 })}
                disabled={disabled}
              />
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-gray-500">Instructions (one per line)</span>
            <Textarea
              rows={3}
              value={step.instructions.join("\n")}
              onChange={(event) =>
                updateStep(index, {
                  instructions: event.target.value.split("\n"),
                })
              }
              placeholder={"Greet the class\nSing the good-morning rhyme"}
              disabled={disabled}
            />
          </label>

          {!disabled ? (
            <div className="flex justify-end">
              <Button type="button" size="sm" variant="danger" onClick={() => removeStep(index)}>
                <Trash2 className="h-4 w-4" />
                Remove step
              </Button>
            </div>
          ) : null}
        </div>
      ))}

      {!disabled ? (
        <Button type="button" variant="outline" onClick={addStep}>
          <Plus className="h-4 w-4" />
          Add step
        </Button>
      ) : null}
    </div>
  );
}
