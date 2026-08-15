import {
  isPaired,
  pairingName,
  parsePairing,
  primaryText,
  type LocalizedText,
} from "./localized-text.ts";

export type WorksheetLanguage = "English" | "Hindi" | "Urdu";

export type WorksheetLocale = {
  language: WorksheetLanguage;
  localeCode: string;
  dir: "ltr" | "rtl";
  worksheet: string;
  answerKey: string;
  markingScheme: string;
  worksheetOutput: string;
  generatedWorksheet: string;
  language_: string;
  translating: string;
  sourceEdited: string;
  retranslate: string;
  refresh: string;
  backToInputs: string;
  back: string;
  copy: string;
  share: string;
  save: string;
  saved: string;
  gradePrefix: string;
  classDefault: string;
  subject: string;
  chapter: string;
  board: string;
  textbook: string;
  name: string;
  date: string;
  instructions: string;
  defaultInstructions: string;
  section: string;
  part: string;
  marks: string;
  columnA: string;
  columnB: string;
  source: string;
  generatedOn: string;
  notSpecified: string;
  questionTypes: {
    multipleChoice: string;
    trueFalse: string;
    fillBlanks: string;
    oneWord: string;
    shortAnswer: string;
    longAnswer: string;
    matchFollowing: string;
    applicationBased: string;
    assertionReason: string;
  };
};

export const WORKSHEET_LOCALES: Record<WorksheetLanguage, WorksheetLocale> = {
  English: {
    language: "English",
    localeCode: "en-IN",
    dir: "ltr",
    worksheet: "Worksheet",
    answerKey: "Answer Key",
    markingScheme: "Marking Scheme",
    worksheetOutput: "Worksheet Output",
    generatedWorksheet: "Generated Worksheet",
    language_: "Language",
    translating: "Translating…",
    sourceEdited: "The original was edited after this translation.",
    retranslate: "Re-translate",
    refresh: "Refresh",
    backToInputs: "Back to Inputs",
    back: "Back",
    copy: "Copy",
    share: "Share",
    save: "Save",
    saved: "Saved",
    gradePrefix: "Grade",
    classDefault: "Class",
    subject: "Subject",
    chapter: "Chapter",
    board: "Board",
    textbook: "Textbook",
    name: "Name",
    date: "Date",
    instructions: "Instructions",
    defaultInstructions: "Read each question carefully and answer in the space provided. For MCQs, choose the correct option. Answer all questions.",
    section: "Section",
    part: "Part",
    marks: "marks",
    columnA: "Column A",
    columnB: "Column B",
    source: "Source",
    generatedOn: "Generated on",
    notSpecified: "Not specified",
    questionTypes: {
      multipleChoice: "Multiple Choice Questions",
      trueFalse: "True or False",
      fillBlanks: "Fill in the Blanks",
      oneWord: "One Word Answer",
      shortAnswer: "Short Answer Questions",
      longAnswer: "Long Answer Questions",
      matchFollowing: "Match the Following",
      applicationBased: "Application Based Questions",
      assertionReason: "Assertion–Reason Questions"
    }
  },
  Hindi: {
    language: "Hindi",
    localeCode: "hi-IN",
    dir: "ltr",
    worksheet: "कार्यपत्रक",
    answerKey: "उत्तर कुंजी",
    markingScheme: "अंकन योजना",
    worksheetOutput: "कार्यपत्रक परिणाम",
    generatedWorksheet: "तैयार कार्यपत्रक",
    language_: "भाषा",
    translating: "अनुवाद हो रहा है…",
    sourceEdited: "इस अनुवाद के बाद मूल कार्यपत्रक बदला गया है।",
    retranslate: "फिर से अनुवाद करें",
    refresh: "ताज़ा करें",
    backToInputs: "इनपुट पर वापस",
    back: "वापस",
    copy: "कॉपी करें",
    share: "साझा करें",
    save: "सहेजें",
    saved: "सहेजा गया",
    gradePrefix: "कक्षा",
    classDefault: "कक्षा",
    subject: "विषय",
    chapter: "अध्याय",
    board: "बोर्ड",
    textbook: "पाठ्यपुस्तक",
    name: "नाम",
    date: "दिनांक",
    instructions: "निर्देश",
    defaultInstructions: "प्रत्येक प्रश्न को ध्यान से पढ़ें और दिए गए स्थान में उत्तर दें। बहुविकल्पीय प्रश्नों में सही विकल्प चुनें। सभी प्रश्नों के उत्तर दें।",
    section: "खंड",
    part: "भाग",
    marks: "अंक",
    columnA: "स्तंभ अ",
    columnB: "स्तंभ ब",
    source: "स्रोत",
    generatedOn: "तैयार किया गया",
    notSpecified: "निर्दिष्ट नहीं",
    questionTypes: {
      multipleChoice: "बहुविकल्पीय प्रश्न",
      trueFalse: "सही या गलत",
      fillBlanks: "रिक्त स्थान भरें",
      oneWord: "एक शब्द में उत्तर",
      shortAnswer: "लघु उत्तरीय प्रश्न",
      longAnswer: "दीर्घ उत्तरीय प्रश्न",
      matchFollowing: "निम्नलिखित का मिलान करें",
      applicationBased: "अनुप्रयोग आधारित प्रश्न",
      assertionReason: "कथन–कारण प्रश्न"
    }
  },
  Urdu: {
    language: "Urdu",
    localeCode: "ur-PK",
    dir: "rtl",
    worksheet: "ورک شیٹ",
    answerKey: "جوابی کلید",
    markingScheme: "نمبر دینے کا خاکہ",
    worksheetOutput: "ورک شیٹ کا نتیجہ",
    generatedWorksheet: "تیار شدہ ورک شیٹ",
    language_: "زبان",
    translating: "ترجمہ ہو رہا ہے…",
    sourceEdited: "اس ترجمے کے بعد اصل ورک شیٹ تبدیل ہو چکی ہے۔",
    retranslate: "دوبارہ ترجمہ کریں",
    refresh: "تازہ کریں",
    backToInputs: "معلومات پر واپس",
    back: "واپس",
    copy: "نقل کریں",
    share: "شیئر کریں",
    save: "محفوظ کریں",
    saved: "محفوظ شدہ",
    gradePrefix: "جماعت",
    classDefault: "جماعت",
    subject: "مضمون",
    chapter: "باب",
    board: "بورڈ",
    textbook: "درسی کتاب",
    name: "نام",
    date: "تاریخ",
    instructions: "ہدایات",
    defaultInstructions: "ہر سوال کو غور سے پڑھیں اور دی گئی جگہ میں جواب دیں۔ کثیر الانتخابی سوالات میں درست انتخاب چنیں۔ تمام سوالات کے جواب دیں۔",
    section: "حصہ",
    part: "حصہ",
    marks: "نمبر",
    columnA: "کالم الف",
    columnB: "کالم ب",
    source: "ماخذ",
    generatedOn: "تیاری کی تاریخ",
    notSpecified: "درج نہیں",
    questionTypes: {
      multipleChoice: "کثیر الانتخابی سوالات",
      trueFalse: "صحیح یا غلط",
      fillBlanks: "خالی جگہ پُر کریں",
      oneWord: "ایک لفظ میں جواب",
      shortAnswer: "مختصر جوابی سوالات",
      longAnswer: "تفصیلی جوابی سوالات",
      matchFollowing: "درج ذیل کو ملائیں",
      applicationBased: "اطلاقی سوالات",
      assertionReason: "دعویٰ اور وجہ کے سوالات"
    }
  }
};

