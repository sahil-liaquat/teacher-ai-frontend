import type {
  KitAssessmentBlock,
  KitComponent,
  KitLearningObjective,
  KitResourceItem,
  KitSequenceItem,
  KitSequenceItemType,
  PrimaryTeachingKitContent,
  TeachingKitResource,
} from "./api.ts";
import { PRIMARY_RESOURCES, type PrimaryResource } from "./primary-resource-catalog.ts";
import { themeContent } from "./primary-theme-content.ts";
import type { PrimaryTeachingContext } from "./primary-context-helpers.ts";

export const KIT_COMPONENTS: KitComponent[] = [
  "daily-plan",
  "objectives",
  "warm-up",
  "explanation",
  "story",
  "flashcards",
  "picture-talk",
  "classroom-activity",
  "worksheet",
  "homework",
  "assessment",
  "parent-update",
];

export const KIT_COMPONENT_LABELS: Record<KitComponent, string> = {
  "daily-plan": "Daily Teaching Plan",
  objectives: "Learning Objectives",
  "warm-up": "Warm-up",
  explanation: "Explanation",
  story: "Story or Rhyme",
  flashcards: "Flashcards",
  "picture-talk": "Picture-talk Activity",
  "classroom-activity": "Classroom Activity",
  worksheet: "Worksheet",
  homework: "Homework",
  assessment: "Assessment",
  "parent-update": "Parent Update",
};

export const KIT_SEQUENCE_TYPE_LABELS: Record<KitSequenceItemType, string> = {
  warm_up: "Warm-up",
  introduction: "Introduction",
  story_or_rhyme: "Story or Rhyme",
  picture_talk: "Picture Talk",
  classroom_activity: "Classroom Activity",
  worksheet: "Worksheet",
  assessment: "Assessment",
};

// Map each teaching-sequence step to the catalogue component it draws resources from.
const SEQUENCE_COMPONENT: Record<KitSequenceItemType, KitComponent> = {
  warm_up: "warm-up",
  introduction: "explanation",
  story_or_rhyme: "story",
  picture_talk: "picture-talk",
  classroom_activity: "classroom-activity",
  worksheet: "worksheet",
  assessment: "assessment",
};

const COMPONENT_CATEGORIES: Partial<Record<KitComponent, string[]>> = {
  "warm-up": ["Circle Time Prompts", "Calendar Activities"],
  story: ["Story Cards"],
  flashcards: ["Flashcards", "Vocabulary Cards"],
  "picture-talk": ["Picture Talk Cards", "Flashcards"],
  "classroom-activity": ["Matching Activities"],
  worksheet: ["Worksheets"],
  homework: ["Tracing Sheets", "Colouring Pages"],
  assessment: ["Matching Activities", "Worksheets"],
};

const COMPONENT_SKILLS: Partial<Record<KitComponent, string[]>> = {
  "warm-up": ["Speaking", "Routine"],
  story: ["Listening", "Comprehension", "Sequencing"],
  flashcards: ["Vocabulary", "Visual Recognition"],
  "picture-talk": ["Speaking", "Observation"],
  "classroom-activity": ["Matching", "Sorting", "Categorisation"],
  worksheet: ["Writing", "Concept Practice", "Counting"],
  homework: ["Fine Motor", "Pre-Writing"],
  assessment: ["Visual Discrimination", "Matching", "Concept Practice"],
};

// ──────────────────────────────────────────────────────────────
// Resource matching
//
// Every catalogue resource carries explicit subjects, levels,
// themes, keywords, languages and skills (see
// lib/primary-resource-catalog.ts). Scoring is transparent:
// each signal contributes a fixed weight, so a resource is only
// recommended when it genuinely fits the class, subject, theme
// and language of the lesson.
// ──────────────────────────────────────────────────────────────

export const RESOURCE_SCORE_WEIGHTS = {
  theme: 40,       // exact theme match
  subject: 25,     // subject match
  level: 20,       // class is inside the resource's level band
  category: 15,    // component uses this category (e.g. worksheet → Worksheets)
  keyword: 10,     // theme keyword appears in title/keywords
  language: 10,    // resource supports the lesson language
  skill: 10,       // component skill overlaps the resource's skills
  duplicate: -30,  // already picked for this kit
  levelMismatch: -40, // class outside the resource's level band
} as const;

