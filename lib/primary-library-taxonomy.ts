// Category → Resource Type taxonomy for the Primary Library's 3-level navigation:
// Library (7 categories) → Resource Type cards → Resource Library (search/filter/grid).
//
// `catalogCategory` links a resource type to the real `PrimaryResource.category`
// string it should show — only 10 of the ~70 types below have resources in the
// catalogue today (served from the backend, GET /primary/resources). Types
// without one render a "coming soon" empty state instead of an empty grid, so
// the navigation can be built out ahead of content without ever looking broken.

export type LibraryResourceType = {
  slug: string;
  name: string;
  catalogCategory?: string;
};

export type LibraryCategory = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  gradient: string;
  iconBg: string;
  types: LibraryResourceType[];
};

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  {
    slug: "teaching-resources",
    name: "Teaching Resources",
    description: "Resources used while teaching.",
    emoji: "📖",
    gradient: "from-blue-50/60 to-indigo-100/20 hover:border-blue-200",
    iconBg: "bg-blue-50 text-blue-600 ring-blue-100",
    types: [
      { slug: "flashcards", name: "Flashcards", catalogCategory: "Flashcards" },
      { slug: "picture-talk-cards", name: "Picture Talk Cards", catalogCategory: "Picture Talk Cards" },
      { slug: "story-cards", name: "Story Cards", catalogCategory: "Story Cards" },
      { slug: "rhymes", name: "Rhymes" },
      { slug: "action-songs", name: "Action Songs" },
      { slug: "big-book-pages", name: "Big Book Pages" },
      { slug: "vocabulary-cards", name: "Vocabulary Cards", catalogCategory: "Vocabulary Cards" },
      { slug: "conversation-cards", name: "Conversation Cards" },
      { slug: "circle-time-prompts", name: "Circle Time Prompts", catalogCategory: "Circle Time Prompts" },
      { slug: "calendar-activities", name: "Calendar Activities", catalogCategory: "Calendar Activities" },
    ],
  },
  {
    slug: "printable-activities",
    name: "Printable Activities",
    description: "Printable learning material.",
    emoji: "📝",
    gradient: "from-amber-50/60 to-orange-100/20 hover:border-amber-200",
    iconBg: "bg-amber-50 text-amber-600 ring-amber-100",
    types: [
      { slug: "worksheets", name: "Worksheets", catalogCategory: "Worksheets" },
      { slug: "colouring-pages", name: "Colouring Pages", catalogCategory: "Colouring Pages" },
      { slug: "tracing-sheets", name: "Tracing Sheets", catalogCategory: "Tracing Sheets" },
      { slug: "matching-activities", name: "Matching Activities", catalogCategory: "Matching Activities" },
      { slug: "cut-paste-activities", name: "Cut & Paste Activities" },
      { slug: "dot-to-dot", name: "Dot-to-Dot" },
      { slug: "mazes", name: "Mazes" },
      { slug: "pattern-worksheets", name: "Pattern Worksheets" },
      { slug: "sorting-sheets", name: "Sorting Sheets" },
      { slug: "puzzles", name: "Puzzles" },
    ],
  },
  {
    slug: "creative-corner",
    name: "Creative Corner",
    description: "Hands-on creative resources.",
    emoji: "🎨",
    gradient: "from-rose-50/60 to-pink-100/20 hover:border-rose-200",
    iconBg: "bg-rose-50 text-rose-600 ring-rose-100",
    types: [
      { slug: "craft-templates", name: "Craft Templates" },
      { slug: "paper-folding", name: "Paper Folding" },
      { slug: "clay-activities", name: "Clay Activities" },
      { slug: "finger-painting", name: "Finger Painting" },
      { slug: "thumb-printing", name: "Thumb Printing" },
      { slug: "collage-activities", name: "Collage Activities" },
      { slug: "diy-classroom-projects", name: "DIY Classroom Projects" },
    ],
  },
  {
    slug: "classroom-activities",
    name: "Classroom Activities",
    description: "Teacher-led classroom activities.",
    emoji: "🎭",
    gradient: "from-emerald-50/60 to-teal-100/20 hover:border-emerald-200",
    iconBg: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    types: [
      { slug: "show-and-tell", name: "Show & Tell" },
      { slug: "puppet-talk", name: "Puppet Talk" },
      { slug: "role-play", name: "Role Play" },
      { slug: "sensory-play", name: "Sensory Play" },
      { slug: "block-building", name: "Block Building" },
      { slug: "nature-walk", name: "Nature Walk" },
      { slug: "circle-games", name: "Circle Games" },
      { slug: "dance-activities", name: "Dance Activities" },
      { slug: "yoga", name: "Yoga" },
      { slug: "music-and-movement", name: "Music & Movement" },
    ],
  },
  {
    slug: "skill-based-worksheets",
    name: "Skill-Based Worksheets",
    description: "Worksheets organized by learning outcomes.",
    emoji: "🧠",
    gradient: "from-violet-50/60 to-purple-100/20 hover:border-violet-200",
    iconBg: "bg-violet-50 text-violet-600 ring-violet-100",
    types: [
      { slug: "early-literacy", name: "Early Literacy" },
      { slug: "early-numeracy", name: "Early Numeracy" },
      { slug: "cognitive-skills", name: "Cognitive Skills" },
      { slug: "motor-skills", name: "Motor Skills" },
    ],
  },
  {
    slug: "classroom-resources",
    name: "Classroom Resources",
    description: "Classroom management and decoration resources.",
    emoji: "🏫",
    gradient: "from-sky-50/60 to-cyan-100/20 hover:border-sky-200",
    iconBg: "bg-sky-50 text-sky-600 ring-sky-100",
    types: [
      { slug: "classroom-decorations", name: "Classroom Decorations" },
      { slug: "bulletin-boards", name: "Bulletin Boards" },
      { slug: "name-tags", name: "Name Tags" },
      { slug: "labels", name: "Labels" },
      { slug: "timetable-cards", name: "Timetable Cards" },
      { slug: "birthday-charts", name: "Birthday Charts" },
      { slug: "attendance-charts", name: "Attendance Charts" },
      { slug: "reward-charts", name: "Reward Charts" },
      { slug: "stickers", name: "Stickers" },
      { slug: "certificates", name: "Certificates" },
    ],
  },
  {
    slug: "assessment-parent-communication",
    name: "Assessment & Parent Communication",
    description: "Assessment and parent support resources.",
    emoji: "📋",
    gradient: "from-yellow-50/60 to-lime-100/20 hover:border-yellow-200",
    iconBg: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    types: [
      { slug: "assessment-sheets", name: "Assessment Sheets" },
      { slug: "observation-checklists", name: "Observation Checklists" },
      { slug: "progress-reports", name: "Progress Reports" },
      { slug: "parent-updates", name: "Parent Updates" },
      { slug: "homework-slips", name: "Homework Slips" },
      { slug: "weekly-learning-notes", name: "Weekly Learning Notes" },
    ],
  },
];

export function findLibraryCategory(categorySlug: string): LibraryCategory | undefined {
  return LIBRARY_CATEGORIES.find((c) => c.slug === categorySlug);
}

export function findLibraryType(categorySlug: string, typeSlug: string): LibraryResourceType | undefined {
  return findLibraryCategory(categorySlug)?.types.find((t) => t.slug === typeSlug);
}

/** Reverse lookup used for legacy links that only know the flat catalogue category name (e.g. "Flashcards"). */
export function libraryPathForCatalogCategory(catalogCategory: string): { category: string; type: string } | null {
  for (const category of LIBRARY_CATEGORIES) {
    const type = category.types.find((t) => t.catalogCategory === catalogCategory);
    if (type) return { category: category.slug, type: type.slug };
  }
  return null;
}

const catalogSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Same as `libraryPathForCatalogCategory`, but for legacy routes that only have the old flat slug (e.g. "picture-talk-cards"). */
export function libraryPathForCatalogCategorySlug(slug: string): { category: string; type: string } | null {
  for (const category of LIBRARY_CATEGORIES) {
    const type = category.types.find((t) => t.catalogCategory && catalogSlug(t.catalogCategory) === slug);
    if (type) return { category: category.slug, type: type.slug };
  }
  return null;
}
