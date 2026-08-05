import type { KitSequenceItemType, PrimaryTeachingKitContent } from "./api";

/**
 * Component-level kit regeneration.
 *
 * The single entry point is `generateKitComponent(input)` — the rest of the
 * app never imports templates directly. The default implementation is
 * template-based, but any strategy can be swapped in later (e.g. a live AI
 * endpoint) via `registerKitComponentGenerator`, which keeps this module the
 * only boundary the UI talks to.
 *
 * `applyKitComponent` merges a generator output back into the kit, touching
 * exactly one component and preserving everything else (sequence links,
 * resources, objectives, other steps).
 */

export type KitComponentName = "warm_up" | "classroom_activity" | "homework" | "parent_update" | "assessment_instructions";

export type KitComponentContext = {
  class_level: string;
  subject: string;
  theme: string;
  language: string;
};

export type KitComponentConstraints = {
  duration?: number;
  materials?: string[];
  avoid_repetition?: boolean;
};

export type KitComponentInput = {
  component: KitComponentName;
  context: KitComponentContext;
  learning_objectives: string[];
  current_component: unknown;
  constraints?: KitComponentConstraints;
};

export type KitSequenceComponentValue = { title: string; instructions: string[]; duration: number };
export type KitTextComponentValue = { text: string };
export type KitAssessmentComponentValue = { title: string; questions: string[]; successCriteria: string[] };

export type KitComponentOutput =
  | { component: "warm_up"; value: KitSequenceComponentValue }
  | { component: "classroom_activity"; value: KitSequenceComponentValue }
  | { component: "homework"; value: KitTextComponentValue }
  | { component: "parent_update"; value: KitTextComponentValue }
  | { component: "assessment_instructions"; value: KitAssessmentComponentValue };

export const KIT_COMPONENT_NAMES: KitComponentName[] = ["warm_up", "classroom_activity", "homework", "parent_update", "assessment_instructions"];

export function isKitComponentName(value: string): value is KitComponentName {
  return (KIT_COMPONENT_NAMES as string[]).includes(value);
}

type KitComponentGenerator = (input: KitComponentInput) => KitComponentOutput | Promise<KitComponentOutput>;

let activeGenerator: KitComponentGenerator | null = null;

/** Swap in a live generator (e.g. an AI endpoint) later. Returns an unregister fn. */
export function registerKitComponentGenerator(generator: KitComponentGenerator): () => void {
  activeGenerator = generator;
  return () => {
    activeGenerator = null;
  };
}

export async function generateKitComponent(input: KitComponentInput): Promise<KitComponentOutput> {
  const generator = activeGenerator ?? templateKitComponentGenerator;
  return generator(input);
}

// ──────────────────────────────────────────────────────────────
// Template strategy
//
// Each component has several distinct templates; a rotating variant
// counter plus a hash of the current content keeps consecutive
// regenerations from returning the same wording.
// ──────────────────────────────────────────────────────────────

let variationCounter = 0;
const lastVariant: Partial<Record<KitComponentName, number>> = {};

