import type { PrimaryTeachingContext } from "@/lib/primary-teaching-context";

export const PRIMARY_LEVELS = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"] as const;
export const PRIMARY_LANGUAGES = ["English", "Hindi", "Bilingual"] as const;
export const PRIMARY_SUBJECTS = ["English", "Hindi", "Maths", "EVS", "General Knowledge", "Art & Craft", "Music & Movement", "Physical Education"] as const;

export type ThemeContent = {
  emoji: string;
  description: string;
  keywords: string[];
  resources: string[];
  activities: string[];
  assessments: string[];
};

const THEMES_BY_SUBJECT: Record<string, string[]> = {
  English: ["My Family", "My School", "Animals", "Fruits & Vegetables", "Colours", "Shapes", "My Body", "Seasons & Weather"],
  Hindi: ["मेरा परिवार", "मेरा विद्यालय", "पशु", "फल", "रंग", "ऋतुएँ"],
  Maths: ["Numbers 1-10", "Numbers 11-20", "Shapes", "Patterns", "Counting", "Measurement", "Money", "Time"],
  EVS: ["My Family", "My School", "Plants", "Animals", "My Body", "Seasons & Weather", "Food", "Transport", "Community Helpers", "Water"],
  "General Knowledge": ["Myself", "My Neighbourhood", "Festivals of India", "National Symbols", "Community Helpers", "Transport"],
  "Art & Craft": ["Colours", "Shapes", "Paper Craft", "Drawing & Painting", "Festivals & Celebrations"],
  "Music & Movement": ["Rhymes & Poems", "Action Songs", "Dance & Movement", "Yoga & Mindfulness"],
  "Physical Education": ["Sports & Games", "Gross Motor Skills", "Team Games", "Yoga & Mindfulness"],
};

const LEARNING_AREA_BY_SUBJECT: Record<string, string> = {
  English: "Language & Literacy",
  Hindi: "भाषा (Language)",
  Maths: "Numeracy",
  EVS: "Environmental Studies",
  "General Knowledge": "General Awareness",
  "Art & Craft": "Art & Creativity",
  "Music & Movement": "Music & Movement",
  "Physical Education": "Physical Development",
};