// Minimum score for a match to be worth recommending. Below this
// the resource is a weak, random-looking pick, so we return none
// and the caller falls back to prepared instructional content.
export const MIN_RESOURCE_SCORE = 55;

function levelFits(resource: PrimaryResource, level: string): boolean {
  return resource.levels.includes(level);
}

function languageMatches(resource: PrimaryResource, contextLanguage: string): boolean {
  if (contextLanguage === "Bilingual") {
    return resource.languages.includes("Hindi") || resource.languages.includes("Bilingual");
  }
  return resource.languages.includes(contextLanguage);
}

export type ResourceMatchResult = {
  resource: PrimaryResource;
  score: number;
  reasons: string[];
};

export function scoreResourceDetailed(
  resource: PrimaryResource,
  component: KitComponent,
  context: PrimaryTeachingContext,
  themeKeywords: string[],
  excludeFileUrls: string[] = []
): ResourceMatchResult {
  const reasons: string[] = [];
  let score = 0;
  const title = `${resource.title} ${resource.keywords.join(" ")} ${resource.category}`.toLowerCase();

  if (context.theme && resource.themes.includes(context.theme)) {
    score += RESOURCE_SCORE_WEIGHTS.theme;
    reasons.push(`Exact theme match (+${RESOURCE_SCORE_WEIGHTS.theme})`);
  }
  if (resource.subjects.includes(context.subject)) {
    score += RESOURCE_SCORE_WEIGHTS.subject;
    reasons.push(`Subject match (+${RESOURCE_SCORE_WEIGHTS.subject})`);
  }
  if (levelFits(resource, context.level)) {
    score += RESOURCE_SCORE_WEIGHTS.level;
    reasons.push(`Level fits (+${RESOURCE_SCORE_WEIGHTS.level})`);
  } else {
    score += RESOURCE_SCORE_WEIGHTS.levelMismatch;
    reasons.push(`Level mismatch (${RESOURCE_SCORE_WEIGHTS.levelMismatch})`);
  }
  if (COMPONENT_CATEGORIES[component]?.includes(resource.category)) {
    score += RESOURCE_SCORE_WEIGHTS.category;
    reasons.push(`Category match (+${RESOURCE_SCORE_WEIGHTS.category})`);
  }
  if (themeKeywords.some((keyword) => title.includes(keyword.toLowerCase()))) {
    score += RESOURCE_SCORE_WEIGHTS.keyword;
    reasons.push(`Keyword match (+${RESOURCE_SCORE_WEIGHTS.keyword})`);
  }
  if (languageMatches(resource, context.language)) {
    score += RESOURCE_SCORE_WEIGHTS.language;
    reasons.push(`Language match (+${RESOURCE_SCORE_WEIGHTS.language})`);
  }
  if (COMPONENT_SKILLS[component]?.some((skill) => resource.skills.includes(skill))) {
    score += RESOURCE_SCORE_WEIGHTS.skill;
    reasons.push(`Skill match (+${RESOURCE_SCORE_WEIGHTS.skill})`);
  }
  if (excludeFileUrls.includes(resource.fileUrl)) {
    score += RESOURCE_SCORE_WEIGHTS.duplicate;
    reasons.push(`Duplicate check (${RESOURCE_SCORE_WEIGHTS.duplicate})`);
  }

  return { resource, score, reasons };
}

export function scoreResource(resource: PrimaryResource, component: KitComponent, context: PrimaryTeachingContext, themeKeywords: string[], excludeFileUrls: string[] = []): number {
  const result = scoreResourceDetailed(resource, component, context, themeKeywords, excludeFileUrls);
  return result.score;
}

export function matchResources(context: PrimaryTeachingContext, component: KitComponent, limit = 2, excludeFileUrls: string[] = []): PrimaryResource[] {
  const content = themeContent(context.theme, context.subject);
  const candidates = PRIMARY_RESOURCES
    .filter((resource) => levelFits(resource, context.level))
    .filter((resource) => languageMatches(resource, context.language))
    .filter((resource) => !excludeFileUrls.includes(resource.fileUrl))
    .map((resource) => ({ resource, score: scoreResource(resource, component, context, content.keywords, excludeFileUrls) }))
    .filter((entry) => entry.score >= MIN_RESOURCE_SCORE)
    .sort((a, b) => b.score - a.score || a.resource.title.localeCompare(b.resource.title));
  return candidates.slice(0, limit).map((entry) => entry.resource);
}

