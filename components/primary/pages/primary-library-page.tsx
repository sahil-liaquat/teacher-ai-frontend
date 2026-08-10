"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  BookOpen, Printer, Palette, Users, Puzzle, School, ClipboardList,
  Search, ChevronDown, ArrowRight, ChevronRight,
  ChevronLeft, X, Download, Sparkles, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LIBRARY_CATEGORIES, findLibraryCategory, findLibraryType } from "@/lib/primary-library-taxonomy";
import { PRIMARY_RESOURCES, type PrimaryResource } from "@/lib/primary-resource-catalog";
import { usePrimaryTeachingContext, PRIMARY_LEVELS } from "@/lib/primary-teaching-context";
import { subjectsForClass, themesForSubject } from "@/lib/primary-theme-content";

type ResourcesComponent = React.ComponentType<{
  notify: (s: string) => void;
  resourceCategory?: string;
  hideCategoryTabs?: boolean;
}>;

// Mock Count Data & Visual Themes for category grid types
const TYPE_METADATA: Record<string, { count: string; description: string; theme: string; image: string; tag: string }> = {
  // Teaching Resources
  "flashcards": { count: "120+", description: "Visual cards for easy concept building", theme: "blue", image: "/assets/primary/library/lib_flashcards.webp", tag: "Visual Aids" },
  "picture-talk-cards": { count: "80+", description: "Real-life images to spark conversation", theme: "green", image: "/assets/primary/library/lib_picture_talk.webp", tag: "Visual Aids" },
  "story-cards": { count: "60+", description: "Short stories to build language & imagination", theme: "orange", image: "/assets/primary/library/lib_story_cards.webp", tag: "Language" },
  "rhymes": { count: "50+", description: "Fun rhymes to sing and enjoy", theme: "pink", image: "/assets/primary/library/lib_rhymes.webp", tag: "Rhymes & Songs" },
  "action-songs": { count: "30+", description: "Songs with actions for active learning", theme: "purple", image: "/assets/primary/library/lib_action_songs.webp", tag: "Rhymes & Songs" },
  "big-book-pages": { count: "25+", description: "Large, engaging pages for group learning", theme: "teal", image: "/assets/primary/library/lib_big_book_pages.webp", tag: "Visual Aids" },
  "vocabulary-cards": { count: "100+", description: "Key words with images and meanings", theme: "yellow", image: "/assets/primary/library/lib_vocabulary_cards.webp", tag: "Language" },
  "conversation-cards": { count: "40+", description: "Prompts to build speaking and listening", theme: "blue", image: "/assets/primary/library/lib_conversation_cards.webp", tag: "Conversation" },
  "circle-time-prompts": { count: "60+", description: "Questions and ideas for circle discussions", theme: "green", image: "/assets/primary/library/lib_circle_time_prompts.webp", tag: "Circle Time" },
  "calendar-activities": { count: "20+", description: "Daily calendar and routine activities", theme: "red", image: "/assets/primary/library/lib_calendar_activities.webp", tag: "Calendar" },
  
  // Printable Activities
  "worksheets": { count: "150+", description: "Concept practice and writing worksheets", theme: "blue", image: "/assets/illustrations/create-worksheet-header.png", tag: "Worksheets" },
  "colouring-pages": { count: "80+", description: "Fine motor and creativity sheets", theme: "pink", image: "/assets/illustrations/writing-assistant-header.png", tag: "Coloring" },
  "tracing-sheets": { count: "60+", description: "Pre-writing and handwriting templates", theme: "green", image: "/assets/illustrations/lesson-plan-format.png", tag: "Tracing" },
  "matching-activities": { count: "45+", description: "Cognitive and classification tasks", theme: "purple", image: "/assets/illustrations/saved-resources-header.png", tag: "Sorting" },
  "cut-paste-activities": { count: "30+", description: "Scissors skills and glue assembly crafts", theme: "orange", image: "/assets/illustrations/live-quiz-header.png", tag: "Coloring" },
  "dot-to-dot": { count: "25+", description: "Number sequencing and coloring", theme: "yellow", image: "/assets/illustrations/classroom-tools-header.png", tag: "Puzzles" },
  "mazes": { count: "30+", description: "Spatial awareness and problem solving", theme: "teal", image: "/assets/illustrations/live-quiz-header.png", tag: "Puzzles" },
  "pattern-worksheets": { count: "35+", description: "Sequencing and pattern recognition", theme: "blue", image: "/assets/illustrations/create-worksheet-header.png", tag: "Worksheets" },
  "sorting-sheets": { count: "40+", description: "Categorizing items by attributes", theme: "purple", image: "/assets/illustrations/saved-resources-header.png", tag: "Sorting" },
  "puzzles": { count: "20+", description: "Brain teasers and shape puzzles", theme: "red", image: "/assets/illustrations/classroom-tools-header.png", tag: "Puzzles" },
};