const THEME_CONTENT: Record<string, ThemeContent> = {
  "My Family": {
    emoji: "👨‍👩‍👧‍👦",
    description: "Students will learn about family members, their roles, relationships and the importance of family.",
    keywords: ["family", "home", "house", "myself", "me", "baby"],
    resources: ["My Family", "Family Members", "My Family House", "All About My Family", "Family Story"],
    activities: ["Circle Time", "My Family — Introduction", "Teach & Explore", "Worksheet Time", "Craft Activity", "Wrap Up & Song"],
    assessments: ["My Family Quiz", "Family Members Worksheet", "Oral Assessment — Vocabulary", "Family Skills Checklist", "Exit Ticket — Family"],
  },
  "My School": {
    emoji: "🏫",
    description: "Students will learn about the school, its places, people and routines, and how to be a responsible classmate.",
    keywords: ["school", "classroom", "teacher", "friend", "book", "bag", "desk"],
    resources: ["My School", "School Bag", "School Desk", "School Assembly", "School"],
    activities: ["School Tour", "My School — Introduction", "Places in School", "School Helpers", "Draw My School", "Wrap Up & Song"],
    assessments: ["My School Quiz", "Places in School Worksheet", "Oral Assessment — School Words", "School Routines Checklist", "Exit Ticket — School"],
  },
  Animals: {
    emoji: "🐘",
    description: "Students will explore common animals, their homes, sounds and food, and how to care for living things.",
    keywords: ["animal", "farm", "wild", "sea", "pet", "bird", "zoo"],
    resources: ["Animals", "Farm Animals", "Wild Animals", "Sea Animals", "Animals And Food"],
    activities: ["Animal Circle Time", "Animals — Introduction", "Animal Sounds Game", "Match Animal to Home", "Animal Mask Craft", "Animal Song"],
    assessments: ["Animals Quiz", "Farm & Wild Sort Worksheet", "Oral Assessment — Animal Names", "Animal Care Checklist", "Exit Ticket — Animals"],
  },
  "Fruits & Vegetables": {
    emoji: "🍎",
    description: "Students will identify common fruits and vegetables, their colours, tastes and benefits of eating healthy.",
    keywords: ["fruit", "vegetable", "apple", "banana", "mango", "market", "tomato"],
    resources: ["Fruits", "Fruits Vocabulary", "Vegetables", "Vegetables Vocabulary", "Vegetable Market"],
    activities: ["Fruit Basket Time", "Fruits & Vegetables — Introduction", "Name, Colour & Sort", "Fruit Printing Craft", "Healthy Snack Talk", "Fruit Song"],
    assessments: ["Fruits Quiz", "Fruit or Vegetable Worksheet", "Oral Assessment — Food Words", "Healthy Eating Checklist", "Exit Ticket — Fruits"],
  },
  Colours: {
    emoji: "🎨",
    description: "Students will recognise primary and secondary colours, match them to objects and use them in art and play.",
    keywords: ["colour", "colors", "red", "blue", "green", "yellow", "rainbow", "paint"],
    resources: ["Colours", "Colour Of The Day", "Colour By Letter", "Colour By Number", "Colour By Shape"],
    activities: ["Colour Circle Time", "Colours — Introduction", "Colour Hunt", "Rainbow Craft", "Colour Sorting Game", "Colour Song"],
    assessments: ["Colours Quiz", "Match The Colour Worksheet", "Oral Assessment — Colour Names", "Colour Recognition Checklist", "Exit Ticket — Colours"],
  },
  Shapes: {
    emoji: "🔺",
    description: "Students will recognise basic shapes, describe their sides and corners, and find shapes around them.",
    keywords: ["shape", "circle", "square", "triangle", "rectangle", "pattern"],
    resources: ["Shapes", "Shape Of The Day", "Shapes 1", "Shapes 2 Diwali", "Match The Same Shape"],
    activities: ["Shape Circle Time", "Shapes — Introduction", "Shape Hunt", "Shape Collage Craft", "Shape Sorting Game", "Shape Song"],
    assessments: ["Shapes Quiz", "Match The Shape Worksheet", "Oral Assessment — Shape Names", "Shape Recognition Checklist", "Exit Ticket — Shapes"],
  },
  "Numbers 1-10": {
    emoji: "🔢",
    description: "Students will count, read and write numbers from 1 to 10 and understand what each number means.",
    keywords: ["number", "count", "one", "two", "ten", "counting", "objects"],
    resources: ["Numbers", "Numbers 1 10", "Number Objects", "Count And Match", "Count And Trace"],
    activities: ["Counting Circle Time", "Numbers 1-10 — Introduction", "Count Objects", "Number Hunt", "Number Craft", "Counting Song"],
    assessments: ["Numbers Quiz", "Count And Trace Worksheet", "Oral Assessment — Counting", "Number Recognition Checklist", "Exit Ticket — Numbers"],
  },
  "Numbers 11-20": {
    emoji: "🔢",
    description: "Students will count, read and write numbers from 11 to 20 and begin to count on from 10.",
    keywords: ["number", "count", "eleven", "twenty", "counting", "objects"],
    resources: ["Numbers", "Numbers 11 20", "Number Objects", "Count And Match", "Missing Number Match"],
    activities: ["Counting Circle Time", "Numbers 11-20 — Introduction", "Count On From 10", "Number Order Game", "Number Craft", "Counting Song"],
    assessments: ["Numbers 11-20 Quiz", "Count And Write Worksheet", "Oral Assessment — Counting On", "Number Order Checklist", "Exit Ticket — Numbers"],
  },
  Plants: {
    emoji: "🌱",
    description: "Students will explore plants, their parts, growth and the conditions plants need to live.",
    keywords: ["plant", "tree", "flower", "leaf", "seed", "garden", "vegetable"],
    resources: ["Plants", "Vegetables And Plants", "Fruits And Trees", "Seed", "Garden"],
    activities: ["Plant Circle Time", "Plants — Introduction", "Parts of a Plant", "Grow a Seed Activity", "Leaf Collage Craft", "Plant Song"],
    assessments: ["Plants Quiz", "Parts of a Plant Worksheet", "Oral Assessment — Plant Words", "Plant Care Checklist", "Exit Ticket — Plants"],
  },
  "My Body": {
    emoji: "🧍",
    description: "Students will name body parts, understand their functions and learn healthy habits to care for their bodies.",
    keywords: ["body", "hand", "face", "sense", "myself", "teeth", "wash"],
    resources: ["Body Parts Overview", "Hand", "Wash Hands", "Feelings", "Myself"],
    activities: ["Body Parts Circle Time", "My Body — Introduction", "Point and Say", "Sense Station", "Body Art Craft", "Body Song"],
    assessments: ["My Body Quiz", "Body Parts Worksheet", "Oral Assessment — Body Words", "Hygiene Checklist", "Exit Ticket — My Body"],
  },
  "Seasons & Weather": {
    emoji: "☀️",
    description: "Students will observe daily weather and the four seasons, and connect them to clothes and activities.",
    keywords: ["season", "weather", "rain", "summer", "winter", "spring", "clothes", "watch"],
    resources: ["Seasons", "Seasons Overview", "Seasons And Clothes", "Weather", "Weather Watch"],
    activities: ["Weather Circle Time", "Seasons — Introduction", "Weather Watch", "Dress for the Season", "Season Collage Craft", "Season Song"],
    assessments: ["Seasons Quiz", "Weather Match Worksheet", "Oral Assessment — Weather Words", "Season Clothes Checklist", "Exit Ticket — Weather"],
  },
  Food: {
    emoji: "🍛",
    description: "Students will learn about different foods, where they come from, and the importance of a balanced meal.",
    keywords: ["food", "meal", "milk", "bread", "vegetable", "fruit", "healthy"],
    resources: ["Food", "Food Overview", "Food Vocabulary", "Vegetables", "Fruits"],
    activities: ["Food Circle Time", "Food — Introduction", "Food Groups Sort", "My Plate Craft", "Healthy vs Treats Game", "Food Song"],
    assessments: ["Food Quiz", "Food Groups Worksheet", "Oral Assessment — Food Words", "Healthy Meal Checklist", "Exit Ticket — Food"],
  },
  Transport: {
    emoji: "🚌",
    description: "Students will identify means of transport — road, water and air — and learn road safety basics.",
    keywords: ["transport", "vehicle", "bus", "car", "train", "road", "traffic", "air", "water"],
    resources: ["Transport", "Transport Overview", "Transport Vocabulary", "Traffic Signal", "School Bus"],
    activities: ["Transport Circle Time", "Transport — Introduction", "Land, Water & Air Sort", "Traffic Light Game", "Vehicle Craft", "Transport Song"],
    assessments: ["Transport Quiz", "Land & Air Sort Worksheet", "Oral Assessment — Vehicle Names", "Road Safety Checklist", "Exit Ticket — Transport"],
  },
  "Community Helpers": {
    emoji: "👩‍⚕️",
    description: "Students will learn about people who help us — their roles, tools and how they keep our community safe.",
    keywords: ["community", "helper", "doctor", "police", "fire", "teacher", "market"],
    resources: ["Community Helpers", "Community Helpers Overview", "Community Helpers And Tools", "Community Helpers Vocabulary", "School"],
    activities: ["Helpers Circle Time", "Community Helpers — Introduction", "Match Helper to Tool", "Role Play Corner", "Thank You Card Craft", "Helper Song"],
    assessments: ["Helpers Quiz", "Helper & Tool Worksheet", "Oral Assessment — Helper Names", "Community Awareness Checklist", "Exit Ticket — Helpers"],
  },
  Water: {
    emoji: "💧",
    description: "Students will explore where water comes from, its uses and why saving water matters.",
    keywords: ["water", "river", "rain", "drink", "bottle", "ocean", "sea"],
    resources: ["Water", "Drink Water", "Water Bottle", "Rain", "Seasons"],
    activities: ["Water Circle Time", "Water — Introduction", "Where is Water?", "Water Play Station", "Drop Craft", "Water Song"],
    assessments: ["Water Quiz", "Water Uses Worksheet", "Oral Assessment — Water Words", "Save Water Checklist", "Exit Ticket — Water"],
  },
  "Festivals of India": {
    emoji: "🪔",
    description: "Students will learn about festivals celebrated in India — their customs, colours and ways of celebrating together.",
    keywords: ["festival", "diwali", "holi", "celebration", "eid", "special", "fun"],
    resources: ["Festivals", "Festivals And Celebrations", "Festivals And Special Days", "Festivals 1", "Festival Celebration"],
    activities: ["Festival Circle Time", "Festivals — Introduction", "Festival Stories", "Diya & Rangoli Craft", "Celebration Game", "Festival Song"],
    assessments: ["Festivals Quiz", "Festival Match Worksheet", "Oral Assessment — Festival Names", "Festival Awareness Checklist", "Exit Ticket — Festivals"],
  },
  "Rhymes & Poems": {
    emoji: "🎵",
    description: "Students will learn, recite and act out rhymes and poems, building rhythm, memory and confidence.",
    keywords: ["rhyme", "song", "poem", "action", "sing"],
    resources: ["Rhyme Of The Day", "Action Songs", "Nursery Rhymes", "Poems", "Sing"],
    activities: ["Rhyme Circle Time", "Rhyme of the Day", "Action Rhyme Game", "Rhyme Cards", "Props & Costumes", "Rhyme Performance"],
    assessments: ["Rhyme Quiz", "Recitation Checklist", "Oral Assessment — Rhyme Memory", "Rhythm & Action Checklist", "Exit Ticket — Rhymes"],
  },
  "Patterns": {
    emoji: "🔁",
    description: "Students will identify, copy and create simple repeating patterns with shapes, colours and sounds.",
    keywords: ["pattern", "ab", "abc", "shape", "colour", "line"],
    resources: ["Patterns", "Ab Patterns", "Abc Patterns", "Shape Patterns", "Simple Patterns"],
    activities: ["Pattern Circle Time", "Patterns — Introduction", "Clap-Stomp Patterns", "Pattern Beads Craft", "Pattern Hunt", "Pattern Song"],
    assessments: ["Patterns Quiz", "Copy The Pattern Worksheet", "Oral Assessment — What's Next?", "Pattern Checklist", "Exit Ticket — Patterns"],
  },
  "मेरा परिवार": {
    emoji: "👨‍👩‍👧‍👦",
    description: "बच्चे परिवार के सदस्यों, उनके कामों और रिश्तों के बारे में सीखेंगे।",
    keywords: ["family", "मेरा", "माँ", "पिता"],
    resources: ["My Family", "Family Members", "Family Vocabulary", "All About My Family", "My Family House"],
    activities: ["Circle Time", "मेरा परिवार — परिचय", "Teach & Explore", "Worksheet Time", "Craft Activity", "गीत"],
    assessments: ["परिवार प्रश्नोत्तरी", "परिवार अभ्यास-पत्रिका", "मौखिक मूल्यांकन", "परिवार चेकलिस्ट", "Exit Ticket"],
  },
  "Myself": {
    emoji: "🙋",
    description: "Students will share about themselves — their name, likes, feelings and what makes them special.",
    keywords: ["myself", "me", "feelings", "family", "name"],
    resources: ["Myself", "Feelings", "Feeling Check In", "All About My Family", "Family"],
    activities: ["All About Me Circle Time", "My Name — Introduction", "Feelings Chart", "Self Portrait Craft", "My Likes Game", "Me Song"],
    assessments: ["Myself Quiz", "All About Me Worksheet", "Oral Assessment — Speaking", "Confidence Checklist", "Exit Ticket — Myself"],
  },
  "Counting": {
    emoji: "🔢",
    description: "Students will practise counting objects, one-to-one correspondence and comparing more and less.",
    keywords: ["number", "count", "counting", "match", "objects", "trace"],
    resources: ["Counting", "Count And Match", "Count And Trace", "Count Colour", "Numbers 1 10"],
    activities: ["Counting Circle Time", "Counting — Introduction", "Count the Room", "More or Less Game", "Counting Beads Craft", "Counting Song"],
    assessments: ["Counting Quiz", "Count And Match Worksheet", "Oral Assessment — Counting", "Counting Checklist", "Exit Ticket — Counting"],
  },
};

