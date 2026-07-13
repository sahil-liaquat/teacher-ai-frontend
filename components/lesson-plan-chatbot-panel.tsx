"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  Rocket,
  BookOpen,
  Target,
  Lightbulb,
  Users,
  Globe,
  Calculator,
  FileQuestion,
  ClipboardList,
  Zap
} from "lucide-react";
import { backendApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
  proposedPlan?: any;
  isApplied?: boolean;
};

type LessonPlanChatbotPanelProps = {
  lessonPlanId: string;
  className?: string;
  onTweakSuccess?: (updatedPlan: any) => void;
  currentPlan?: any;
};

const SUGGESTED_GROUPS = [
  {
    category: "Drive inquiry in the unit",
    icon: Rocket,
    iconBg: "bg-blue-50 text-blue-500 border border-blue-100/50",
    textColor: "text-blue-500",
    items: [
      {
        label: "Brainstorm active & hands-on activities",
        prompt: "Make the lesson plan more active and hands-on by adding interactive classroom activities, experiments, or physical demonstrations.",
        icon: Lightbulb,
        iconBg: "bg-blue-50 text-blue-500",
        chevronBg: "bg-blue-50 text-blue-500"
      },
      {
        label: "Brainstorm ideas for classroom activities that build collaboration",
        prompt: "Include a structured group discussion activity with discussion prompts and teacher intervention guidelines.",
        icon: Users,
        iconBg: "bg-blue-50 text-blue-500",
        chevronBg: "bg-blue-50 text-blue-500"
      }
    ]
  },
  {
    category: "Subject specific engagements",
    icon: BookOpen,
    iconBg: "bg-violet-50 text-violet-500 border border-violet-100/50",
    textColor: "text-violet-500",
    items: [
      {
        label: "Incorporate CBSE real-world examples",
        prompt: "Incorporate CBSE-appropriate real-world examples and everyday life applications to explain the core concepts.",
        icon: Globe,
        iconBg: "bg-violet-50 text-violet-500",
        chevronBg: "bg-violet-50 text-violet-500"
      },
      {
        label: "Integrate textbook-based key formulas",
        prompt: "Focus more on key formulas, chemical equations, or mathematical proofs from the textbook context.",
        icon: Calculator,
        iconBg: "bg-violet-50 text-violet-500",
        chevronBg: "bg-violet-50 text-violet-500"
      }
    ]
  },
  {
    category: "Check for understanding",
    icon: Target,
    iconBg: "bg-teal-50 text-teal-500 border border-teal-100/50",
    textColor: "text-teal-500",
    items: [
      {
        label: "Add a 10-minute quiz at the end",
        prompt: "Add a structured 10-minute assessment quiz with 3-5 questions at the end to verify student understanding.",
        icon: FileQuestion,
        iconBg: "bg-teal-50 text-teal-500",
        chevronBg: "bg-teal-50 text-teal-500"
      },
      {
        label: "Brainstorm ideas for ongoing assessment",
        prompt: "Provide suggestions for formative assessment during the lesson flow to check student understanding.",
        icon: ClipboardList,
        iconBg: "bg-teal-50 text-teal-500",
        chevronBg: "bg-teal-50 text-teal-500"
      }
    ]
  }
];