const THEME_STYLES: Record<string, { bg: string; border: string; text: string; buttonBg: string; buttonHover: string; badge: string }> = {
  blue: { bg: "bg-[#f4f7ff]/90", border: "border-[#e0ebff]", text: "text-[#2563eb]", buttonBg: "bg-[#2563eb]/10", buttonHover: "hover:bg-[#2563eb]/15", badge: "bg-[#f4f7ff] text-[#2563eb] border-[#dbe6ff]" },
  green: { bg: "bg-[#f3faf6]/90", border: "border-[#dbf2e3]", text: "text-[#10b981]", buttonBg: "bg-[#10b981]/10", buttonHover: "hover:bg-[#10b981]/15", badge: "bg-[#f3faf6] text-[#10b981] border-[#d1f0db]" },
  orange: { bg: "bg-[#fffcf7]/90", border: "border-[#ffeecd]", text: "text-[#f59e0b]", buttonBg: "bg-[#f59e0b]/10", buttonHover: "hover:bg-[#f59e0b]/15", badge: "bg-[#fffcf7] text-[#f59e0b] border-[#ffe8b5]" },
  pink: { bg: "bg-[#fff5f6]/90", border: "border-[#ffd3d8]", text: "text-[#ec4899]", buttonBg: "bg-[#ec4899]/10", buttonHover: "hover:bg-[#ec4899]/15", badge: "bg-[#fff5f6] text-[#ec4899] border-[#ffc2c9]" },
  purple: { bg: "bg-[#f7f6ff]/90", border: "border-[#e6e2ff]", text: "text-[#8b5cf6]", buttonBg: "bg-[#8b5cf6]/10", buttonHover: "hover:bg-[#8b5cf6]/15", badge: "bg-[#f7f6ff] text-[#8b5cf6] border-[#dfd9ff]" },
  teal: { bg: "bg-[#f3fafb]/90", border: "border-[#d8f3f5]", text: "text-[#14b8a6]", buttonBg: "bg-[#14b8a6]/10", buttonHover: "hover:bg-[#14b8a6]/15", badge: "bg-[#f3fafb] text-[#14b8a6] border-[#cdf0f2]" },
  yellow: { bg: "bg-[#fffbf2]/90", border: "border-[#ffefc9]", text: "text-[#d97706]", buttonBg: "bg-[#d97706]/10", buttonHover: "hover:bg-[#d97706]/15", badge: "bg-[#fffbf2] text-[#d97706] border-[#ffe7ad]" },
  red: { bg: "bg-[#fff5f5]/90", border: "border-[#ffd4d4]", text: "text-[#ef4444]", buttonBg: "bg-[#ef4444]/10", buttonHover: "hover:bg-[#ef4444]/15", badge: "bg-[#fff5f5] text-[#ef4444] border-[#ffc2c2]" },
};

// 3D Visual illustrations for category cards (matching mockup aesthetics)
const CATEGORY_IMAGES: Record<string, string> = {
  "teaching-resources": "/assets/primary/library/cat_teaching_resources.jpg",
  "printable-activities": "/assets/primary/library/cat_printable_activities.jpg",
  "creative-corner": "/assets/primary/library/cat_creative_corner.jpg",
  "classroom-activities": "/assets/primary/library/cat_classroom_activities.jpg",
  "skill-based-worksheets": "/assets/primary/library/cat_skill_based.jpg",
  "classroom-resources": "/assets/primary/library/cat_classroom_resources.jpg",
  "assessment-parent-communication": "/assets/primary/library/cat_assessment.jpg",
  "parent-communication": "/assets/primary/library/cat_parent_communication.jpg",
};