// ──────────────────────────────────────────────────────────────
// Kit resource editing (replace / remove)
//
// Resources keep their id across edits so the teaching sequence
// (which links steps to resources by id) is untouched — replacing
// one card never regenerates the kit.
// ──────────────────────────────────────────────────────────────

export function componentForResource(resourceId: string): KitComponent {
  return KIT_COMPONENTS.find((component) => resourceId.startsWith(`${component}-`)) ?? "flashcards";
}

export function flatResourcesFromContent(content: PrimaryTeachingKitContent): TeachingKitResource[] {
  return content.resources
    .filter((item) => item.fileUrl)
    .map((item) => ({
      id: item.id,
      component: componentForResource(item.id),
      title: item.title,
      fileUrl: item.fileUrl,
      thumbnailUrl: item.thumbnailUrl,
      fileType: item.fileType as TeachingKitResource["fileType"] | undefined,
      category: item.category,
    }));
}

export function replaceKitResource(content: PrimaryTeachingKitContent, resourceId: string, replacement: PrimaryResource): PrimaryTeachingKitContent {
  return {
    ...content,
    resources: content.resources.map((item) =>
      item.id === resourceId
        ? {
            ...item,
            title: replacement.title,
            fileUrl: replacement.fileUrl,
            thumbnailUrl: replacement.thumbnailUrl,
            fileType: replacement.fileType,
            category: replacement.category,
            instruction: undefined,
          }
        : item,
    ),
  };
}

export function removeKitResourceAttachment(content: PrimaryTeachingKitContent, resourceId: string, theme: string): PrimaryTeachingKitContent {
  return {
    ...content,
    resources: content.resources.map((item) =>
      item.id === resourceId
        ? {
            ...item,
            title: `Instructional idea — ${KIT_COMPONENT_LABELS[componentForResource(item.id)]}`,
            fileUrl: undefined,
            thumbnailUrl: undefined,
            fileType: undefined,
            category: undefined,
            instruction: fallbackInstruction(componentForResource(item.id), theme),
          }
        : item,
    ),
  };
}

export function resourceAlternatives(context: PrimaryTeachingContext, component: KitComponent, usedFileUrls: string[], currentFileUrl?: string): PrimaryResource[] {
  const excluded = currentFileUrl ? [...usedFileUrls, currentFileUrl] : usedFileUrls;
  return matchResources(context, component, 5, excluded);
}

// ──────────────────────────────────────────────────────────────
// Curated lesson data per theme: objectives, vocabulary, homework
// and assessment questions so every kit reads as one connected
// lesson rather than a random set of cards.
// ──────────────────────────────────────────────────────────────

type ThemeLessonData = {
  objectives: string[];
  vocabulary: string[];
  assessment: string[];
  homework: string;
};