function getPlanDiffSummary(oldPlan: any, newPlan: any): string {
  if (!oldPlan || !newPlan) return "I have generated the updated lesson plan.";

  const updates: string[] = [];
  const isEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

  // String fields to compare
  const stringFields = [
    { key: "title", label: "Title" },
    { key: "introduction_warm_up", label: "Introduction / Warm-up" },
    { key: "explanation_of_concept", label: "Concept Explanation" },
    { key: "classroom_activity", label: "Classroom Activity" },
    { key: "activity", label: "Activity" },
    { key: "homework", label: "Homework" },
    { key: "teacher_notes", label: "Teacher Notes" }
  ];

  stringFields.forEach(({ key, label }) => {
    const oldVal = oldPlan[key];
    const newVal = newPlan[key];
    if (newVal && !isEqual(oldVal, newVal)) {
      const displayVal = newVal.length > 250 ? newVal.substring(0, 250) + "..." : newVal;
      updates.push(`**${label}**:\n${displayVal}`);
    }
  });

  // List fields to compare
  const listFields = [
    { key: "learning_objectives", label: "Learning Objectives" },
    { key: "materials_needed", label: "Materials Needed" },
    { key: "key_concepts", label: "Key Concepts" }
  ];

  listFields.forEach(({ key, label }) => {
    const oldList = oldPlan[key] || [];
    const newList = newPlan[key] || [];
    if (newList.length > 0 && !isEqual(oldList, newList)) {
      const items = newList.map((item: any) => `- ${item}`).join("\n");
      updates.push(`**${label}**:\n${items}`);
    }
  });

  // Assessment Questions
  const oldQuestions = oldPlan.assessment_questions || [];
  const newQuestions = newPlan.assessment_questions || [];
  if (newQuestions.length > 0 && !isEqual(oldQuestions, newQuestions)) {
    const qList = newQuestions.map((q: any) => {
      if (typeof q === "object" && q !== null) {
        return `- ${q.question || q.textbook_detail || JSON.stringify(q)}`;
      }
      return `- ${q}`;
    }).join("\n");
    updates.push(`**Assessment Questions**:\n${qList}`);
  }

  if (updates.length === 0) {
    return "I've optimized the layout and metadata of the lesson plan.";
  }

  return "Here are the updates generated for your lesson plan:\n\n" + updates.join("\n\n");
}

