export type PresentationOptions = {
  topic: string;
  audience: string;
  slideCount: string;
  language: string;
  style: string;
  tone: string;
  detailLevel: string;
  visualDensity: string;
  notes: string;
  includeSpeakerNotes: boolean;
  includeActivities: boolean;
  includeQuiz: boolean;
  includeImages: boolean;
};

export type PresentationSlide = {
  eyebrow: string;
  title: string;
  points: string[];
  visual: string;
  speakerNote: string;
};

export type PresentationDeck = PresentationOptions & {
  id: string;
  createdAt: string;
  slides: PresentationSlide[];
};

export const PRESENTATION_STORAGE_KEY = "teacher_ai_presentation_dummy_deck";

const sampleSlides: Omit<PresentationSlide, "eyebrow">[] = [
  {
    title: "Opening Question",
    points: ["Start with a relatable classroom prompt", "Connect prior knowledge to the new concept"],
    visual: "Question-led cover",
    speakerNote: "Ask students to share one thing they already know before showing the definition."
  },
  {
    title: "Key Idea",
    points: ["Introduce the main definition in simple language", "Use one example from daily life"],
    visual: "Concept card",
    speakerNote: "Pause after the definition and ask students to restate it in their own words."
  },
  {
    title: "How It Works",
    points: ["Break the process into three steps", "Show cause and effect clearly"],
    visual: "Step diagram",
    speakerNote: "Draw the same flow on the board while students copy the sequence."
  },
  {
    title: "Class Activity",
    points: ["Give a quick pair discussion task", "Ask students to record one observation"],
    visual: "Activity prompt",
    speakerNote: "Give students two minutes to discuss, then invite two responses."
  },
  {
    title: "Check Understanding",
    points: ["Add two short recall questions", "Add one application-based question"],
    visual: "Quiz panel",
    speakerNote: "Use thumbs-up checks before moving to the final summary."
  },
  {
    title: "Summary",
    points: ["Recap the three most important takeaways", "Close with a homework or reflection prompt"],
    visual: "Takeaway board",
    speakerNote: "Ask students to write the most important takeaway in one sentence."
  }
];

export function buildDummyPresentationDeck(options: PresentationOptions): PresentationDeck {
  const targetCount = Math.max(4, Math.min(Number(options.slideCount) || 6, 12));
  const slides = Array.from({ length: targetCount }, (_, index) => {
    const base = sampleSlides[index % sampleSlides.length];
    return {
      ...base,
      eyebrow: `Slide ${index + 1}`,
      title: index === 0 ? options.topic || base.title : base.title,
      points: index === 1 && options.topic
        ? [`Explain ${options.topic} in student-friendly language`, ...base.points.slice(1)]
        : base.points
    };
  });

  if (options.includeQuiz && slides.length > 3) {
    slides[slides.length - 2] = {
      ...slides[slides.length - 2],
      title: "Quick Quiz",
      points: ["One recall question", "One application question", "One exit-ticket prompt"],
      visual: "Quiz panel"
    };
  }

  return {
    ...options,
    id: `dummy-${Date.now()}`,
    createdAt: new Date().toISOString(),
    slides
  };
}

export function savePresentationDeck(deck: PresentationDeck) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRESENTATION_STORAGE_KEY, JSON.stringify(deck));
}

export function loadPresentationDeck(): PresentationDeck | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PRESENTATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) as PresentationDeck : null;
  } catch {
    return null;
  }
}