const THEME_LESSON_DATA: Record<string, ThemeLessonData> = {
  "My Family": {
    objectives: [
      "Identify common family members and their roles",
      "Name family members using key words and simple sentences",
      "Respond to simple questions about their own family",
      "Complete a matching activity on family vocabulary",
    ],
    vocabulary: ["family", "mother", "father", "sister", "brother", "baby", "home"],
    assessment: [
      "Name three people who live in your family",
      "Point to the picture of the mother and say the word",
      "Who is the baby in this family picture?",
    ],
    homework: "Talk to your family about one family member tonight — who they are, what they do, and why you love them. Draw that person tomorrow.",
  },
  "My School": {
    objectives: [
      "Identify the main places and people in school",
      "Name school objects using key words",
      "Describe what happens at school in simple sentences",
      "Complete a school-words matching worksheet",
    ],
    vocabulary: ["school", "classroom", "teacher", "friend", "book", "bag", "desk", "assembly"],
    assessment: [
      "Name three things you can see in a classroom",
      "Who helps you learn at school?",
      "Match the school bag to its picture and say the word",
    ],
    homework: "Ask your child to tell you about their school day — their teacher, their friends, and one thing they keep in their bag.",
  },
  Animals: {
    objectives: [
      "Identify common animals and their names",
      "Match animals to their homes and sounds",
      "Talk about animals using simple sentences",
      "Sort animals into farm and wild groups",
    ],
    vocabulary: ["animal", "cow", "lion", "elephant", "dog", "bird", "farm", "zoo"],
    assessment: [
      "Name the animal in this picture",
      "Where does a cow live?",
      "Which sound does a dog make?",
    ],
    homework: "Practise the animal names at home tonight — point to a picture or toy animal and ask your child to name it and copy its sound.",
  },
  "Fruits & Vegetables": {
    objectives: [
      "Identify common fruits and vegetables by name",
      "Match fruits and vegetables to their colours",
      "Talk about healthy food in simple sentences",
      "Sort pictures into fruit and vegetable groups",
    ],
    vocabulary: ["apple", "banana", "mango", "tomato", "carrot", "fruit", "vegetable", "market"],
    assessment: [
      "Name this fruit",
      "Is a tomato a fruit or a vegetable?",
      "Which fruit is yellow?",
    ],
    homework: "At dinner tonight, ask your child to name each fruit or vegetable on their plate and say its colour.",
  },
  Colours: {
    objectives: [
      "Recognise and name primary colours",
      "Match colours to everyday objects",
      "Sort objects by colour",
      "Use colour words in simple sentences",
    ],
    vocabulary: ["red", "blue", "green", "yellow", "orange", "pink", "rainbow"],
    assessment: [
      "What colour is this? (show a red object)",
      "Find something blue in the room",
      "Name the colours of the rainbow you remember",
    ],
    homework: "Colour hunt at home — ask your child to find one red, one blue and one green object and bring them to class tomorrow.",
  },
  Shapes: {
    objectives: [
      "Recognise and name basic shapes",
      "Describe shapes by sides and corners",
      "Find shapes in the environment",
      "Sort objects by shape",
    ],
    vocabulary: ["circle", "square", "triangle", "rectangle", "star", "shape"],
    assessment: [
      "Name this shape",
      "How many sides does a triangle have?",
      "Find a circle in the classroom",
    ],
    homework: "Shape hunt at home — find and name one circle, one square and one triangle, and draw them on paper.",
  },
  "Numbers 1-10": {
    objectives: [
      "Count objects from 1 to 10",
      "Recognise the written numerals 1 to 10",
      "Match quantities to numerals",
      "Trace and write numerals 1 to 10",
    ],
    vocabulary: ["one", "two", "three", "four", "five", "count", "number"],
    assessment: [
      "Count these objects aloud",
      "Which numeral shows five?",
      "Show me three fingers",
    ],
    homework: "Count things at home tonight — spoons, shoes or toys — and say how many there are up to 10.",
  },
  "Numbers 11-20": {
    objectives: [
      "Count objects from 11 to 20",
      "Recognise the numerals 11 to 20",
      "Count on from 10",
      "Order numerals 11 to 20",
    ],
    vocabulary: ["eleven", "twelve", "fifteen", "twenty", "count", "order"],
    assessment: [
      "Count on from 10 to 15",
      "Which number comes after 12?",
      "Show me the numeral for twenty",
    ],
    homework: "Count 11 to 20 with your child on the walk home — steps, trees or vehicles are great for counting.",
  },
  Plants: {
    objectives: [
      "Identify parts of a plant",
      "Name what plants need to grow",
      "Describe how plants grow in simple sentences",
      "Match seeds, plants and leaves",
    ],
    vocabulary: ["plant", "tree", "flower", "leaf", "seed", "root", "grow", "water"],
    assessment: [
      "Name the parts of this plant",
      "What does a plant need to grow?",
      "Where do we find roots?",
    ],
    homework: "Look at a plant or tree near your home — name its parts together and water a plant if you have one.",
  },
  "My Body": {
    objectives: [
      "Name the main parts of the body",
      "Point to body parts on themselves and others",
      "Talk about what each body part does",
      "Follow simple instructions naming body parts",
    ],
    vocabulary: ["head", "eyes", "ears", "nose", "hands", "feet", "body"],
    assessment: [
      "Point to your eyes and say the word",
      "What do we do with our ears?",
      "Name three parts of your body",
    ],
    homework: "Play 'point and name' at home — your child points to a body part and says its name. Practise 5 parts tonight.",
  },
  "Seasons & Weather": {
    objectives: [
      "Identify different types of weather",
      "Name the four seasons",
      "Connect weather to clothes and activities",
      "Talk about today's weather in simple sentences",
    ],
    vocabulary: ["sun", "rain", "cloud", "wind", "summer", "winter", "weather"],
    assessment: [
      "What is the weather like today?",
      "Which season is hot?",
      "What do we wear when it rains?",
    ],
    homework: "Check the weather together in the morning — ask your child to describe it and choose the right clothes for the day.",
  },
  Food: {
    objectives: [
      "Identify different foods and their names",
      "Group foods into healthy food groups",
      "Talk about favourite foods in simple sentences",
      "Recognise the importance of eating healthy food",
    ],
    vocabulary: ["food", "milk", "bread", "rice", "fruit", "vegetable", "healthy", "meal"],
    assessment: [
      "Name two healthy foods",
      "Which food gives us milk?",
      "Is an apple healthy or a treat?",
    ],
    homework: "At mealtime, ask your child to name each food on the plate and say whether it helps us stay healthy.",
  },
  Transport: {
    objectives: [
      "Identify common means of transport",
      "Sort transport into land, water and air",
      "Name transport using key words",
      "Follow simple road safety rules",
    ],
    vocabulary: ["bus", "car", "train", "bicycle", "boat", "aeroplane", "road"],
    assessment: [
      "Name this vehicle",
      "Does a boat travel on land or water?",
      "Where do we walk? (road safety)",
    ],
    homework: "On the way home, count the different vehicles you see — ask your child to name each one and say if it travels on land, water or air.",
  },
  "Community Helpers": {
    objectives: [
      "Identify people who help us in the community",
      "Match helpers to their tools and jobs",
      "Describe a helper's job in simple sentences",
      "Show appreciation for community helpers",
    ],
    vocabulary: ["doctor", "police", "teacher", "firefighter", "farmer", "helper"],
    assessment: [
      "Who helps us when we are sick?",
      "What does a firefighter use?",
      "Name two community helpers",
    ],
    homework: "Talk about a community helper your family meets this week — who they are and how they help us.",
  },
  Water: {
    objectives: [
      "Identify where water comes from",
      "Name ways we use water",
      "Recognise why saving water matters",
      "Talk about water in simple sentences",
    ],
    vocabulary: ["water", "rain", "river", "drink", "bottle", "tap", "save"],
    assessment: [
      "Where can we find water?",
      "Why do we need water?",
      "How can we save water at home?",
    ],
    homework: "Watch together how water is used at home — ask your child to name three ways we use water and one way to save it.",
  },
  "Festivals of India": {
    objectives: [
      "Identify festivals celebrated in India",
      "Name festival customs and symbols",
      "Talk about celebrations in simple sentences",
      "Show respect for different festivals",
    ],
    vocabulary: ["festival", "diwali", "holi", "eid", "lights", "colour", "celebration"],
    assessment: [
      "Name a festival you celebrate",
      "Which festival do we light diyas for?",
      "What makes a festival special?",
    ],
    homework: "Ask your family about a festival you celebrate together — its name, what you do, and what you eat.",
  },
  "Rhymes & Poems": {
    objectives: [
      "Recite a short rhyme or poem with actions",
      "Identify rhyming words",
      "Listen and respond to rhythm",
      "Perform a rhyme with confidence",
    ],
    vocabulary: ["rhyme", "song", "clap", "tune", "words", "action"],
    assessment: [
      "Recite your favourite rhyme",
      "Which words rhyme in this rhyme?",
      "Show the action for 'clap'",
    ],
    homework: "Practise this week's rhyme at home and perform it for your family — actions included!",
  },
  Patterns: {
    objectives: [
      "Identify simple repeating patterns",
      "Copy a pattern with shapes or colours",
      "Continue a given pattern",
      "Create a pattern of their own",
    ],
    vocabulary: ["pattern", "repeat", "next", "circle", "square", "same"],
    assessment: [
      "What comes next in this pattern?",
      "Copy this pattern with your blocks",
      "Make a pattern of your own",
    ],
    homework: "Create a pattern at home with objects or colours — beads, socks or toys — and bring a drawing of it to class.",
  },
  "मेरा परिवार": {
    objectives: [
      "परिवार के सदस्यों को पहचानना",
      "परिवार के सदस्यों के नाम बोलना",
      "परिवार के बारे में सरल प्रश्नों के उत्तर देना",
      "परिवार शब्दों का मिलान करना",
    ],
    vocabulary: ["माँ", "पिता", "भाई", "बहन", "दादी", "दादा", "परिवार"],
    assessment: [
      "अपने परिवार के तीन सदस्यों के नाम बताओ",
      "माँ की तस्वीर दिखाकर उसका नाम बोलो",
      "इस परिवार की तस्वीर में बच्चा कौन है?",
    ],
    homework: "आज रात घर पर परिवार के एक सदस्य के बारे में बात करो — वे कौन हैं, क्या करते हैं, और आप उनसे प्यार क्यों करते हैं।",
  },
  Myself: {
    objectives: [
      "Share their own name and age",
      "Identify and name their feelings",
      "Talk about likes and dislikes",
      "Draw or describe something about themselves",
    ],
    vocabulary: ["name", "me", "happy", "sad", "like", "feelings", "friend"],
    assessment: [
      "What is your name?",
      "How do you feel today?",
      "What do you like to play?",
    ],
    homework: "Ask your child to tell you three things about themselves — their name, one thing they like, and how they feel today.",
  },
  Counting: {
    objectives: [
      "Count objects with one-to-one correspondence",
      "Compare groups as more and less",
      "Count aloud up to 10",
      "Match counted objects to numbers",
    ],
    vocabulary: ["count", "more", "less", "match", "one", "many", "few"],
    assessment: [
      "Count the objects in this group",
      "Which group has more?",
      "Count aloud from 1 to 10",
    ],
    homework: "Count the objects in each room tonight — how many chairs, shoes or spoons can you find?",
  },
};