export function LessonPlanChatbotPanel({
  lessonPlanId,
  className,
  onTweakSuccess,
  currentPlan
}: LessonPlanChatbotPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [applyingMsgId, setApplyingMsgId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when messages change or loading state changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Add user message
    const userMsgId = Math.random().toString(36).substring(2, 9);
    const userMessage: Message = {
      id: userMsgId,
      sender: "user",
      text: text,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call backend API (returns the updated plan dict)
      const updatedPlanData = await backendApi.tweakLessonPlan(lessonPlanId, text);

      // Compare current plan to see what updates we made
      const oldPlan = currentPlan?.plan || currentPlan || {};
      const diffSummaryText = getPlanDiffSummary(oldPlan, updatedPlanData);

      // Add success response containing proposed plan and details
      const botMsgId = Math.random().toString(36).substring(2, 9);
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: "bot",
          text: diffSummaryText,
          timestamp: new Date(),
          proposedPlan: updatedPlanData,
          isApplied: false
        }
      ]);
    } catch (err: any) {
      console.error("Tweak error:", err);
      const botMsgId = Math.random().toString(36).substring(2, 9);
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: "bot",
          text: `Sorry, I couldn't update the lesson plan: ${err?.message || "Internal Server Error"}. Please try again.`,
          timestamp: new Date()
        }
      ]);
      toast({
        title: "Tweak Failed",
        description: "Could not apply instructions to the lesson plan.",
        variant: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (msgId: string, planData: any) => {
    if (applyingMsgId) return;
    setApplyingMsgId(msgId);
    try {
      // Call backend API to save the plan in the DB
      const updatedLesson = await backendApi.updateLessonPlan(lessonPlanId, { plan: planData });
      
      // Update React Query state and notify parent
      queryClient.setQueryData(["lesson-plan", lessonPlanId], updatedLesson);
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      
      if (onTweakSuccess) {
        onTweakSuccess(updatedLesson);
      }

      // Mark this message as applied in local state
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, isApplied: true } : m))
      );

      toast({
        title: "Changes Applied",
        description: "The lesson plan output has been updated successfully.",
        variant: "success"
      });
    } catch (err: any) {
      console.error("Apply error:", err);
      toast({
        title: "Apply Failed",
        description: err?.message || "Could not save changes to the database.",
        variant: "error"
      });
    } finally {
      setApplyingMsgId(null);
    }
  };

  const handleSuggestionClick = (promptText: string) => {
    handleSend(promptText);
  };

  // Custom inline markdown parser to cleanly display bullets, linebreaks, and bold text inside chat bubble
  const renderMessageText = (text: string, isBot: boolean) => {
    const lines = text.split("\n");
    return lines.map((line, lineIndex) => {
      const trimmedLine = line.trim();
      const isBullet = trimmedLine.startsWith("-") || trimmedLine.startsWith("*");
      const cleanLine = isBullet ? trimmedLine.replace(/^[\s*-]+/, "").trim() : trimmedLine;

      // Robust regex to match headings like **Heading**: or **Heading** (optionally with trailing spaces)
      const headingMatch = cleanLine.match(/^\*\*([^*]+)\*\*:(.*)$/) || cleanLine.match(/^\*\*([^*]+)\*\*(.*)$/);

      if (headingMatch && (!headingMatch[2] || headingMatch[2].trim() === "")) {
        const headingText = headingMatch[1].trim();
        return (
          <h4 
            key={lineIndex} 
            className={cn(
              "text-[12.5px] font-extrabold tracking-tight mt-3.5 mb-1 block", 
              isBot ? "text-slate-950" : "text-white",
              lineIndex === 0 && "mt-0"
            )}
          >
            {headingText}:
          </h4>
        );
      }

      // Parse bold elements (**text**)
      const parts = cleanLine.split(/\*\*([^*]+)\*\*/g);
      const parsedText = parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <strong key={index} className={cn("font-bold", isBot ? "text-slate-950" : "text-white")}>
              {part}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIndex} className="flex items-start gap-1.5 pl-3 mt-1 text-[11.5px] leading-relaxed">
            <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", isBot ? "bg-slate-400" : "bg-white/60")} />
            <span className="flex-1 text-inherit">{parsedText}</span>
          </div>
        );
      }

      return (
        <p key={lineIndex} className={cn("text-[11.5px] leading-relaxed text-inherit", lineIndex > 0 && "mt-1.5")}>
          {parsedText}
        </p>
      );
    });
  };

  const isHomeState = messages.length === 0;

  return (
    <aside className={cn("max-h-none self-start overflow-visible xl:h-full flex flex-col", className)} aria-label="Tweak Assistant">
      {/* Dynamic import of Plus Jakarta Sans google font */}
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <div 
        style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
        className="group/card relative overflow-hidden flex flex-col h-[600px] xl:h-full rounded-[24px] border border-white bg-gradient-to-br from-[#eff6ff] via-[#fdf4ff] to-white shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
      >
        
        {/* Soft background gradient blurs matching image */}
        <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[#bfdbfe]/25 blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#fbcfe8]/20 blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-indigo-200/15 blur-3xl pointer-events-none" />

        {/* Small Sticky Header (Active when chatting) */}
        {!isHomeState && (
          <div className="border-b border-[#eceef3]/60 bg-white/40 backdrop-blur-md px-5 py-3 shrink-0 z-10 relative">
            <div className="flex items-center gap-3">
              {/* Mascot Avatar Mini */}
              <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-[#e0f2fe] via-[#bae6fd] to-[#c7d2fe] flex items-center justify-center shadow-sm shrink-0">
                <div className="relative w-6.5 h-6.5 rounded-full bg-white flex flex-col items-center justify-center shadow-[inset_0_-1px_2px_rgba(0,0,0,0.04)]">
                  <div className="flex gap-0.5 items-center justify-center mt-0.5 scale-75">
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                  </div>
                  <div className="absolute top-3.5 left-0.5 w-1 h-0.5 rounded-full bg-pink-300 opacity-60" />
                  <div className="absolute top-3.5 right-0.5 w-1 h-0.5 rounded-full bg-pink-300 opacity-60" />
                  <div className="absolute top-1 w-5 h-2.5 border border-pink-400/80 rounded-full flex items-center justify-between px-0.5 scale-75">
                    <div className="w-1.5 h-1.5 rounded-full border border-pink-400/80" />
                    <div className="w-1.5 h-1.5 rounded-full border border-pink-400/80" />
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-[13px] font-extrabold leading-tight text-slate-900 tracking-tight">TeachPad AI</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-transparent z-10 relative">
          
          {/* Welcome Dashboard State (Toddle AI Style) */}
          {isHomeState ? (
            <div className="space-y-6">
              
              {/* Header block with avatar and typography matching image */}
              <div className="flex gap-4 items-start pt-2">
                {/* squircle robot mascot avatar */}
                <div className="relative h-[68px] w-[68px] rounded-[24px] bg-gradient-to-br from-[#e0f2fe] via-[#bae6fd] to-[#c7d2fe] flex items-center justify-center shadow-[0_8px_20px_rgba(186,230,253,0.35),inset_0_-2px_6px_rgba(0,0,0,0.04)] border border-white/60 shrink-0">
                  <div className="relative w-11 h-11 rounded-full bg-white flex flex-col items-center justify-center shadow-md">
                    {/* Eyes */}
                    <div className="flex gap-2 items-center justify-center mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    </div>
                    {/* Pink Cheeks */}
                    <div className="absolute top-6 left-1 w-2 h-1 rounded-full bg-pink-300 opacity-60" />
                    <div className="absolute top-6 right-1 w-2 h-1 rounded-full bg-pink-300 opacity-60" />
                    {/* Pink glasses overlay */}
                    <div className="absolute top-3 w-[32px] h-[16px] border border-pink-400 rounded-full flex items-center justify-between px-0.5 shadow-sm">
                      <div className="w-3.5 h-3.5 rounded-full border border-pink-400" />
                      <div className="w-3.5 h-3.5 rounded-full border border-pink-400" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-[18px] tracking-tight leading-snug">
                    <span className="block font-extrabold text-slate-900">Hey, I'm TeachPad AI.</span>
                    <span className="block font-black bg-gradient-to-r from-blue-500 via-[#8b5cf6] to-[#7c3aed] bg-clip-text text-transparent">Happy to help!</span>
                  </h1>
                  <p className="text-[11.5px] font-medium text-slate-500 leading-relaxed pt-0.5">
                    I can help you generate ideas or tweak this lesson plan. You can select a task from the list of suggestions or just type in the chat box.
                  </p>
                </div>
              </div>

              {/* Grouped Suggestions with matching image icons and borders */}
              <div className="space-y-6 pt-2">
                {SUGGESTED_GROUPS.map((group, groupIndex) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={groupIndex} className="space-y-3">
                      
                      {/* Category Header with Left Icon and Right line divider */}
                      <div className="flex items-center gap-2">
                        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.02)]", group.iconBg)}>
                          <GroupIcon className="h-4 w-4 stroke-[2.2]" />
                        </span>
                        <h3 className={cn("text-[10px] font-extrabold uppercase tracking-wider", group.textColor)}>
                          {group.category}
                        </h3>
                        <div className="flex-1 h-[1px] bg-slate-200/50" />
                      </div>

                      {/* Cards list */}
                      <div className="space-y-3">
                        {group.items.map((item, itemIndex) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={itemIndex}
                              type="button"
                              onClick={() => handleSuggestionClick(item.prompt)}
                              className="w-full flex items-center gap-4 bg-white hover:bg-slate-50 border border-slate-100 shadow-[0_4px_12px_rgba(15,23,42,0.02)] hover:shadow-[0_8px_16px_rgba(15,23,42,0.04)] rounded-2xl p-3.5 transition duration-200 text-left hover:-translate-y-0.5 cursor-pointer"
                            >
                              {/* Left icon circle */}
                              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full shadow-inner", item.iconBg)}>
                                <ItemIcon className="h-4.5 w-4.5 stroke-[2.2]" />
                              </span>
                              
                              {/* Middle text */}
                              <span className="flex-1 text-[12.5px] font-bold text-slate-800 leading-snug">
                                {item.label}
                              </span>
                              
                              {/* Right circular link arrow */}
                              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform hover:scale-105", item.chevronBg)}>
                                <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                              </span>
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* Chat History View (Active State) */
            <>
              {messages.map((message) => {
                const isBot = message.sender === "bot";
                return (
                  <div key={message.id} className="space-y-2">
                    <div
                      className={cn("flex gap-2.5 max-w-[85%]", isBot ? "self-start" : "ml-auto flex-row-reverse")}
                    >
                      <div
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-1 shadow-sm",
                          isBot 
                            ? "bg-white/90 text-blue-600 ring-blue-100/40" 
                            : "bg-[#e0e7ff] text-indigo-600 ring-indigo-100"
                        )}
                      >
                        {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div
                        className={cn(
                          "rounded-[16px] px-3.5 py-2.5 text-xs shadow-sm text-slate-700 tracking-wide",
                          isBot
                            ? "bg-white/90 border border-slate-100/60 rounded-tl-sm shadow-[0_4px_12px_rgba(15,23,42,0.01)]"
                            : "bg-gradient-to-br from-blue-500 to-[#1677ff] text-white rounded-tr-sm shadow-[0_4px_12px_rgba(22,119,255,0.15)]"
                        )}
                      >
                        {renderMessageText(message.text, isBot)}
                      </div>
                    </div>

                    {/* 3D Apply Changes Button below the bot message */}
                    {isBot && message.proposedPlan && (
                      <div className="pl-10 flex items-center gap-2 mt-1">
                        {message.isApplied ? (
                          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10.5px] font-bold shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Applied to Output
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={applyingMsgId !== null || isLoading}
                            onClick={() => handleApply(message.id, message.proposedPlan)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 border-b-[3.5px] border-b-slate-300 active:border-b-[1px] active:translate-y-[2.5px] active:shadow-inner shadow-sm text-slate-700 text-[10.5px] font-bold transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:pointer-events-none hover:border-emerald-300 hover:border-b-emerald-400 hover:text-emerald-600"
                          >
                            {applyingMsgId === message.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 text-[#2dd4bf] stroke-[2.2]" />
                            )}
                            Apply to Lesson Plan
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-2.5 max-w-[85%] self-start">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/90 text-blue-600 ring-1 ring-blue-100/40 shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-[16px] px-3.5 py-2.5 bg-white/90 text-slate-500 border border-slate-100/60 rounded-tl-sm shadow-[0_4px_12px_rgba(15,23,42,0.01)] flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                    <span className="text-xs font-semibold animate-pulse text-slate-500 tracking-wide">Tweaking lesson plan...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Form (TeachPad AI Glass Layout matching image) */}
        <div className="p-3 bg-white/40 border-t border-[#eceef3]/50 shrink-0 z-10 relative backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="flex gap-2.5 items-center w-full"
          >
            {/* Sparkles icon action button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setInputValue("Brainstorm ideas for ")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-white text-[#2dd4bf] hover:bg-slate-50 border border-slate-200/60 transition shadow-sm disabled:opacity-50"
              title="Browse ideas"
            >
              <Sparkles className="h-5 w-5 stroke-[2.2]" />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your question here or browse suggestions..."
              disabled={isLoading}
              className="flex-1 min-w-0 px-4 py-2.5 bg-white border border-slate-200 rounded-[12px] text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-sm disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40 transition shadow-[0_4px_12px_rgba(59,130,246,0.25)]"
            >
              {isLoading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Send className="h-4.5 w-4.5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