function stableHash(value: unknown): number {
  const text = JSON.stringify(value) ?? "";
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickVariant(component: KitComponentName, current: unknown): number {
  const previous = lastVariant[component];
  let variant = (variationCounter + stableHash(current)) % 3;
  variationCounter += 1;
  if (previous !== undefined && variant === previous) variant = (variant + 1) % 3;
  lastVariant[component] = variant;
  return variant;
}

function materialsLine(materials: string[] | undefined, theme: string): string {
  if (!materials?.length) return `Use whatever is in your classroom — a board or chart works well for ${theme}.`;
  return `Use the ${materials.slice(0, 3).join(", ")} you have ready.`;
}

function warmUpTemplate(input: KitComponentInput): KitSequenceComponentValue {
  const { theme, class_level, subject, language } = input.context;
  const duration = input.constraints?.duration ?? 5;
  const materials = materialsLine(input.constraints?.materials, theme);
  const variant = pickVariant(input.component, input.current_component);
  const titles = [
    `Warm-up — what do we already know about ${theme}?`,
    `Warm-up — one word, one sound for ${theme}`,
    `Warm-up — spark a memory about ${theme}`,
  ];
  const variants: Array<[string[], number]> = [
    [
      [
        `Gather the ${class_level} children in a circle and ask: “Who can say one word about ${theme}?”`,
        `Point to a picture or object linked to ${theme} and let three or four children share what they see.`,
        `Echo the best words together and write them on the board so the class can see them.`,
        `Set the tone: “Today we will learn and play with our ${subject} words.”`,
      ],
      duration,
    ],
    [
      [
        `Say a key ${subject} word connected to ${theme} and ask children to repeat it once, then once in a whisper.`,
        `Clap the syllables of the word together — each clap is one beat.`,
        `Ask one question about ${theme} and take two or three quick answers.`,
        `Tie it together: “Keep those words in your head — we will use them all lesson.”`,
      ],
      duration,
    ],
    [
      [
        `Ask children to close their eyes and think of one thing they remember about ${theme}.`,
        `Invite two volunteers to share their memory in a sentence.`,
        `Bring the ideas onto the board as a simple word bank for the lesson.`,
        `Get everyone moving: jump once for every key word you call out.`,
      ],
      duration,
    ],
  ];
  const [instructions, variantDuration] = variants[variant];
  if (language === "Hindi" || language === "Bilingual") {
    instructions[instructions.length - 1] = `${instructions[instructions.length - 1]} (हिंदी में भी कह सकते हैं — say it in Hindi too.)`;
  }
  return { title: titles[variant], instructions, duration: variantDuration };
}

function classroomActivityTemplate(input: KitComponentInput): KitSequenceComponentValue {
  const { theme, class_level } = input.context;
  const duration = input.constraints?.duration ?? 10;
  const materials = materialsLine(input.constraints?.materials, theme);
  const variant = pickVariant(input.component, input.current_component);
  const titles = [
    `Classroom activity — match and say: ${theme}`,
    `Classroom activity — pair play with ${theme} words`,
    `Classroom activity — build and show: ${theme}`,
  ];
  const variants: Array<[string[], number]> = [
    [
      [
        `Children work in pairs with the ${theme} cards or pictures.`,
        `One child names a picture; the partner finds its match and says the word back.`,
        `Walk around, praise effort and gently correct pronunciation.`,
        `Ask two pairs to show one match to the whole class.`,
      ],
      duration,
    ],
    [
      [
        `Split the class into small groups and give each group a set of ${theme} word cards.`,
        `Call out a word; the group that holds the matching card stands up and says it loudly.`,
        `Swap cards between rounds so everyone practises every word.`,
        `Close with one round played silently — groups hold up cards instead of shouting.`,
      ],
      duration,
    ],
    [
      [
        `Each pair draws one scene connected to ${theme} and labels it with the key words.`,
        `Pairs take turns presenting their scene in one or two sentences.`,
        `Collect the drawings into a class display for ${theme}.`,
        `${materials}`,
      ],
      duration,
    ],
  ];
  return { title: titles[variant], instructions: variants[variant][0], duration: variants[variant][1] };
}

function homeworkTemplate(input: KitComponentInput): KitTextComponentValue {
  const { theme, subject, language } = input.context;
  const variant = pickVariant(input.component, input.current_component);
  const languageHint = language === "Hindi" || language === "Bilingual" ? " (आप हिंदी में भी बात कर सकते हैं — you can talk about it in Hindi too)" : "";
  const variants = [
    `Talk to your family about “${theme}” tonight${languageHint} — ask them what they already know about it, and tell them one word you learned today.`,
    `Find or draw one thing connected to “${theme}” at home and bring it to class tomorrow. Practise saying its name in ${subject}.`,
    `Teach your family one ${subject} word from today's lesson — say it, clap it, and ask them to repeat it.`,
  ];
  return { text: variants[variant] };
}

function parentUpdateTemplate(input: KitComponentInput): KitTextComponentValue {
  const { theme, subject, class_level, language } = input.context;
  const objectives = input.learning_objectives.slice(0, 3);
  const variant = pickVariant(input.component, input.current_component);
  const objectiveLine = objectives.length
    ? `\nYour child is working towards: ${objectives.map((objective) => objective.toLowerCase()).join("; ")}.`
    : `\nYour child is learning key words and ideas connected to ${theme} in ${subject}.`;
  const variants = [
    `Dear Parent, this week in ${class_level} we are exploring “${theme}” in ${subject}.${objectiveLine}\nPlease ask your child about the lesson and let them teach you the key words we practised at school. Thank you for your support!`,
    `Dear Parent, in ${class_level} we have been learning about “${theme}”.${objectiveLine}\nA small way to help: chat with your child about ${theme} at home and praise them for using the new words. Thank you!`,
    `Dear Parent, your child's ${class_level} class is building a picture of “${theme}” in ${subject}.${objectiveLine}\nEncourage your child to share the lesson's story or rhyme with you tonight — repetition at home makes a big difference. Thank you!`,
  ];
  const hint = language === "Hindi" || language === "Bilingual" ? " (आप हिंदी में भी पूछ सकते हैं — you may ask in Hindi too.)" : "";
  return { text: variants[variant] + hint };
}

function assessmentTemplate(input: KitComponentInput): KitAssessmentComponentValue {
  const { theme, subject } = input.context;
  const variant = pickVariant(input.component, input.current_component);
  const titles = [
    `Quick check — oral assessment: ${theme}`,
    `Check-in questions — ${theme} in ${subject}`,
    `Two-minute review — what stuck about ${theme}`,
  ];
  const variants: Array<{ questions: string[]; successCriteria: string[] }> = [
    {
      questions: [
        `Name one thing you learned about ${theme} today.`,
        `Point to the picture and say the word.`,
        `Answer one question about ${theme} using a key word.`,
      ],
      successCriteria: [
        "Names one thing from the lesson without prompting",
        "Uses a key word in a short sentence",
        "Responds with encouragement and one follow-up question",
      ],
    },
    {
      questions: [
        `Say two words from our ${theme} lesson.`,
        `What did we do first in the lesson today?`,
        `Can you use the word “${theme.split(" ")[0].toLowerCase()}” in a sentence?`,
      ],
      successCriteria: [
        "Recalls two key words from the lesson",
        "Retells one activity in the right order",
        "Attempts a sentence even if not yet perfect",
      ],
    },
    {
      questions: [
        `What is one thing about ${theme} you will remember?`,
        `Which word did you find the easiest to say?`,
        `Show me with your hands or body something from today's lesson.`,
      ],
      successCriteria: [
        "Shares a personal connection to the lesson",
        "Names a key word and explains why it was easy",
        "Responds in any way — words, actions or drawing",
      ],
    },
  ];
  return { title: titles[variant], questions: variants[variant].questions, successCriteria: variants[variant].successCriteria };
}

export const templateKitComponentGenerator: KitComponentGenerator = (input) => {
  switch (input.component) {
    case "warm_up":
      return { component: "warm_up", value: warmUpTemplate(input) };
    case "classroom_activity":
      return { component: "classroom_activity", value: classroomActivityTemplate(input) };
    case "homework":
      return { component: "homework", value: homeworkTemplate(input) };
    case "parent_update":
      return { component: "parent_update", value: parentUpdateTemplate(input) };
    case "assessment_instructions":
      return { component: "assessment_instructions", value: assessmentTemplate(input) };
  }
};

// ──────────────────────────────────────────────────────────────
// Merging an output back into the kit — exactly one component is
// replaced; everything else (sequence links, resources, objectives,
// other steps) is untouched.
// ──────────────────────────────────────────────────────────────

function applySequenceItem(content: PrimaryTeachingKitContent, type: KitSequenceItemType, value: { title: string; instructions: string[]; duration: number }): PrimaryTeachingKitContent {
  return {
    ...content,
    sequence: content.sequence.map((item) => (item.type === type ? { ...item, title: value.title, instructions: value.instructions, duration: value.duration, source: "curated" as const } : item)),
  };
}

export function applyKitComponent(content: PrimaryTeachingKitContent, output: KitComponentOutput): PrimaryTeachingKitContent {
  switch (output.component) {
    case "warm_up":
      return applySequenceItem(content, "warm_up", output.value);
    case "classroom_activity":
      return applySequenceItem(content, "classroom_activity", output.value);
    case "homework":
      return { ...content, homework: output.value.text, homeworkSource: "curated" };
    case "parent_update":
      return { ...content, parentUpdate: output.value.text, parentUpdateSource: "template" };
    case "assessment_instructions":
      return {
        ...content,
        assessment: {
          ...content.assessment,
          title: output.value.title,
          questions: output.value.questions,
          successCriteria: output.value.successCriteria,
          source: "curated",
        },
      };
  }
}