export const WORKSHEET_LANGUAGES: WorksheetLanguage[] = ["English", "Hindi", "Urdu"];

/** Each language labelled in its own script — a teacher scans for اردو, not "Urdu". */
export const WORKSHEET_LANGUAGE_LABELS: Record<WorksheetLanguage, string> = {
  English: "English",
  Hindi: "हिन्दी",
  Urdu: "اردو"
};

export function isWorksheetLanguage(value: unknown): value is WorksheetLanguage {
  return WORKSHEET_LANGUAGES.includes(value as WorksheetLanguage);
}

/** The shared TranslationLanguageSwitcher's strings, in the language being read. */
export function worksheetSwitcherStrings(language?: unknown) {
  const locale = isWorksheetLanguage(language) ? WORKSHEET_LOCALES[language] : WORKSHEET_LOCALES.English;
  return {
    language: locale.language_,
    translating: locale.translating,
    sourceEdited: locale.sourceEdited,
    retranslate: locale.retranslate,
    refresh: locale.refresh
  };
}

/**
 * Whether the built-in PDF writer can render this worksheet.
 *
 * `lib/worksheet-export.ts` builds PDFs with Helvetica + WinAnsiEncoding and
 * strips every non-ASCII character, so Devanagari and Nastaliq come out blank.
 * Embedding a font would not be enough either — both scripts need complex-script
 * shaping (conjuncts, ligatures) that a glyph-per-codepoint writer cannot do.
 * Non-Latin worksheets go through the browser's print pipeline instead.
 */
export function canUseBuiltInWorksheetPdf(locale: WorksheetLocale, language?: unknown): boolean {
  // A pairing always contains a non-Latin half even when its primary is English.
  if (parsePairing(language)) return false;
  return locale.language === "English";
}

function namedLanguage(value: unknown): WorksheetLanguage | null {
  // Pairings first: "English + Hindi" contains "hindi", so the single-language
  // patterns below would otherwise claim it and wrap the page in Hindi chrome.
  const pairing = parsePairing(value);
  if (pairing) return pairing.primary as WorksheetLanguage;

  const normalized = String(value ?? "").trim().toLowerCase();
  if (/hindi|हिन्दी|हिंदी/.test(normalized)) return "Hindi";
  if (/urdu|اُردو|اردو/.test(normalized)) return "Urdu";
  if (/english|अंग्रेजी|انگریزی/.test(normalized)) return "English";
  return null;
}

