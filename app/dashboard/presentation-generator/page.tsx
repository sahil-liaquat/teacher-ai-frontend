"use client";

import { useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  FileText,
  Images,
  LayoutTemplate,
  ListChecks,
  MonitorPlay,
  Presentation,
  Sparkles,
  WandSparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { buildDummyPresentationDeck, savePresentationDeck, type PresentationOptions } from "@/lib/presentation-generator";
import { cn } from "@/lib/utils";

const slideCountOptions = ["6", "8", "10", "12"];
const languageOptions = ["English", "Hindi", "Urdu"];
const styleOptions = ["Clean classroom", "Visual story", "Activity based", "Exam revision"];
const audienceOptions = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const toneOptions = ["Simple", "Conversational", "Academic", "Revision focused"];
const detailOptions = ["Brief", "Balanced", "Detailed"];
const visualOptions = ["Light visuals", "Balanced visuals", "Image rich"];

export default function PresentationGeneratorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [topic, setTopic] = useState("Photosynthesis");
  const [audience, setAudience] = useState("Class 8");
  const [slideCount, setSlideCount] = useState("8");
  const [language, setLanguage] = useState("English");
  const [style, setStyle] = useState("Clean classroom");
  const [tone, setTone] = useState("Simple");
  const [detailLevel, setDetailLevel] = useState("Balanced");
  const [visualDensity, setVisualDensity] = useState("Balanced visuals");
  const [notes, setNotes] = useState("");
  const [includeSpeakerNotes, setIncludeSpeakerNotes] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [includeImages, setIncludeImages] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(true);

  const canGenerate = topic.trim().length > 2;

  function generateDummyDeck() {
    if (!canGenerate) {
      toast({ title: "Add a topic", description: "Enter a topic before creating the preview." });
      return;
    }
    const options: PresentationOptions = {
      topic: topic.trim(),
      audience,
      slideCount,
      language,
      style,
      tone,
      detailLevel,
      visualDensity,
      notes: notes.trim(),
      includeSpeakerNotes,
      includeActivities,
      includeQuiz,
      includeImages
    };
    savePresentationDeck(buildDummyPresentationDeck(options));
    toast({ title: "Dummy presentation ready", description: "Opening the output page." });
    router.push("/dashboard/presentation-generator/output");
  }

  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="overflow-hidden rounded-[18px] border border-[#ffd9de] bg-white shadow-[0_14px_34px_rgba(30,80,90,0.08)]">
        <header className="relative min-h-[186px] border-b border-[#ffd9de] bg-gradient-to-br from-[#fff7f8] via-white to-[#ffd9de]/70 px-5 py-6 sm:px-6">
          <div className="relative z-10 max-w-[620px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ffd9de] bg-white/80 px-3 py-1.5 text-xs font-black text-[#eb3b5a] shadow-sm">
              <Presentation className="h-4 w-4" /> Presentation Generator
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-teachpad-ink sm:text-[34px]">
              Create classroom slides
            </h1>
            <p className="mt-2.5 max-w-[560px] text-sm font-semibold leading-6 text-teachpad-muted">
              Add a few details and customize the deck style. The generated dummy output opens on the next page.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill icon={MonitorPlay}>Next-page output</Pill>
              <Pill icon={LayoutTemplate}>Full-view deck</Pill>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] overflow-hidden lg:block">
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white to-transparent" />
            <div className="absolute right-8 top-1/2 grid h-[150px] w-[250px] -translate-y-1/2 place-items-center rounded-[22px] border border-[#ffd9de] bg-white/88 shadow-[0_24px_45px_rgba(235,59,90,0.10)]">
              <div className="h-[106px] w-[188px] rounded-[16px] border border-[#ffd9de] bg-gradient-to-br from-white via-[#fff7f8] to-[#ffd9de] p-4 text-[#eb3b5a]">
                <Presentation className="h-7 w-7" />
                <div className="mt-5 h-2 w-28 rounded-full bg-[#eb3b5a]/35" />
                <div className="mt-2 h-2 w-20 rounded-full bg-[#eb3b5a]/20" />
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-4 p-4 sm:p-5">
          <NumericSection number="1" title="Deck Setup" subtitle="Only the essentials teachers need first.">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldBox label="Topic" required className="md:col-span-2">
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Photosynthesis" maxLength={120} className="focus:border-[#eb3b5a] focus:ring-[#ffd9de]" />
              </FieldBox>
              <FieldBox label="Class / Grade">
                <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
                  {audienceOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Slides">
                <Select value={slideCount} onChange={(e) => setSlideCount(e.target.value)}>
                  {slideCountOptions.map((item) => <option key={item} value={item}>{item} slides</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Language">
                <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {languageOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Deck Style">
                <Select value={style} onChange={(e) => setStyle(e.target.value)}>
                  {styleOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
            </div>
          </NumericSection>

          <NumericSection
            number="2"
            title="Customization"
            subtitle="Choose how the presentation should feel and what it should include."
            expandable
            open={customizeOpen}
            onToggle={() => setCustomizeOpen((open) => !open)}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <FieldBox label="Tone">
                <Select value={tone} onChange={(e) => setTone(e.target.value)}>
                  {toneOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Detail Level">
                <Select value={detailLevel} onChange={(e) => setDetailLevel(e.target.value)}>
                  {detailOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
              <FieldBox label="Visual Density">
                <Select value={visualDensity} onChange={(e) => setVisualDensity(e.target.value)}>
                  {visualOptions.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </FieldBox>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ToggleCard active={includeSpeakerNotes} onClick={() => setIncludeSpeakerNotes((value) => !value)} icon={FileText} title="Speaker notes" />
              <ToggleCard active={includeActivities} onClick={() => setIncludeActivities((value) => !value)} icon={Sparkles} title="Activities" />
              <ToggleCard active={includeQuiz} onClick={() => setIncludeQuiz((value) => !value)} icon={ListChecks} title="Quick quiz" />
              <ToggleCard active={includeImages} onClick={() => setIncludeImages((value) => !value)} icon={Images} title="Image prompts" />
            </div>
            <div className="mt-4">
              <FieldBox label="Focus or instructions">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Keep text short, add one classroom example, and include a recap slide."
                  rows={4}
                  maxLength={360}
                  className="focus:border-[#eb3b5a] focus:ring-[#ffd9de]"
                />
              </FieldBox>
            </div>
          </NumericSection>

          <div className="rounded-xl border border-[#ffd9de] bg-[#fff7f8] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-base font-black text-teachpad-ink">Generate presentation output</p>
                <p className="mt-1 text-sm font-semibold text-teachpad-muted">
                  {topic ? `${audience} - ${topic} - ${slideCount} slides - ${tone}` : "Add a topic to preview the deck."}
                </p>
              </div>
              <Button type="button" disabled={!canGenerate} onClick={generateDummyDeck} className="bg-gradient-to-r from-[#eb3b5a] to-[#ff6f86] shadow-[0_14px_28px_rgba(235,59,90,0.18)] hover:shadow-[0_18px_36px_rgba(235,59,90,0.20)] sm:min-w-[220px]">
                <WandSparkles className="h-5 w-5" />
                Generate Preview
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ icon: Icon, children }: { icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#ffd9de] bg-white/80 px-3 py-1.5 text-xs font-black text-[#eb3b5a]">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

function NumericSection({
  number,
  title,
  subtitle,
  children,
  expandable = false,
  open = true,
  onToggle
}: {
  number: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  expandable?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#ffd9de] bg-white shadow-[0_10px_24px_rgba(30,80,90,0.04)]">
      <div className="flex items-start justify-between gap-3 p-4">
        <button type="button" onClick={expandable ? onToggle : undefined} className="flex min-w-0 flex-1 items-start gap-3 text-left" aria-expanded={expandable ? open : undefined}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ffd9de] text-base font-black text-[#eb3b5a]">{number}</span>
          <span>
            <span className="block text-base font-black text-teachpad-ink">{title}</span>
            <span className="block text-sm font-semibold text-teachpad-muted">{subtitle}</span>
          </span>
        </button>
        {expandable ? (
          <button type="button" onClick={onToggle} aria-label={`${open ? "Collapse" : "Expand"} ${title}`} className="grid h-9 w-9 place-items-center rounded-full border border-[#ffd9de] bg-white text-[#eb3b5a] shadow-sm transition hover:bg-[#fff7f8]">
            <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", open && "rotate-180")} />
          </button>
        ) : null}
      </div>
      <div className={cn("grid transition-all duration-300 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function FieldBox({ label, required, children, className }: { label: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={cn("grid min-w-0 gap-2", className)}>
      <span className="truncate text-sm font-black text-teachpad-ink">
        {label} {required && <span className="text-[#eb3b5a]">*</span>}
      </span>
      {children}
    </label>
  );
}

function ToggleCard({ active, onClick, icon: Icon, title }: { active: boolean; onClick: () => void; icon: ComponentType<{ className?: string }>; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-[58px] items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200",
        active ? "border-[#ffd9de] bg-[#fff7f8] text-[#eb3b5a] shadow-[0_10px_20px_rgba(235,59,90,0.06)]" : "border-[#eceef3] bg-white text-teachpad-muted hover:border-[#ffd9de]"
      )}
    >
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", active ? "bg-[#ffd9de] text-[#eb3b5a]" : "bg-teachpad-tag text-teachpad-muted")}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-black">{title}</span>
      <span className={cn("ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs font-black", active ? "border-[#eb3b5a] bg-[#eb3b5a] text-white" : "border-[#ffd9de] text-transparent")}>✓</span>
    </button>
  );
}