// Pastel background colours matching each category's illustration panel
const CATEGORY_BG: Record<string, string> = {
  "teaching-resources":              "#e8e0f8", // lavender
  "printable-activities":            "#fdf6e3", // cream
  "creative-corner":                 "#fce4ec", // rose pink
  "classroom-activities":            "#fef9e4", // warm yellow
  "skill-based-worksheets":          "#e8f5f0", // mint green
  "classroom-resources":             "#fef3d8", // golden yellow
  "assessment-parent-communication": "#e3f0fc", // sky blue
  "parent-communication":            "#fce4ec", // rose pink
};

// Mock Flashcard Sets
const FLASHCARD_SETS = [
  { id: "set-farm-animals", title: "Farm Animals", count: "28 cards", description: "Cow, sheep, goat and more", theme: "green", image: "/assets/primary/library/cow.jpg", category: "Animals" },
  { id: "set-wild-animals", title: "Wild Animals", count: "26 cards", description: "Lion, tiger, elephant and more", theme: "orange", image: "/assets/primary/library/lion.jpg", category: "Animals" },
  { id: "set-fruits", title: "Fruits", count: "21 cards", description: "Apple, banana, orange and more", theme: "pink", image: "/assets/primary/library/apple.jpg", category: "Fruits" },
  { id: "set-vegetables", title: "Vegetables", count: "24 cards", description: "Carrot, potato, tomato and more", theme: "green", image: "/assets/primary/library/carrot.jpg", category: "Vegetables" },
  { id: "set-shapes-colors", title: "Shapes & Colors", count: "18 cards", description: "Circle, square, triangle and more", theme: "purple", image: "/assets/primary/library/shapes.jpg", category: "Shapes & Colors" },
  { id: "set-alphabet-az", title: "Alphabet A-Z", count: "26 cards", description: "A to Z letters with examples", theme: "blue", image: "/assets/illustrations/lesson-plan-card.png", category: "Alphabet" },
  { id: "set-numbers-1-20", title: "Numbers 1-20", count: "20 cards", description: "Numbers with counting objects", theme: "blue", image: "/assets/primary/library/shapes.jpg", category: "Numbers" },
  { id: "set-transport", title: "Transport", count: "22 cards", description: "Car, bus, train, aeroplane and more", theme: "blue", image: "/assets/primary/library/car.jpg", category: "Transport" },
  { id: "set-people-family", title: "People & Family", count: "18 cards", description: "Family, friends, helpers and more", theme: "orange", image: "/assets/primary/library/elephant.jpg", category: "People & Community" },
  { id: "set-my-surroundings", title: "My Surroundings", count: "16 cards", description: "Home, school, park and more", theme: "green", image: "/assets/primary/library/house.jpg", category: "My Surroundings" },
];

