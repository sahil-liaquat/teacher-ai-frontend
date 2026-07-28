"use client";

import { Check, Globe, Loader2, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/** The four strings the control needs, in the language currently being read. */
export type TranslationSwitcherStrings = {
  /** The word "Language" — labels the row. */
  language: string;
  translating: string;
  sourceEdited: string;
  retranslate: string;
};

type TranslationLanguageSwitcherProps<Language extends string> = {
  /** Every language the tool supports, in display order. */
  languages: readonly Language[];
  /** Label per language, in that language's own script. */
  labels: Record<Language, string>;
  /** Languages that already exist, primary first. */
  availableLanguages: string[];
  activeLanguage: Language;
  /** Language currently being generated, if any. */
  translatingLanguage?: Language | null;
  /** True when the active variant's source has been edited since translating. */
  isActiveStale?: boolean;
  strings: TranslationSwitcherStrings;
  /** Text direction of the language being read, so the row mirrors for Urdu. */
  dir?: "ltr" | "rtl";
  onSelect: (language: Language) => void;
  onTranslate: (language: Language) => void;
};

/**
 * Language tabs for one generated artefact: existing languages switch instantly
 * (a read), missing ones show a "+" that spends a generation to translate.
 *
 * Labels sit in each language's own script — a teacher looking for the Urdu
 * version scans for اردو, not the word "Urdu". The surrounding chrome follows
 * the language being read, so the control is legible to a teacher who does not
 * read English.
 *
 * Shared by lesson plans and worksheets; the tool supplies its own language
 * list, labels and strings.
 */
export function TranslationLanguageSwitcher<Language extends string>({
  languages,
  labels,
  availableLanguages,
  activeLanguage,
  translatingLanguage,
  isActiveStale,
  strings,
  dir = "ltr",
  onSelect,
  onTranslate,
}: TranslationLanguageSwitcherProps<Language>) {
  const available = new Set(availableLanguages);
  const isTranslating = Boolean(translatingLanguage);

  return (
    <div className="no-print flex flex-col gap-2" dir={dir}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-teachpad-muted">
          <Globe className="h-3.5 w-3.5" />
          {strings.language}
        </span>
        {languages.map((language) => {
          const exists = available.has(language);
          const isActive = language === activeLanguage;
          const isPending = translatingLanguage === language;
          const label = labels[language];

          if (exists) {
            return (
              <button
                key={language}
                type="button"
                onClick={() => onSelect(language)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "border-blue-300 bg-gradient-to-r from-teachpad-blue to-blue-600 text-white shadow-sm"
                    : "border-teachpad-cardBorder bg-white text-teachpad-muted hover:border-blue-200 hover:bg-blue-50/50"
                )}
              >
                {isActive ? <Check className="h-3.5 w-3.5" /> : null}
                {label}
              </button>
            );
          }

          return (
            <button
              key={language}
              type="button"
              disabled={isTranslating}
              onClick={() => onTranslate(language)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl border border-dashed px-3.5 text-sm font-semibold transition-all duration-200",
                isPending
                  ? "border-blue-300 bg-blue-50 text-teachpad-blue"
                  : "border-teachpad-cardBorder bg-white text-teachpad-muted hover:border-blue-300 hover:bg-blue-50/50 hover:text-teachpad-blue",
                isTranslating && !isPending && "cursor-not-allowed opacity-50"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {strings.translating}
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  {label}
                </>
              )}
            </button>
          );
        })}
      </div>

      {isActiveStale ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          <span>{strings.sourceEdited}</span>
          <button
            type="button"
            disabled={isTranslating}
            onClick={() => onTranslate(activeLanguage)}
            className="inline-flex items-center gap-1 font-black text-amber-900 underline disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", isTranslating && "animate-spin")} />
            {strings.retranslate}
          </button>
        </div>
      ) : null}
    </div>
  );
}