function buildGenericLessonData(theme: string, content: { description: string; keywords: string[]; resources: string[] }): ThemeLessonData {
  const keywords = content.keywords.filter((word) => word.length > 2).slice(0, 7);
  return {
    objectives: [
      `Identify and name key words related to “${theme}”`,
      `Talk about ${theme} using simple complete sentences`,
      `Respond to simple questions about ${theme}`,
      `Complete a ${theme} activity or worksheet with support`,
    ],
    vocabulary: keywords.length >= 3 ? keywords : [`${theme}`, "look", "name", "match", "say", "listen"],
    assessment: [
      `Name one thing you learned about ${theme} today`,
      `Point to the picture and say the word`,
      `Answer one question about ${theme}`,
    ],
    homework: `Talk about “${theme}” with your family tonight — one new word you learned and one question you still have.`,
  };
}

// ──────────────────────────────────────────────────────────────
// Structured kit builder
// ──────────────────────────────────────────────────────────────

// Prepared instructional content used when no printable resource
// scores high enough for a sequence step — the kit stays teachable
// without suggesting a weak, off-topic file.
const COMPONENT_FALLBACK_INSTRUCTION: Partial<Record<KitComponent, (theme: string) => string>> = {
  "warm-up": (theme) => `No printable found for “${theme}”. Run a picture warm-up instead: draw or show anything connected to ${theme}, ask “What do you see?”, collect a few ideas on the board, and echo the key words together.`,
  explanation: (theme) => `No printable found for “${theme}”. Introduce the key words orally: say each word clearly, point to the object or a drawing, and have children echo it back before moving on.`,
  story: (theme) => `No story card found for “${theme}”. Tell a simple two-minute story about ${theme} yourself: introduce the characters, repeat the key words, pause to ask “What happens next?”, and end with one-line moral or rhyme.`,
  "picture-talk": (theme) => `No picture card found for “${theme}”. Draw a simple scene on the board and ask “What can you see? What is happening?”, encouraging full sentences with the key words.`,
  "classroom-activity": (theme) => `No matching activity found for “${theme}”. Play “find the pair”: write key words on the board, call them out one at a time, and have children point to or collect matching objects or drawings.`,
  worksheet: (theme) => `No worksheet found for “${theme}”. Have children draw and label one thing they learned about ${theme} today, then share it with a partner.`,
  assessment: (theme) => `No assessment printable found for “${theme}”. Ask each child one key question about ${theme}, note confident/emerging/needs-support, and praise every attempt.`,
  flashcards: (theme) => `No flashcards found for “${theme}”. Make quick word cards on the board or paper slips and play “say it and pass it” around the circle.`,
  homework: (theme) => `No homework printable found for “${theme}”. Ask children to find or draw one thing about ${theme} at home and bring it to class tomorrow.`,
};