function buildGenericContent(theme: string): ThemeContent {
  const lower = theme.toLowerCase();
  const keywords = lower
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z\u0900-\u097f0-9]/g, ""))
    .filter((word) => word.length > 2);
  return {
    emoji: "🌸",
    description: `Students will explore “${theme}” through pictures, words, activities and play, building understanding step by step.`,
    keywords: keywords.length ? keywords : ["learn", "match", "vocabulary"],
    resources: [`${theme} Flashcards`, `${theme} Worksheet`, `${theme} Story Cards`, `Vocabulary Cards — ${theme}`, `${theme} Colouring Pages`],
    activities: ["Circle Time", `${theme} — Introduction`, "Teach & Explore", "Practice Time", "Craft Activity", "Wrap Up & Song"],
    assessments: [`${theme} Quiz`, `${theme} Worksheet`, `Oral Assessment — ${theme}`, `${theme} Skills Checklist`, `Exit Ticket — ${theme}`],
  };
}

export function themesForSubject(subject: string): string[] {
  return THEMES_BY_SUBJECT[subject] ?? THEMES_BY_SUBJECT.English;
}

export function learningAreaForSubject(subject: string): string {
  return LEARNING_AREA_BY_SUBJECT[subject] ?? "Language & Literacy";
}

export function themeContent(theme: string | undefined, subject: string): ThemeContent {
  const key = theme?.trim() || "My Family";
  return THEME_CONTENT[key] ?? buildGenericContent(key);
}

