"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CURRENT_USER_QUERY_KEY,
  ONBOARDING_BOARD_OPTIONS,
  ONBOARDING_CREATE_FIRST_OPTIONS,
  ONBOARDING_ROLE_OPTIONS,
  getCurrentUser,
  onboardingCreateFirstHref,
  submitOnboarding,
  backendApi,
  type ApiUser
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  ChevronRight,
  GraduationCap,
  Users,
  School,
  MoreHorizontal,
  Presentation,
  BookOpen,
  FileSpreadsheet,
  Award,
  FileText,
  ClipboardList,
  Brain,
  Notebook,
  ArrowLeft,
  ArrowRight,
  Check,
  Activity
} from "lucide-react";

type Step = 0 | 1 | 2 | 3;
const STEP_COUNT = 4;

// Avatar poses mapped to onboarding steps (User's attached assets)
const ONBOARDING_AVATARS: Record<number, string> = {
  0: "/avatars/elif-wave.png",       // Waving hello
  1: "/avatars/elif-books.png",      // Thinking
  2: "/avatars/elif-notebook.png",   // Sitting
  3: "/avatars/elif-celebrate.png"   // Celebrating
};

// Speech bubbles per step
const SPEECH_BUBBLES: Record<number, string> = {
  0: "Hi, teacher! ❤️",
  1: "Which board do you teach? 📚",
  2: "Almost there! 🏫",
  3: "Ready to start? 🎉"
};

// Icon map for Step 1 (Roles)
const ROLE_ICONS: Record<string, any> = {
  school_teacher: GraduationCap,
  tuition_teacher: Presentation,
  school_coordinator: Users,
  principal: School,
  other: MoreHorizontal
};

const ROLE_COLORS: Record<string, { bg: string; icon: string }> = {
  school_teacher: { bg: "bg-blue-50 text-blue-600", icon: "text-blue-600" },
  school_coordinator: { bg: "bg-purple-50 text-purple-500", icon: "text-purple-500" },
  tuition_teacher: { bg: "bg-emerald-50 text-emerald-500", icon: "text-emerald-500" },
  principal: { bg: "bg-amber-50 text-amber-500", icon: "text-amber-500" },
  other: { bg: "bg-pink-50 text-pink-500", icon: "text-pink-500" }
};

// Icon map for Step 2 (Boards)
const BOARD_ICONS: Record<string, any> = {
  cbse: BookOpen,
  jkbose: FileSpreadsheet,
  icse: Award,
  state_board: School,
  other: MoreHorizontal
};

const BOARD_COLORS: Record<string, { bg: string; icon: string }> = {
  cbse: { bg: "bg-blue-50 text-blue-600", icon: "text-blue-600" },
  jkbose: { bg: "bg-emerald-50 text-emerald-500", icon: "text-emerald-500" },
  icse: { bg: "bg-purple-50 text-purple-500", icon: "text-purple-500" },
  state_board: { bg: "bg-amber-50 text-amber-500", icon: "text-amber-500" },
  other: { bg: "bg-pink-50 text-pink-500", icon: "text-pink-500" }
};

// Icon map for Step 4 (Tools)
const TOOL_ICONS: Record<string, any> = {
  "lesson-plan": FileText,
  worksheet: ClipboardList,
  presentation: Presentation,
  activity: Activity,
  notes: Notebook
};

const TOOL_COLORS: Record<string, { bg: string; icon: string }> = {
  "lesson-plan": { bg: "bg-blue-50 text-blue-600", icon: "text-blue-600" },
  worksheet: { bg: "bg-emerald-50 text-emerald-500", icon: "text-emerald-500" },
  presentation: { bg: "bg-orange-50 text-orange-500", icon: "text-orange-500" },
  activity: { bg: "bg-cyan-50 text-cyan-500", icon: "text-cyan-500" },
  notes: { bg: "bg-pink-50 text-pink-500", icon: "text-pink-500" }
};

const ONBOARDING_TOOLS = [
  { id: "lesson-plan", label: "Lesson plan" },
  { id: "worksheet", label: "Worksheet" },
  { id: "presentation", label: "Presentation" },
  { id: "activity", label: "Classroom activity" },
  { id: "notes", label: "Notes" }
];

interface OptionCardProps {
  label: string;
  icon?: any;
  imgSrc?: string;
  theme?: { bg: string; icon: string };
  selected: boolean;
  onSelect: () => void;
  fullWidth?: boolean;
}