function detectWorksheetLanguage(output: any): WorksheetLanguage {
  const metadata = output?.metadata || {};
  const explicit = [metadata.language, output?.language, metadata.subject]
    .map(namedLanguage)
    .find(Boolean);
  if (explicit) return explicit;

  const sample = JSON.stringify({
    title: output?.title,
    instructions: output?.instructions,
    sections: output?.student_worksheet?.sections,
    answerKey: output?.answer_key
  });
  if (/[؀-ۿ]/.test(sample)) return "Urdu";
  if (/[ऀ-ॿ]/.test(sample)) return "Hindi";
  return "English";
}

export function getWorksheetLocale(output: any): WorksheetLocale {
  return WORKSHEET_LOCALES[detectWorksheetLanguage(output)];
}

export function getWorksheetInstructions(output: any, locale = getWorksheetLocale(output)) {
  const instructions = primaryText(output?.instructions).trim();
  if (!instructions) return locale.defaultInstructions;
  if (locale.language === "English") return instructions;
  const usesTargetScript = locale.language === "Hindi"
    ? /[ऀ-ॿ]/.test(instructions)
    : /[؀-ۿ]/.test(instructions);
  return usesTargetScript ? instructions : locale.defaultInstructions;
}

export function localizeWorksheetSectionTitle(title: unknown, locale: WorksheetLocale, index: number) {
  const raw = primaryText(title).trim();
  if (!raw) return `${locale.section} ${index + 1}`;
  if (locale.language === "English") return raw;
  if (locale.language === "Hindi" && /[ऀ-ॿ]/.test(raw)) return raw;
  if (locale.language === "Urdu" && /[؀-ۿ]/.test(raw)) return raw;

  const prefix = raw.match(/^(?:part|section)\s+([a-z0-9]+)\s*[:.\-–]?\s*/i);
  const body = prefix ? raw.slice(prefix[0].length) : raw;
  const mappings: Array<[RegExp, string]> = [
    [/multiple\s+choice|\bmcq\b/i, locale.questionTypes.multipleChoice],
    [/true\s*(?:or|\/)\s*false/i, locale.questionTypes.trueFalse],
    [/fill\s+(?:in\s+)?the\s+blanks?/i, locale.questionTypes.fillBlanks],
    [/one\s+word/i, locale.questionTypes.oneWord],
    [/short\s+answer/i, locale.questionTypes.shortAnswer],
    [/long\s+answer/i, locale.questionTypes.longAnswer],
    [/match\s+the\s+following/i, locale.questionTypes.matchFollowing],
    [/application(?:\s+based)?/i, locale.questionTypes.applicationBased],
    [/assertion\s*(?:[-–]|and\s+)?\s*reason/i, locale.questionTypes.assertionReason]
  ];
  const translated = mappings.find(([pattern]) => pattern.test(body))?.[1];
  if (!translated) return raw;
  return prefix ? `${locale.part} ${prefix[1].toUpperCase()}: ${translated}` : translated;
}

export function localizeMarks(value: unknown, locale: WorksheetLocale) {
  return primaryText(value).replace(/\bmarks?\b/gi, locale.marks);
}

export type WorksheetLine = {
  text: string;
  language: WorksheetLanguage;
  dir: "ltr" | "rtl";
};

/**
 * A field as the lines to render — one for single-language, two for a pairing.
 *
 * The renderer maps over this instead of asking "is this bilingual?", so a
 * single-language worksheet takes exactly the path it does today. Each line
 * carries its own direction because a pairing can mix LTR English with RTL Urdu,
 * which a single text node cannot represent correctly.
 */
export function toLines(
  value: LocalizedText | unknown,
  languages: { primary: WorksheetLanguage; secondary?: WorksheetLanguage }
): WorksheetLine[] {
  const line = (text: string, language: WorksheetLanguage): WorksheetLine => ({
    text,
    language,
    dir: WORKSHEET_LOCALES[language].dir
  });

  if (isPaired(value)) {
    const secondary = languages.secondary ?? "English";
    return [line(value.primary, languages.primary), line(value.secondary, secondary)];
  }
  return [line(primaryText(value), languages.primary)];
}

/**
 * The bilingual chips this worksheet can offer, and whether each is unlocked.
 *
 * A chip unlocks per worksheet, not per account: `English + हिन्दी` lights up
 * once *this* worksheet has a Hindi variant. Pairings always start with the
 * worksheet's own primary language.
 */
export function pairingChips(primary: WorksheetLanguage, available: string[]) {
  return WORKSHEET_LANGUAGES.filter((language) => language !== primary).map((secondary) => ({
    name: pairingName(primary, secondary),
    secondary,
    unlocked: available.includes(secondary)
  }));
}