export function generatorHref(path: string, context: PrimaryTeachingContext): string {
  const params = new URLSearchParams();
  params.set("workspace", "primary");
  if (context.level) params.set("class", context.level);
  if (context.subject) params.set("subject", context.subject);
  const topic = context.theme || context.topic;
  if (topic) params.set("topic", topic);
  if (context.level) params.set("primary_class", context.level);
  if (context.subject) params.set("primary_subject", context.subject);
  if (context.theme) params.set("primary_theme", context.theme);
  params.set("primary_language", context.language);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export type QuickIdeaKind = "warmup" | "activity" | "oral" | "homework" | "movement";

export function quickIdeaText(kind: QuickIdeaKind, content: ThemeContent, context: PrimaryTeachingContext): string {
  const theme = context.theme ?? "this topic";
  const header = `For your ${context.level} ${context.subject} class on “${theme}”`;
  const activities = content.activities;
  const assessments = content.assessments;
  const resources = content.resources;
  const firstActivity = activities[0] ?? "Circle Time";
  const introActivity = activities[1] ?? firstActivity;
  const craftActivity = activities[4] ?? activities[2] ?? firstActivity;
  const wrapUp = activities[5] ?? "a recap song";
  const oral = assessments.find((item) => /oral|मौखिक/i.test(item)) ?? assessments[0] ?? "a quick oral quiz";
  const homeworkSheet = resources[1] ?? resources[0] ?? theme;
  const movementSong = resources.find((item) => /action|song|rhyme|sing|movement|dance|गीत/i.test(item)) ?? wrapUp;
  switch (kind) {
    case "warmup":
      return `${header}:\n\nWarm-up — start with ${firstActivity}. Show a picture about ${theme}, ask one open question, and invite volunteers to share what they already know.`;
    case "activity":
      return `${header}:\n\nClassroom activity — follow ${introActivity} with ${craftActivity}. Let children work in pairs, then share their work with the class.`;
    case "oral":
      return `${header}:\n\nOral assessment — use ${oral}. Ask each child one simple question and note confident, emerging or needs-support in your records.`;
    case "homework":
      return `${header}:\n\nHomework — send home a ${homeworkSheet} tracing or colouring sheet. Ask children to talk about it with their family and bring it back the next day.`;
    case "movement":
      return `${header}:\n\nMovement break — stand up and move! Use ${movementSong} for a stretch, march or dance round the room, then settle children with calm breathing before the next activity.`;
  }
}

export function subjectsForClass(level: string): string[] {
  if (["Nursery", "LKG", "UKG"].includes(level)) {
    return ["English", "Hindi", "Maths", "General Knowledge", "Art & Craft", "Music & Movement", "Physical Education"];
  }
  return ["English", "Hindi", "Maths", "EVS", "General Knowledge", "Art & Craft", "Music & Movement", "Physical Education"];
}

export function skillsForContext(level: string, subject: string, theme: string | undefined): string[] {
  if (!theme) return [];

  // Standard skills fallback — per-resource skill matching now lives server-side.
  if (subject === "English" || subject === "Hindi") {
    return ["Reading", "Writing", "Speaking", "Listening", "Vocabulary", "Phonics"];
  } else if (subject === "Maths") {
    return ["Counting", "Problem Solving", "Logic", "Spatial Awareness"];
  } else {
    return ["Observation", "Cognitive Skills", "Creativity", "Fine Motor", "Gross Motor"];
  }
}