export default function PrimaryLibraryPage({
  notify,
}: {
  Resources: ResourcesComponent;
  notify: (s: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { context, updateContext } = usePrimaryTeachingContext();
  
  // URL parameters for navigation
  const activeCategorySlug = searchParams.get("category") || "teaching-resources";
  const activeTypeSlug = searchParams.get("type") || undefined;
  
  // Local UI filters
  const [activeFilterPill, setActiveFilterPill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dropdown States
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  
  // Sub-category Carousel State for Sub-page
  const [activeSubCategory, setActiveSubCategory] = useState("All Flashcards");
  const [selectedSet, setSelectedSet] = useState<{ title: string; category: string } | null>(null);

  // Carousel scroll ref
  const carouselRef = useRef<HTMLDivElement>(null);

  const activeCategory = findLibraryCategory(activeCategorySlug) || LIBRARY_CATEGORIES[0];
  const activeType = activeTypeSlug ? findLibraryType(activeCategorySlug, activeTypeSlug) : undefined;
  
  const subjects = useMemo(() => subjectsForClass(context.level), [context.level]);
  const themes = useMemo(() => themesForSubject(context.subject), [context.subject]);

  // Filters pills based on category
  const filterPills = useMemo(() => {
    if (activeCategorySlug === "teaching-resources") {
      return ["All", "Visual Aids", "Language", "Rhymes & Songs", "Conversation", "Circle Time", "Calendar"];
    } else if (activeCategorySlug === "printable-activities") {
      return ["All", "Worksheets", "Coloring", "Tracing", "Puzzles", "Sorting"];
    }
    return ["All"];
  }, [activeCategorySlug]);

  // Main Categories row navigation handler
  const handleCategoryChange = (slug: string) => {
    setClassDropdownOpen(false);
    setSubjectDropdownOpen(false);
    setThemeDropdownOpen(false);
    setActiveFilterPill("All");
    router.push(`/primary/library?category=${slug}`);
  };

  // Type Card click handler
  const handleTypeClick = (typeSlug: string) => {
    router.push(`/primary/library?category=${activeCategorySlug}&type=${typeSlug}`);
  };

  // Back navigation
  const handleBackToLibrary = () => {
    router.push(`/primary/library?category=${activeCategorySlug}`);
  };

  // Filtered Types for Main Grid
  const filteredTypes = useMemo(() => {
    return activeCategory.types.filter((t) => {
      const meta = TYPE_METADATA[t.slug] || { count: "10+", description: "Coming soon", theme: "blue", tag: "General" };
      
      // Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = t.name.toLowerCase().includes(query) || meta.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Filter by Pill
      if (activeFilterPill !== "All") {
        if (meta.tag !== activeFilterPill) return false;
      }
      
      return true;
    });
  }, [activeCategory, searchQuery, activeFilterPill]);

  // Sub-category Carousel Navigation
  const subCategoryCarouselItems = [
    { title: "All Flashcards", icon: "🎴" },
    { title: "Animals", icon: "🦁" },
    { title: "Alphabet", icon: "🔤" },
    { title: "Numbers", icon: "🔢" },
    { title: "Shapes & Colors", icon: "🟢" },
    { title: "Fruits", icon: "🍎" },
    { title: "Vegetables", icon: "🥕" },
    { title: "Transport", icon: "🚗" },
    { title: "People & Community", icon: "🧑‍⚕️" },
    { title: "My Surroundings", icon: "🏡" },
  ];

  // Filtered Flashcard Sets
  const filteredFlashcardSets = useMemo(() => {
    return FLASHCARD_SETS.filter((set) => {
      // Carousel filter
      if (activeSubCategory !== "All Flashcards" && set.category !== activeSubCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return set.title.toLowerCase().includes(query) || set.description.toLowerCase().includes(query);
      }
      return true;
    });
  }, [activeSubCategory, searchQuery]);

  // Actual catalog items matching selected set
  const selectedSetCatalogResources = useMemo(() => {
    if (!selectedSet) return [];
    const setName = selectedSet.title;
    return PRIMARY_RESOURCES.filter((r) => {
      if (r.category !== "Flashcards" && r.category !== "Vocabulary Cards") return false;
      const searchStr = `${r.title} ${r.keywords.join(" ")} ${r.themes.join(" ")}`.toLowerCase();
      
      if (setName === "Farm Animals") return searchStr.includes("farm") || searchStr.includes("cow") || searchStr.includes("goat") || searchStr.includes("sheep");
      if (setName === "Wild Animals") return searchStr.includes("wild") || searchStr.includes("lion") || searchStr.includes("elephant") || (r.themes.includes("Animals") && !searchStr.includes("farm"));
      if (setName === "Fruits") return searchStr.includes("fruit") || searchStr.includes("apple") || searchStr.includes("banana") || searchStr.includes("grape") || searchStr.includes("mango");
      if (setName === "Vegetables") return searchStr.includes("vegetable") || searchStr.includes("carrot") || searchStr.includes("potato") || searchStr.includes("tomato") || searchStr.includes("onion");
      if (setName === "Shapes & Colors") return searchStr.includes("shape") || searchStr.includes("colour") || searchStr.includes("color") || searchStr.includes("circle") || searchStr.includes("square");
      if (setName === "Alphabet A-Z") return searchStr.includes("alphabet") || searchStr.includes("letter") || r.id.includes("alphabet");
      if (setName === "Numbers 1-20") return searchStr.includes("number") || searchStr.includes("counting") || r.id.includes("number") || searchStr.includes("digit");
      if (setName === "Transport") return searchStr.includes("transport") || searchStr.includes("car") || searchStr.includes("aeroplane") || searchStr.includes("bus") || searchStr.includes("train");
      if (setName === "People & Family") return searchStr.includes("family") || searchStr.includes("people") || searchStr.includes("helper") || searchStr.includes("doctor");
      if (setName === "My Surroundings") return searchStr.includes("surroundings") || searchStr.includes("home") || searchStr.includes("school") || searchStr.includes("park") || searchStr.includes("garden");
      
      return searchStr.includes(setName.toLowerCase());
    });
  }, [selectedSet]);

  const handleCustomizeWithAI = (resource: PrimaryResource) => {
    void updateContext({
      subject: resource.subjects[0] ?? context.subject,
      theme: resource.themes[0] ?? context.theme,
      level: (resource.levels[0] as typeof context.level) ?? context.level,
    });
    notify("Resource details loaded! Customization can be done from the main Dashboard generators. 🎨");
    router.push("/primary");
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const clickHandler = () => {
      setClassDropdownOpen(false);
      setSubjectDropdownOpen(false);
      setThemeDropdownOpen(false);
    };
    window.addEventListener("click", clickHandler);
    return () => window.removeEventListener("click", clickHandler);
  }, []);

  // Carousel scroll handler
  const handleCarouselScroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="primary-workspace-page space-y-7 pb-12 antialiased">
      {/* Header */}
      <div className="primary-page-header relative pb-5 border-b border-[#e8e7fb] overflow-hidden">
        {activeType && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <button onClick={handleBackToLibrary} className="hover:text-slate-600 transition">Library</button>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <button onClick={handleBackToLibrary} className="hover:text-slate-600 transition">{activeCategory.name}</button>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-[#2563eb] font-extrabold">{activeType.name}</span>
          </div>
        )}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#171747]">
              {activeType ? activeType.name : "Library"} {activeType ? "🎴" : "📖"}
            </h2>
            <p className="text-xs font-semibold text-[#596083] mt-1">
              {activeType
                ? "Visual cards to build concepts, vocabulary and early understanding."
                : "Explore NEP-aligned resources for joyful teaching and learning."}
            </p>
          </div>
          {/* Decorative illustration */}
          <div className="hidden sm:flex items-end gap-1 shrink-0 select-none pointer-events-none" aria-hidden>
            <span className="text-4xl">📚</span>
            <span className="text-5xl">✏️</span>
            <span className="text-3xl">🎨</span>
            <span className="text-3xl">🌟</span>
          </div>
        </div>
      </div>

      {/* Library Selector Card */}
      <div className="rounded-2xl border border-[#e8e7fb] bg-white p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Title and Icon Section */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5dff] to-[#5a39eb] text-white shadow-md shadow-[#6e41f5]/15">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#6e41f5] leading-none">Library</p>
            <p className="text-[11px] font-bold text-slate-400 mt-1">Resource Finder</p>
          </div>
        </div>

        {/* Middle: Grid of Selectors */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 flex-1">
          {/* Class */}
          <div className="relative w-full">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Class</span>
              <select
                value={context.level}
                onChange={(e) => void updateContext({ level: e.target.value as any })}
                className="bg-transparent text-xs font-bold text-[#171747] outline-none cursor-pointer w-full pr-5 appearance-none"
              >
                {PRIMARY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Subject */}
          <div className="relative w-full">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Subject</span>
              <select
                value={context.subject || ""}
                onChange={(e) => void updateContext({ subject: e.target.value })}
                className="bg-transparent text-xs font-bold text-[#171747] outline-none cursor-pointer w-full pr-5 appearance-none"
              >
                <option value="">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Theme */}
          <div className="relative w-full">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Theme</span>
              <select
                value={context.theme || ""}
                onChange={(e) => void updateContext({ theme: e.target.value })}
                disabled={themes.length === 0}
                className="bg-transparent text-xs font-bold text-[#171747] outline-none cursor-pointer w-full pr-5 appearance-none disabled:opacity-50"
              >
                <option value="">All Themes</option>
                {themes.map((th) => (
                  <option key={th} value={th}>{th}</option>
                ))}
              </select>
            </div>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Search</span>
              <input
                type="text"
                placeholder={activeType ? `Search ${activeType.name.toLowerCase()}...` : "Search resources..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#171747] outline-none w-full placeholder-slate-400"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="shrink-0 text-slate-400 hover:text-slate-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!activeType ? (
        // -------------------------------------------------------------
        // LEVEL 1: LIBRARY HOME VIEW (IMAGE 1)
        // -------------------------------------------------------------
        <div className="space-y-7">
          {/* Categories Horizontal Selector Row */}
          <div className="relative select-none">
            <div className="flex gap-4 overflow-x-auto pt-3.5 pb-6 px-3.5 -mx-3.5 scrollbar-none snap-x snap-mandatory">
              {LIBRARY_CATEGORIES.map((cat) => {
                const isSelected = cat.slug === activeCategorySlug;
                const imgPath = CATEGORY_IMAGES[cat.slug] || "/landing/backpack-globe.png";
                const bgColor = CATEGORY_BG[cat.slug] || "#f0f4ff";
                return (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className="flex flex-col items-center gap-2.5 snap-start shrink-0 group active:scale-95 transition-all duration-300 ease-out"
                  >
                    {/* Card — pastel bg + image fills it completely, just like the source illustration panels */}
                    <div
                      className={cn(
                        "primary-library-category-card w-[9rem] h-[12rem] rounded-[24px] overflow-hidden transition-all duration-300",
                        isSelected
                          ? "shadow-[0_12px_28px_rgba(37,99,235,0.22)] ring-[3px] ring-blue-500 scale-105"
                          : "shadow-[0_4px_14px_rgba(0,0,0,0.07)] hover:shadow-[0_10px_24px_rgba(37,99,235,0.13)] hover:-translate-y-1"
                      )}
                      style={{ backgroundColor: bgColor }}
                    >
                      <img
                        src={imgPath}
                        alt={cat.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300 ease-out"
                      />
                    </div>

                    {/* Label — below the card */}
                    <span className={cn(
                      "text-xs font-black leading-snug tracking-tight text-center max-w-[9rem] transition-colors duration-300",
                      isSelected ? "text-blue-600" : "text-[#12346b] group-hover:text-blue-500"
                    )}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Filters and Types List */}
          <div className="space-y-6">
            {/* Category Description Subheading */}
            <div className="space-y-1">
              <h2 className="text-[22px] font-black text-[#12346b] tracking-tight">
                {activeCategory.name}
              </h2>
              <p className="text-xs font-semibold text-slate-400 leading-normal">
                {activeCategorySlug === "teaching-resources" && "Resources used while teaching in the classroom."}
                {activeCategorySlug === "printable-activities" && "High-quality printouts for classroom practice and writing."}
                {activeCategorySlug === "creative-corner" && "Hands-on creative and artistic activities for motor development."}
                {activeCategorySlug === "classroom-activities" && "Teacher-led play, games, and active movement."}
                {activeCategorySlug === "skill-based-worksheets" && "Targeted worksheets for developmental skills."}
                {activeCategorySlug === "classroom-resources" && "Materials for classroom display boards and labels."}
                {activeCategorySlug === "assessment-parent-communication" && "Assessment trackers and communication sheets."}
              </p>
            </div>

            {/* Pills Sub-filters & Sort Selection row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              {/* Pill Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                {filterPills.map((pill) => {
                  const isActive = pill === activeFilterPill;
                  return (
                    <button
                      key={pill}
                      onClick={() => setActiveFilterPill(pill)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200",
                        isActive
                          ? "bg-[#2563eb] text-white shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
                          : "border border-slate-200/60 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                      )}
                    >
                      {pill}
                    </button>
                  );
                })}
              </div>

              {/* Sorting Selection dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">Sort by:</span>
                <button className="flex h-8.5 items-center gap-1 rounded-lg border border-slate-200/60 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  <span>Most Relevant</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Grid of Resource Type Cards */}
            {filteredTypes.length > 0 ? (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredTypes.map((t) => {
                  const meta = TYPE_METADATA[t.slug] || {
                    count: "15+",
                    description: "High-quality educational activities and resources.",
                    theme: "blue",
                    image: "/assets/illustrations/lesson-plan-card.png",
                    tag: "General",
                  };
                  const styles = THEME_STYLES[meta.theme] || THEME_STYLES.blue;

                  return (
                    <div
                      key={t.slug}
                      onClick={() => handleTypeClick(t.slug)}
                      className={cn(
                        "group flex flex-col overflow-hidden rounded-[24px] border p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.05)] cursor-pointer bg-white",
                        styles.bg, styles.border
                      )}
                    >
                      {/* Clipart and Badge Header */}
                      <div className="relative flex h-52 w-full items-center justify-center rounded-[18px] bg-white/40 border border-white/50 shadow-[0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden">
                        {/* Count Badge */}
                        <span className={cn("absolute right-2.5 top-2.5 rounded-full border px-2 py-0.5 text-[9px] font-black shadow-xs z-10 bg-white/95 backdrop-blur-xs", styles.badge)}>
                          {meta.count}
                        </span>
                        
                        {/* Image Clipart */}
                        <img
                          src={meta.image}
                          alt={t.name}
                          className="h-full w-full object-contain p-3 group-hover:scale-108 transition-all duration-500 ease-out"
                        />
                      </div>

                      {/* Title only */}
                      <h3 className="text-xs font-black text-[#12346b] text-center mt-2.5 px-1 leading-snug group-hover:text-blue-600 transition-colors">
                        {t.name}
                      </h3>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/40 p-12 text-center">
                <p className="text-xs font-bold text-slate-400">No resource types match your search or filter pills.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // -------------------------------------------------------------
        // LEVEL 2: DRILLDOWN SUB-PAGE VIEW (IMAGE 2)
        // -------------------------------------------------------------
        <div className="space-y-7">
          {/* Sub-Category Carousel Slider (Horizontal capsule list) */}
          <div className="relative flex items-center border-b border-slate-100 pb-5">
            {/* Scroll Left chevron */}
            <button
              onClick={() => handleCarouselScroll("left")}
              className="absolute left-0 z-10 grid h-8.5 w-8.5 place-items-center rounded-full border border-slate-100 bg-white shadow-md text-slate-400 hover:text-slate-600 transition"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>

            <div
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto scrollbar-none px-10 w-full snap-x snap-mandatory"
            >
              {subCategoryCarouselItems.map((item) => {
                const isSelected = activeSubCategory === item.title;
                return (
                  <button
                    key={item.title}
                    onClick={() => setActiveSubCategory(item.title)}
                    className={cn(
                      "flex flex-col items-center justify-center w-24 h-[90px] rounded-[20px] border transition-all duration-300 snap-start shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]",
                      isSelected
                        ? "border-[#2563eb] bg-white text-[#2563eb] shadow-[0_6px_16px_rgba(37,99,235,0.06)] ring-3 ring-[#2563eb]/5"
                        : "border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                    )}
                  >
                    <span className="text-2.5xl mb-1 filter drop-shadow-xs select-none">{item.icon}</span>
                    <span className="text-[10px] font-black text-center px-1 truncate w-full">{item.title}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Scroll Right chevron */}
            <button
              onClick={() => handleCarouselScroll("right")}
              className="absolute right-0 z-10 grid h-8.5 w-8.5 place-items-center rounded-full border border-slate-100 bg-white shadow-md text-slate-400 hover:text-slate-600 transition"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Cards Sub-Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#12346b] tracking-tight">
                  {activeSubCategory}
                </h2>
                <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 shadow-xs">
                  {filteredFlashcardSets.length} sets
                </span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">Sort by:</span>
                <button className="flex h-8.5 items-center gap-1 rounded-lg border border-slate-200/60 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  <span>Most Relevant</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
              </div>
            </div>

            {filteredFlashcardSets.length > 0 ? (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredFlashcardSets.map((set) => {
                  const styles = THEME_STYLES[set.theme] || THEME_STYLES.blue;
                  return (
                    <div
                      key={set.id}
                      onClick={() => setSelectedSet({ title: set.title, category: set.category })}
                      className={cn(
                        "group flex flex-col justify-between overflow-hidden rounded-[24px] border p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.05)] bg-white cursor-pointer",
                        styles.bg, styles.border
                      )}
                    >
                      <div className="space-y-4">
                        {/* Image area with badge inside white block */}
                        <div className="relative flex h-32 w-full items-center justify-center rounded-[20px] bg-white border border-slate-100/50 shadow-[0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden">
                          <span className={cn("absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-xs", styles.badge)}>
                            {set.count}
                          </span>
                          <img
                            src={set.image}
                            alt={set.title}
                            className="h-20 w-20 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)] group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Title and details */}
                        <div className="space-y-1 px-1">
                          <h3 className="text-sm font-black text-[#12346b] leading-tight group-hover:text-blue-600 transition-colors">
                            {set.title}
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-400 leading-relaxed line-clamp-2">
                            {set.description}
                          </p>
                        </div>
                      </div>

                      {/* View button pill */}
                      <div className="mt-4 pt-1">
                        <span className={cn(
                          "flex items-center justify-center gap-1 w-full text-center py-2.5 rounded-xl text-xs font-black transition-all duration-200",
                          styles.buttonBg, styles.text, styles.buttonHover
                        )}>
                          <span>View cards</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/40 p-12 text-center">
                <p className="text-xs font-bold text-slate-400">No card sets match this filter.</p>
              </div>
            )}
          </div>

          
        </div>
      )}

      {/* Modal Dialog for View Cards */}
      {selectedSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="primary-library-modal relative flex flex-col w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="primary-library-modal-header flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-[#12346b] flex items-center gap-1.5">
                  <span>{selectedSet.title} {activeType?.name || "Cards"}</span>
                  <span className="rounded-full bg-blue-50 border border-blue-200/50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                    {selectedSetCatalogResources.length} sets available
                  </span>
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                   NEP-aligned curriculum resources. Click to download or customize with AI.
                </p>
              </div>
              <button
                onClick={() => setSelectedSet(null)}
                className="grid h-8.5 w-8.5 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Catalog Grid Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/10">
              {selectedSetCatalogResources.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {selectedSetCatalogResources.map((res) => (
                    <div
                      key={res.id}
                      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="space-y-3.5">
                        {/* File preview */}
                        <div className="relative flex h-36 w-full items-center justify-center rounded-xl bg-slate-50 overflow-hidden border border-slate-50/80">
                          {res.thumbnailUrl ? (
                            <img
                              src={res.thumbnailUrl}
                              alt={res.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-300">
                              <BookOpen className="h-10 w-10 stroke-[1.5]" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">No Preview</span>
                            </div>
                          )}
                          <span className="absolute left-2 top-2 rounded-md bg-slate-900/60 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide text-white">
                            {res.fileType}
                          </span>
                        </div>

                        {/* Title and skills tags */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold text-[#12346b] line-clamp-2 leading-tight">
                            {res.title}
                          </h4>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1">
                            {res.skills.slice(0, 2).map((skill) => (
                              <span key={skill} className="rounded bg-slate-100 px-1.5 py-0.5 text-[8.5px] font-bold text-slate-500">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card actions */}
                      <div className="mt-4 pt-3.5 border-t border-slate-50 flex gap-2">
                        {/* Download button */}
                        <a
                          href={res.fileUrl}
                          download
                          onClick={() => notify(`Downloading “${res.title}” 💾`)}
                          className="flex flex-1 items-center justify-center gap-1.5 h-8.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10.5px] font-bold text-slate-600 transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </a>

                        {/* Edit with AI button */}
                        <button
                          onClick={() => {
                            setSelectedSet(null);
                            handleCustomizeWithAI(res);
                          }}
                          className="flex flex-1 items-center justify-center gap-1 h-8.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-[10.5px] font-bold text-white transition shadow-sm"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Customize AI</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50/50 flex items-center justify-center text-blue-500 mb-3.5">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-[#12346b]">{selectedSet.title} {activeType?.name || "Cards"}</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1 max-w-sm">
                    We don&apos;t have pre-made resources in the catalog matching this exact set yet. Let&apos;s create a customized set with AI!
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSet(null);
                      notify("Topic selected! Custom generation can be started from the main Dashboard generators. 🎨");
                      router.push("/primary");
                    }}
                    className="mt-5 flex items-center gap-1.5 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition shadow-md shadow-blue-500/20"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate custom {selectedSet.title} with AI</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
