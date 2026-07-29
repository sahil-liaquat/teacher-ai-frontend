"use client";

import { EditableText } from "@/components/editable-text";
import { isPaired, type LocalizedText } from "@/lib/localized-text";
import { toLines, type WorksheetLanguage } from "@/lib/worksheet-localization";
import { cn } from "@/lib/utils";

/**
 * One worksheet field, rendered as one editable line or two.
 *
 * The branch between single-language and bilingual lives here and nowhere else,
 * so `WorksheetOutput` keeps saying "render this field". A single-language
 * worksheet renders exactly one `EditableText`, identical to the behaviour
 * before bilingual existed.
 *
 * The two languages never share a text node, which is what makes a pairing
 * impossible to corrupt by editing and lets each line carry its own `dir` —
 * necessary because English + Urdu mixes LTR and RTL.
 */
export function BilingualText({
  value,
  onCommit,
  languages,
  as = "span",
  className,
  secondaryClassName,
  ariaLabel,
  singleLine = false
}: {
  value: LocalizedText | unknown;
  onCommit: (next: LocalizedText) => void;
  languages: { primary: WorksheetLanguage; secondary?: WorksheetLanguage };
  as?: keyof HTMLElementTagNameMap;
  className?: string;
  secondaryClassName?: string;
  /** Required — EditableText requires it, and each line gets its own suffix. */
  ariaLabel: string;
  singleLine?: boolean;
}) {
  const lines = toLines(value, languages);

  if (typeof value === "object" && value !== null && !isPaired(value)) {
    // An object that isn't a well-formed {primary, secondary} pair silently
    // renders as an empty line (primaryText's "" fallback). This should never
    // happen since compose_bilingual only ever produces plain strings or
    // complete pairs — this warning exists to catch a violation of that.
    // eslint-disable-next-line no-console
    console.warn("BilingualText: malformed pair-like value", { ariaLabel, value });
  }

  if (!isPaired(value)) {
    return (
      <EditableText
        as={as}
        value={lines[0].text}
        onCommit={(next: string) => onCommit(next)}
        className={className}
        ariaLabel={ariaLabel}
        singleLine={singleLine}
      />
    );
  }

  return (
    <span className="flex flex-col gap-0.5">
      {lines.map((line, index) => (
        <span key={line.language} dir={line.dir} lang={WORKSHEET_LANG_TAGS[line.language]}>
          <EditableText
            as={as}
            value={line.text}
            onCommit={(next: string) =>
              onCommit(index === 0 ? { ...value, primary: next } : { ...value, secondary: next })
            }
            className={cn(className, index === 1 && secondaryClassName)}
            ariaLabel={`${ariaLabel} (${line.language})`}
            singleLine={singleLine}
          />
        </span>
      ))}
    </span>
  );
}

const WORKSHEET_LANG_TAGS: Record<WorksheetLanguage, string> = {
  English: "en",
  Hindi: "hi",
  Urdu: "ur"
};