function fallbackInstruction(component: KitComponent, theme: string): string {
  return COMPONENT_FALLBACK_INSTRUCTION[component]?.(theme) ?? `Explore “${theme}” together: name what you see, use the key words, and share one thing you learned.`;
}

function kitResourceId(component: KitComponent, index: number): string {
  return `${component}-${index}`;
}

export type AssembledKit = {
  title: string;
  resources: TeachingKitResource[];
  content: PrimaryTeachingKitContent;
  plannerActivityIds: string[];
  assessmentIds: string[];
};

export function assembleKit(context: PrimaryTeachingContext): AssembledKit {
  const content = themeContent(context.theme, context.subject);
  const theme = context.theme ?? "My Family";
  const subject = context.subject;
  const level = context.level;
  const lessonData = THEME_LESSON_DATA[theme] ?? buildGenericLessonData(theme, content);

  // 1. Learning objectives
  const objectives: KitLearningObjective[] = lessonData.objectives.map((text, index) => ({
    id: `obj-${index + 1}`,
    text,
    source: "curated",
  }));

  // 2. Vocabulary
  const vocabulary = lessonData.vocabulary.slice(0, 8);

  // 3. Resource matches — pick the best catalogue card per sequence step,
  //    reusing the same theme-scored matcher the rest of Primary uses.
  const usedFileUrls = new Set<string>();
  const matchedForComponent: Partial<Record<KitComponent, PrimaryResource>> = {};
  const sequenceTypes: KitSequenceItemType[] = [
    "warm_up",
    "introduction",
    "story_or_rhyme",
    "picture_talk",
    "classroom_activity",
    "worksheet",
    "assessment",
  ];
  for (const type of sequenceTypes) {
    const component = SEQUENCE_COMPONENT[type];
    const picked = matchResources(context, component, 1, Array.from(usedFileUrls))[0];
    if (picked) {
      matchedForComponent[component] = picked;
      usedFileUrls.add(picked.fileUrl);
    }
  }
  const kitResources: KitResourceItem[] = [];
  for (const component of Object.values(SEQUENCE_COMPONENT)) {
    const resource = matchedForComponent[component];
    if (resource) {
      kitResources.push({
        id: kitResourceId(component, kitResources.length),
        title: resource.title,
        fileUrl: resource.fileUrl,
        thumbnailUrl: resource.thumbnailUrl,
        fileType: resource.fileType,
        category: resource.category,
        usedFor: [],
      });
      continue;
    }
    kitResources.push({
      id: kitResourceId(component, kitResources.length),
      title: `Instructional idea — ${KIT_COMPONENT_LABELS[component]}`,
      instruction: fallbackInstruction(component, theme),
      usedFor: [],
    });
  }
  const resourceIdForComponent = (component: KitComponent): string | null => {
    return kitResources.find((item) => item.id.startsWith(component))?.id ?? null;
  };

  // 4. Teaching sequence — every step links back to ≥1 objective
  //    and to the resource that supports it.
  const sequence: KitSequenceItem[] = [];
  const step = (
    type: KitSequenceItemType,
    title: string,
    instructions: string[],
    duration: number,
    objectiveIds: string[],
  ) => {
    const resourceId = resourceIdForComponent(SEQUENCE_COMPONENT[type]);
    if (resourceId) {
      const item = kitResources.find((entry) => entry.id === resourceId);
      if (item) item.usedFor = [...item.usedFor, title];
    }
    const hasResource = resourceId && kitResources.find((entry) => entry.id === resourceId)?.fileUrl;
    sequence.push({
      id: `step-${sequence.length + 1}`,
      type,
      title,
      instructions,
      duration,
      objectiveIds,
      resourceIds: resourceId ? [resourceId] : [],
      source: hasResource ? "resource" : "curated",
    });
  };

  const vocabList = vocabulary.slice(0, 4).join(", ");
  step("warm_up", `Warm-up — what do we know about ${theme}?`, [
    `Gather children in a circle and ask: “What do you already know about ${theme}?”`,
    "Show a picture related to the theme and invite volunteers to share.",
    "Collect ideas on the board and connect them to the words we will learn today.",
  ], 5, [objectives[0].id]);

  step("introduction", `Introduction — key words for ${theme}`, [
    `Introduce the key words: ${vocabList}.`,
    "Say each word clearly, point to the picture and have children echo it back.",
    "Ask simple questions to check understanding before moving on.",
  ], 8, [objectives[0].id, objectives[1].id]);

  step("story_or_rhyme", `Story time — a short story about ${theme}`, [
    `Tell a short, simple story about ${theme}, using the key words from our introduction.`,
    "Pause to ask “What happens next?” so children predict and listen closely.",
    "End with a one-line moral or rhyme that repeats the theme words.",
  ], 8, [objectives[1].id]);
  step("picture_talk", `Picture talk — name what you see`, [
    "Show a picture related to the theme.",
    "Ask “What can you see? What is happening?” and encourage full sentences.",
    "Point to items and ask children to name them using the key words.",
  ], 7, [objectives[0].id, objectives[2].id]);

  step("classroom_activity", `Classroom activity — practise in pairs`, [
    "Children work in pairs to match the theme words to pictures.",
    "Walk around, praise effort and gently correct pronunciation.",
    "Ask pairs to share one thing they matched with the whole class.",
  ], 10, [objectives[2].id, objectives[3].id]);

  step("worksheet", `Worksheet — guided practice`, [
    "Model the first item on the worksheet together as a class.",
    "Children complete the rest with support, using the key words and pictures.",
    "Quickly check two or three answers aloud and celebrate progress.",
  ], 10, [objectives[0].id, objectives[3].id]);

  step("assessment", `Quick check — oral assessment`, [
    "Ask each child one simple question about the theme.",
    "Note confident, emerging or needs-support on the observation sheet.",
    "Praise every attempt and tell children what they learned today.",
  ], 5, [objectives[0].id, objectives[2].id]);

  // 5. Assessment block
  const assessment: KitAssessmentBlock = {
    type: "oral",
    title: `Oral assessment — ${theme}`,
    questions: lessonData.assessment,
    successCriteria: objectives.map((objective) => objective.text),
    source: "curated",
  };

  // 6. Homework
  const homework = lessonData.homework;

  // 7. Parent update
  const parentUpdate = [
    `Dear Parent, this week in ${level} we are learning about “${theme}” in ${subject}.`,
    `Your child is working towards: ${objectives.slice(0, 3).map((objective) => objective.text.toLowerCase()).join("; ")}.`,
    `We are practising these words at school: ${vocabulary.slice(0, 5).join(", ")}.`,
    `Please help your child with the homework and ask them to share our story and rhyme at home. Thank you for your support!`,
  ].join("\n");

  // Flat resource list kept for backwards compatibility with older
  // clients and the "My Kits" listing. Only printable items are
  // included — instructional fallbacks live in content.resources.
  const resources: TeachingKitResource[] = kitResources.filter((item) => item.fileUrl).map((item) => ({
    id: item.id,
    component: (Object.entries(matchedForComponent).find(([component, resource]) => resource?.fileUrl === item.fileUrl)?.[0] as KitComponent | undefined) ?? "flashcards",
    title: item.title,
    fileUrl: item.fileUrl,
    thumbnailUrl: item.thumbnailUrl,
    fileType: item.fileType as TeachingKitResource["fileType"],
    category: item.category,
  }));

  return {
    title: `${theme} Teaching Kit`,
    resources,
    content: {
      version: 2,
      learningObjectives: objectives,
      vocabulary,
      sequence,
      resources: kitResources,
      assessment,
      homework,
      parentUpdate,
      homeworkSource: "curated",
      parentUpdateSource: "template",
      objectivesSource: "template",
    },
    plannerActivityIds: sequence.map((item) => item.title),
    assessmentIds: assessment.title ? [assessment.title] : [],
  };
}