function OptionCard({
  label,
  icon: Icon,
  imgSrc,
  theme,
  selected,
  onSelect,
  fullWidth = false
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center justify-start w-full h-[56px] sm:h-[72px] px-3 sm:px-5 rounded-[14px] sm:rounded-[18px] border transition-all duration-200 text-left active:scale-[0.98] group",
        selected
          ? "border-[#2563EB] bg-[#2563EB]/[0.04] shadow-sm"
          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
      )}
      style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className={cn(
          "w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 overflow-hidden",
          imgSrc ? "bg-slate-50 border border-slate-100 p-1" : theme?.bg
        )}>
          {imgSrc ? (
            <img src={imgSrc} alt={label} className="w-full h-full object-contain" />
          ) : (
            Icon && <Icon className={cn("w-4.5 h-4.5 sm:w-6 sm:h-6", theme?.icon)} />
          )}
        </div>
        <span className="text-xs sm:text-base font-bold text-slate-800 leading-tight whitespace-normal break-words">{label}</span>
      </div>
    </button>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: user } = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    staleTime: Infinity,
    retry: false
  });

  const boardsQuery = useQuery({
    queryKey: ["onboarding-boards"],
    queryFn: () => backendApi.boards(0, 100).then(res => res.items.filter((board) => board.is_active !== false)),
    staleTime: Infinity,
    enabled: Boolean(user)
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [role, setRole] = useState<string | null>(null);
  const [board, setBoard] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [createFirst, setCreateFirst] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Visibility gating
  const visible = user?.needs_onboarding === true && user?.phone_prompt_state !== "required";
  const isTeacher = user?.role !== "admin";
  const canRender = useMemo(() => visible && isTeacher && !dismissed && Boolean(user), [visible, isTeacher, dismissed, user]);

  // Lock body scroll when onboarding modal is active
  useEffect(() => {
    if (mounted && canRender) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted, canRender]);

  if (!mounted || !canRender) return null;

  async function finish(destination?: string) {
    setSubmitting(true);
    try {
      const updated = await submitOnboarding({
        role_in_school: role ?? undefined,
        board_preference: board ?? undefined,
        pending_school_name: schoolName.trim() || undefined
      });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated);

      if (board && boardsQuery.data) {
        const prefLower = board.toLowerCase();
        const matchedBoard = boardsQuery.data.find(b => {
          const codeLower = b.code?.toLowerCase() || "";
          return codeLower.includes(prefLower);
        });
        if (matchedBoard) {
          localStorage.setItem("teachpad_default_board_id", matchedBoard.id);
        } else {
          localStorage.removeItem("teachpad_default_board_id");
        }
      }

      setDismissed(true);
      if (destination) {
        router.push(destination);
      }
    } catch (err) {
      toast({
        title: "Could not save",
        description: getErrorMessage(err, "Please try again."),
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  function skipAll() {
    void finish();
  }

  function next() {
    console.log("ONBOARDING WIZARD: Moving to next step. Current step was:", step, { role, board, schoolName });
    setStep((current) => Math.min(current + 1, STEP_COUNT - 1) as Step);
  }

  function handleFinishStep() {
    const destination = createFirst ? onboardingCreateFirstHref(createFirst) : undefined;
    void finish(destination);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 backdrop-blur-[12px] px-4 py-4 transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {/* Simple White Modal Container */}
      <div className="relative flex h-[560px] sm:h-[620px] max-h-[95dvh] w-full max-w-[1050px] overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_24px_48px_rgba(0,0,0,0.06),0_8px_16px_rgba(0,0,0,0.04)] animate-in fade-in zoom-in-95 duration-200">
        <div className="grid grid-cols-1 md:grid-cols-[1.45fr_1fr] w-full h-full">
          {/* Left panel - Content Form */}
          <div className="flex flex-col justify-between gap-4 sm:gap-6 p-5 sm:p-8 md:p-10 h-full bg-white">
            
            {/* Top Navigation / Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
              
              {/* Stepper indicators */}
              <div className="flex items-center gap-1">
                {Array.from({ length: STEP_COUNT }, (_, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200",
                        index === step
                          ? "border-2 border-[#2563EB] bg-white text-[#2563EB]"
                          : index < step
                          ? "bg-[#2563EB] text-white"
                          : "border border-slate-200 text-slate-400 bg-white"
                      )}
                    >
                      {index + 1}
                    </div>
                    {index < STEP_COUNT - 1 && (
                      <div
                        className={cn(
                          "h-[2px] w-8 transition-all duration-200 mx-1",
                          index < step ? "bg-[#2563EB]" : "bg-slate-100"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Badge */}
              <div className="self-start sm:self-auto flex items-center bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                Step {step + 1} of {STEP_COUNT}
              </div>
            </div>

            {/* Core Step Content */}
            <div className="flex-grow flex flex-col justify-between gap-4 mt-2 min-h-0">
              
              <div className="flex-1 flex flex-col justify-center min-h-0">
                {step === 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <h2 id="onboarding-title" className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        What do you teach?
                      </h2>
                      <p className="text-[11px] sm:text-sm font-semibold text-slate-400">
                        Select your current primary role in education so we can personalize your experience.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {ONBOARDING_ROLE_OPTIONS.map((opt) => (
                        <OptionCard
                          key={opt.value}
                          label={opt.label}
                          icon={ROLE_ICONS[opt.value]}
                          theme={ROLE_COLORS[opt.value]}
                          selected={role === opt.value}
                          onSelect={() => setRole(opt.value)}
                          fullWidth={opt.value === "other"}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <h2 id="onboarding-title" className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Which board do you teach?
                      </h2>
                      <p className="text-[11px] sm:text-sm font-semibold text-slate-400">
                        We'll tailor textbooks and recommendations to your syllabus.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {ONBOARDING_BOARD_OPTIONS.filter((opt) =>
                        ["cbse", "jkbose", "other"].includes(opt.value)
                      ).map((opt) => {
                        const isRealLogo = opt.value === "cbse" || opt.value === "jkbose";
                        return (
                          <OptionCard
                            key={opt.value}
                            label={opt.label}
                            imgSrc={
                              isRealLogo
                                ? `/landing/board-logos/${opt.value}-logo.png`
                                : undefined
                            }
                            icon={isRealLogo ? undefined : BOARD_ICONS[opt.value]}
                            theme={isRealLogo ? undefined : BOARD_COLORS[opt.value]}
                            selected={board === opt.value}
                            onSelect={() => setBoard(opt.value)}
                            fullWidth={opt.value === "other"}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <h2 id="onboarding-title" className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Your school
                      </h2>
                      <p className="text-[11px] sm:text-sm font-semibold text-slate-400">
                        Optional — helps us generate customized report cards and worksheets formatted for your school.
                      </p>
                    </div>

                    <div className="py-1">
                      <Input
                        placeholder="Enter your school's name"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="h-11 sm:h-14 rounded-xl border-slate-200 px-4 text-sm sm:text-base focus-visible:ring-[#2563EB]"
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <h2 id="onboarding-title" className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        What would you like to create first?
                      </h2>
                      <p className="text-[11px] sm:text-sm font-semibold text-slate-400">
                        Choose a tool to start immediately, and we'll take you straight there.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {ONBOARDING_TOOLS.map((opt) => (
                        <OptionCard
                          key={opt.id}
                          label={opt.label}
                          icon={TOOL_ICONS[opt.id]}
                          theme={TOOL_COLORS[opt.id]}
                          selected={createFirst === opt.id}
                          onSelect={() => setCreateFirst(opt.id)}
                          fullWidth={opt.id === "notes"}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>


            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4">
              
              {/* Left Action (Skip/Back) */}
              <div>
                {step === 0 ? (
                  <button
                    type="button"
                    onClick={skipAll}
                    className="flex items-center gap-1.5 px-4 h-11 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all"
                  >
                    <span>→</span> Skip for now
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep((curr) => (curr - 1) as Step)}
                    className="flex items-center gap-1.5 px-4 h-11 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
              </div>

              {/* Right Action (Continue/Skip) */}
              <div className="flex items-center gap-3">
                {/* Skip option for middle steps */}
                {step > 0 && (
                  <button
                    type="button"
                    onClick={step === 3 ? handleFinishStep : next}
                    className="text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-600 px-3 py-2 transition-colors"
                  >
                    Skip
                  </button>
                )}

                {/* Continue/Finish Button */}
                {step === 3 ? (
                  <button
                    type="button"
                    onClick={handleFinishStep}
                    disabled={submitting}
                    className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-full px-6 h-11 text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
                  >
                    {submitting ? "Saving…" : createFirst ? "Let's go" : "Finish"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={next}
                    disabled={
                      (step === 0 && !role) ||
                      (step === 1 && !board)
                    }
                    className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-full px-6 h-11 text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
                  >
                    Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right panel - Integrated seamlessly as part of the overall card */}
          <div className="relative hidden md:flex flex-col items-center justify-end bg-transparent overflow-hidden select-none w-full min-h-[560px] p-8 pb-0">
            {/* Waving/Thinking/Sitting/Celebrating character avatar switcher */}
            <img
              src={ONBOARDING_AVATARS[step]}
              alt="Teacher Assistant Illustration"
              className="z-10 w-full h-[82%] object-contain object-bottom translate-y-[2%] scale-[1.03] drop-shadow-[0_16px_32px_rgba(0,0,0,0.12)]"
              draggable={false}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
