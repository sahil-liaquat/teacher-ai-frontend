/**
 * Localized chrome for lesson plans — section headings, action labels, and text
 * direction.
 *
 * Without this, a Hindi or Urdu lesson plan renders its *content* in the target
 * language but its *headings* ("Learning Objectives", "Homework") and buttons in
 * English, which reads as a half-translated document. Urdu also needs RTL, which
 * hardcoded markup cannot provide.
 *
 * Mirrors lib/worksheet-localization.ts deliberately: same shape, same detection
 * strategy, so the two stay recognisable to each other.
 */

export type LessonPlanLanguage = "English" | "Hindi" | "Urdu";

export type LessonPlanLocale = {
  language: LessonPlanLanguage;
  localeCode: string;
  dir: "ltr" | "rtl";
  /** True when the script needs shaping the PDF writer cannot do (see isPdfSafe). */
  needsComplexShaping: boolean;
  lessonPlanOutput: string;
  generatedLessonPlan: string;
  documentTitle: string;
  backToInputs: string;
  back: string;
  copy: string;
  pdf: string;
  print: string;
  share: string;
  save: string;
  saved: string;
  language_: string;
  translating: string;
  translate: string;
  retranslate: string;
  sourceEdited: string;
  gradePrefix: string;
  subject: string;
  chapter: string;
  board: string;
  textbook: string;
  duration: string;
  minutes: string;
  notSpecified: string;
  /** Section headings, keyed by the stable section keys in generation-output.tsx. */
  sections: Record<string, string>;
  differentiation: Record<string, string>;
};

const ENGLISH_SECTIONS: Record<string, string> = {
  objectives: "Learning Objectives",
  previous_knowledge: "Previous Knowledge",
  key_points: "Key Textbook Points",
  materials: "Teaching-Learning Materials",
  introduction: "Introduction / Warm-up",
  explanation: "Explanation of Concept",
  lesson_flow: "Lesson Flow",
  activity: "Classroom Activity",
  main_details: "Main Concept Details",
  daily_life: "Daily Life Connection",
  differentiation: "Differentiation",
  assessment: "Assessment",
  board_work: "Board Work",
  homework: "Homework",
  learning_outcome: "Learning Outcome",
  teacher_notes: "Teacher Notes"
};

export const LESSON_PLAN_LOCALES: Record<LessonPlanLanguage, LessonPlanLocale> = {
  English: {
    language: "English",
    localeCode: "en-IN",
    dir: "ltr",
    needsComplexShaping: false,
    lessonPlanOutput: "Lesson Plan Output",
    generatedLessonPlan: "Generated Lesson Plan",
    documentTitle: "Document title",
    backToInputs: "Back to Inputs",
    back: "Back",
    copy: "Copy",
    pdf: "PDF",
    print: "Print / Save as PDF",
    share: "Share",
    save: "Save",
    saved: "Saved",
    language_: "Language",
    translating: "Translating…",
    translate: "Translate",
    retranslate: "Re-translate",
    sourceEdited: "The original was edited after this translation.",
    gradePrefix: "Class",
    subject: "Subject",
    chapter: "Chapter",
    board: "Board",
    textbook: "Textbook",
    duration: "Duration",
    minutes: "minutes",
    notSpecified: "Not specified",
    sections: ENGLISH_SECTIONS,
    differentiation: {
      support: "Support",
      challenge: "Challenge",
      remediation: "Remediation",
      extension: "Extension"
    }
  },
  Hindi: {
    language: "Hindi",
    localeCode: "hi-IN",
    dir: "ltr",
    needsComplexShaping: true,
    lessonPlanOutput: "पाठ योजना परिणाम",
    generatedLessonPlan: "तैयार पाठ योजना",
    documentTitle: "दस्तावेज़ शीर्षक",
    backToInputs: "इनपुट पर वापस",
    back: "वापस",
    copy: "कॉपी करें",
    pdf: "पीडीएफ",
    print: "प्रिंट / पीडीएफ सहेजें",
    share: "साझा करें",
    save: "सहेजें",
    saved: "सहेजा गया",
    language_: "भाषा",
    translating: "अनुवाद हो रहा है…",
    translate: "अनुवाद करें",
    retranslate: "फिर से अनुवाद करें",
    sourceEdited: "इस अनुवाद के बाद मूल पाठ योजना बदली गई है।",
    gradePrefix: "कक्षा",
    subject: "विषय",
    chapter: "अध्याय",
    board: "बोर्ड",
    textbook: "पाठ्यपुस्तक",
    duration: "अवधि",
    minutes: "मिनट",
    notSpecified: "निर्दिष्ट नहीं",
    sections: {
      objectives: "अधिगम उद्देश्य",
      previous_knowledge: "पूर्व ज्ञान",
      key_points: "पाठ्यपुस्तक के मुख्य बिंदु",
      materials: "शिक्षण-अधिगम सामग्री",
      introduction: "परिचय / प्रारंभिक गतिविधि",
      explanation: "संकल्पना की व्याख्या",
      lesson_flow: "पाठ प्रवाह",
      activity: "कक्षा गतिविधि",
      main_details: "मुख्य संकल्पना का विवरण",
      daily_life: "दैनिक जीवन से संबंध",
      differentiation: "विभेदीकरण",
      assessment: "मूल्यांकन",
      board_work: "श्यामपट्ट कार्य",
      homework: "गृहकार्य",
      learning_outcome: "अधिगम प्रतिफल",
      teacher_notes: "शिक्षक टिप्पणियाँ"
    },
    differentiation: {
      support: "सहायता",
      challenge: "चुनौती",
      remediation: "उपचारात्मक कार्य",
      extension: "विस्तार कार्य"
    }
  },
  Urdu: {
    language: "Urdu",
    localeCode: "ur-PK",
    dir: "rtl",
    needsComplexShaping: true,
    lessonPlanOutput: "سبق کے خاکے کا نتیجہ",
    generatedLessonPlan: "تیار شدہ سبق کا خاکہ",
    documentTitle: "دستاویز کا عنوان",
    backToInputs: "معلومات پر واپس",
    back: "واپس",
    copy: "نقل کریں",
    pdf: "پی ڈی ایف",
    print: "پرنٹ / پی ڈی ایف محفوظ کریں",
    share: "شیئر کریں",
    save: "محفوظ کریں",
    saved: "محفوظ شدہ",
    language_: "زبان",
    translating: "ترجمہ ہو رہا ہے…",
    translate: "ترجمہ کریں",
    retranslate: "دوبارہ ترجمہ کریں",
    sourceEdited: "اس ترجمے کے بعد اصل خاکہ تبدیل ہو چکا ہے۔",
    gradePrefix: "جماعت",
    subject: "مضمون",
    chapter: "باب",
    board: "بورڈ",
    textbook: "درسی کتاب",
    duration: "دورانیہ",
    minutes: "منٹ",
    notSpecified: "درج نہیں",
    sections: {
      objectives: "تعلیمی مقاصد",
      previous_knowledge: "سابقہ معلومات",
      key_points: "درسی کتاب کے اہم نکات",
      materials: "تدریسی مواد",
      introduction: "تعارف / ابتدائی سرگرمی",
      explanation: "تصور کی وضاحت",
      lesson_flow: "سبق کی ترتیب",
      activity: "کلاس سرگرمی",
      main_details: "بنیادی تصور کی تفصیل",
      daily_life: "روزمرہ زندگی سے تعلق",
      differentiation: "انفرادی فرق کا خیال",
      assessment: "جانچ",
      board_work: "تختہ سیاہ کا کام",
      homework: "گھر کا کام",
      learning_outcome: "تعلیمی نتیجہ",
      teacher_notes: "اساتذہ کے لیے نوٹس"
    },
    differentiation: {
      support: "معاونت",
      challenge: "چیلنج",
      remediation: "اصلاحی کام",
      extension: "توسیعی کام"
    }
  }
};

export const LESSON_PLAN_LANGUAGES: LessonPlanLanguage[] = ["English", "Hindi", "Urdu"];

/** Display name in the language's own script, for the language switcher. */
export const LESSON_PLAN_LANGUAGE_LABELS: Record<LessonPlanLanguage, string> = {
  English: "English",
  Hindi: "हिन्दी",
  Urdu: "اردو"
};

export function isLessonPlanLanguage(value: unknown): value is LessonPlanLanguage {
  return LESSON_PLAN_LANGUAGES.includes(value as LessonPlanLanguage);
}

function namedLanguage(value: unknown): LessonPlanLanguage | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (/hindi|हिन्दी|हिंदी/.test(normalized)) return "Hindi";
  if (/urdu|اُردو|اردو/.test(normalized)) return "Urdu";
  if (/english|अंग्रेजी|انگریزی/.test(normalized)) return "English";
  return null;
}

/**
 * Work out which language a plan is written in.
 *
 * Prefers an explicit label, then falls back to sniffing the script — plans
 * generated before `input_json` recorded a language have nothing else to go on,
 * and GeneratedLessonPlan's metadata has never carried a language field.
 */
export function detectLessonPlanLanguage(output: any): LessonPlanLanguage {
  const metadata = output?.metadata || {};
  const explicit = [metadata.language, output?.language]
    .map(namedLanguage)
    .find(Boolean);
  if (explicit) return explicit;

  const sample = JSON.stringify({
    title: output?.title,
    objectives: output?.learning_objectives,
    explanation: output?.explanation_of_concept,
    homework: output?.homework
  });
  if (/[؀-ۿ]/.test(sample)) return "Urdu";
  if (/[ऀ-ॿ]/.test(sample)) return "Hindi";
  return "English";
}

export function getLessonPlanLocale(language?: unknown, output?: any): LessonPlanLocale {
  if (isLessonPlanLanguage(language)) return LESSON_PLAN_LOCALES[language];
  const named = namedLanguage(language);
  if (named) return LESSON_PLAN_LOCALES[named];
  return LESSON_PLAN_LOCALES[detectLessonPlanLanguage(output)];
}

/** Section heading for a section key, falling back to any title already present. */
export function sectionTitle(locale: LessonPlanLocale, key: string, fallback?: string): string {
  return locale.sections[key] || fallback || ENGLISH_SECTIONS[key] || key;
}

/**
 * Whether the built-in PDF writer can render this text.
 *
 * `lib/lesson-plan-export.ts` builds PDFs with Helvetica + WinAnsiEncoding and
 * strips every non-ASCII character, so Devanagari and Nastaliq come out blank.
 * Embedding a font would not be enough either — both scripts need complex-script
 * shaping (conjuncts, ligatures) that a glyph-per-codepoint writer cannot do.
 * Non-Latin plans go through the browser's print pipeline instead, which shapes
 * correctly and offers "Save as PDF".
 */
export function canUseBuiltInPdf(locale: LessonPlanLocale): boolean {
  return !locale.needsComplexShaping;
}
