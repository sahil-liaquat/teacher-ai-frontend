"use client";

/**
 * School Excellence consultation request.
 *
 * One form, two presentations: an inline block at the foot of the page and a
 * modal any CTA can open through `useLeadForm()`. The modal is a Radix Dialog,
 * so focus trapping, Escape, scroll locking and `aria-modal` come for free.
 *
 * Radix portals the dialog to <body>, outside the page's `.se` scope — so the
 * dialog content re-applies both `se` and the display-font variable.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle, X } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useController, useForm } from "react-hook-form";
import type { z } from "zod";
import {
  LEAD_BOARDS,
  LEAD_PRIORITIES,
  LEAD_ROLES,
  LEAD_STUDENT_STRENGTHS,
  leadSchema,
} from "@/lib/school-excellence-lead";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";
import { seDisplay } from "@/lib/se-font";
import { Eyebrow } from "./primitives";
import { EASE_PREMIUM } from "@/lib/use-motion";

type LeadIntent = "consultation" | "pilot";
type FormValues = z.infer<typeof leadSchema>;

// ─── Open-from-anywhere plumbing ─────────────────────────────────────

type LeadFormContextValue = {
  /** Opens the modal. `intent` records which CTA the school came from. */
  openLeadForm: (intent?: LeadIntent) => void;
};

const LeadFormContext = createContext<LeadFormContextValue | null>(null);

export function useLeadForm(): LeadFormContextValue {
  const context = useContext(LeadFormContext);
  // Falling back to the inline form's anchor keeps every CTA useful even if a
  // section is ever rendered outside the provider.
  return (
    context ?? {
      openLeadForm: () => {
        if (typeof document !== "undefined") {
          document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      },
    }
  );
}

export function LeadFormProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<LeadIntent>("consultation");
  const prefersReduced = useReducedMotion();

  const openLeadForm = useCallback((nextIntent: LeadIntent = "consultation") => {
    setIntent(nextIntent);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openLeadForm }), [openLeadForm]);

  return (
    <LeadFormContext.Provider value={value}>
      {children}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={prefersReduced ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.22, ease: EASE_PREMIUM }}
                className="fixed inset-0 z-[100] bg-[rgba(8,17,30,0.62)] backdrop-blur-[5px]"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount aria-modal="true">
              <motion.div
                initial={prefersReduced ? undefined : { opacity: 0, y: 22, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.32, ease: EASE_PREMIUM }}
                className={`se ${seDisplay.variable} fixed left-1/2 top-[50dvh] z-[101] flex max-h-[calc(100dvh-16px)] w-[calc(100vw-16px)] max-w-[760px] flex-col overflow-hidden rounded-xl border border-white/70 bg-[var(--se-paper)] shadow-[0_40px_120px_-28px_rgba(8,17,30,0.72)] [translate:-50%_-50%] sm:max-h-[92dvh] sm:w-[calc(100vw-40px)]`}
              >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--se-line)] bg-[var(--se-paper-warm)] px-4 py-4 sm:px-8 sm:py-5">
                  <div>
                    <p className="se-eyebrow">
                      {intent === "pilot" ? "Begin your 60-day journey" : "School Excellence Program"}
                    </p>
                    <Dialog.Title className="se-display mt-1.5 text-[21px] leading-tight text-[var(--se-ink)] sm:text-[26px]">
                      {intent === "pilot"
                        ? "Tell us where your school is today."
                        : "Let’s understand your school first."}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1.5 max-w-[56ch] text-[12.5px] leading-[1.5] text-[var(--se-muted)] sm:text-[13px]">
                      {intent === "pilot"
                        ? "Share a few details so our team can prepare the right starting point for your school."
                        : "Share a few details so we can prepare for the consultation."}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    aria-label="Close form"
                    className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[var(--se-line)] bg-white text-[var(--se-muted)] shadow-sm transition hover:border-[var(--se-line-strong)] hover:text-[var(--se-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--se-accent)]"
                  >
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-7">
                  <LeadFormFields intent={intent} />
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </Dialog.Root>
    </LeadFormContext.Provider>
  );
}

// ─── Inline block ────────────────────────────────────────────────────

/** The same form presented as a page section (target of `#apply`). */
export function LeadFormSection() {
  return (
    <section id="apply" data-se-anchor className="border-t border-[var(--se-line)] bg-[var(--se-paper-warm)]">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-[150px] lg:self-start">
            <Eyebrow>Request a consultation</Eyebrow>
            <h2 className="se-display mt-4 text-[30px] leading-[1.12] sm:text-[40px]">
              Let&rsquo;s understand your school first.
            </h2>
            <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.75] text-[var(--se-body)]">
              A consultation is a working conversation about how academics currently run in your school —
              curriculum, calendar, planning, teacher workflow and assessment — and where a structured
              implementation would help most.
            </p>

            <ul className="mt-8 max-w-[44ch] border-t border-[var(--se-line)]">
              {[
                "A 45-minute academic review call with your leadership team",
                "A walkthrough of the program using your curriculum as the example",
                "A recommended starting scope — grades, subjects and teachers",
                "A written implementation outline before any commitment",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 border-b border-[var(--se-line)] py-3.5 text-[14px] font-medium leading-[1.6] text-[var(--se-body)]"
                >
                  <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--se-accent)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--se-line)] bg-[var(--se-paper)] p-5 shadow-[0_24px_60px_-30px_rgba(13,26,43,0.24)] sm:p-8">
            <LeadFormFields intent="consultation" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── The form ────────────────────────────────────────────────────────

function LeadFormFields({ intent }: { intent: LeadIntent }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const prefersReduced = useReducedMotion();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      schoolName: "",
      city: "",
      contactPerson: "",
      phone: "",
      email: "",
      grades: "",
      priorities: [],
      priorityNote: "",
      intent,
    },
  });

  // The improvement areas are chips rather than checkboxes, so the array is
  // driven through a controller instead of a DOM input.
  const { field: prioritiesField } = useController({ control, name: "priorities" });
  const priorities = prioritiesField.value ?? [];
  const showPriorityNote = priorities.includes("Other");

  function togglePriority(option: (typeof LEAD_PRIORITIES)[number]) {
    prioritiesField.onChange(
      priorities.includes(option) ? priorities.filter((item) => item !== option) : priorities.concat(option)
    );
  }

  async function onSubmit(values: FormValues) {
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/school-excellence-lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        setStatus("error");
        setErrorMessage("We could not save your details just now. Please check your connection and try again.");
        return;
      }

      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMessage(
        `We could not send that just now. Please email ${LEGAL.contactEmail} and we will pick it up from there.`
      );
    }
  }

  if (status === "done") {
    return (
      <motion.div
        initial={prefersReduced ? undefined : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_PREMIUM }}
        className="flex min-h-[320px] flex-col items-center justify-center py-6 text-center"
        role="status"
      >
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--se-accent-tint)] text-[var(--se-accent)]">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="se-display mt-5 text-[24px] leading-tight sm:text-[28px]">
          {intent === "pilot"
            ? "Thank you — your 60-day journey request is in."
            : "Thank you — we have your details."}
        </h3>
        <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-[1.7] text-[var(--se-body)]">
          Our School Excellence team will review your school&rsquo;s context and get in touch within two working
          days with the next step. If it is easier to reach us first, write to{" "}
          <a
            href={`mailto:${LEGAL.contactEmail}`}
            className="font-semibold text-[var(--se-accent)] underline decoration-[var(--se-accent-line)] underline-offset-4"
          >
            {LEGAL.contactEmail}
          </a>
          .
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className="text-[14px] leading-[1.65] text-[var(--se-muted)]">
        Nine short questions. We use them to prepare for the conversation, not to qualify you out.
      </p>

      <div className="mt-6 grid gap-x-5 gap-y-5 sm:grid-cols-2">
        <Field label="School name" error={errors.schoolName?.message} htmlFor="se-school">
          <input
            id="se-school"
            type="text"
            autoComplete="organization"
            placeholder="Greenfield Public School"
            className={`se-field ${errors.schoolName ? "se-field-invalid" : ""}`}
            aria-invalid={errors.schoolName ? true : undefined}
            {...register("schoolName")}
          />
        </Field>

        <Field label="City" error={errors.city?.message} htmlFor="se-city">
          <input
            id="se-city"
            type="text"
            autoComplete="address-level2"
            placeholder="Pune"
            className={`se-field ${errors.city ? "se-field-invalid" : ""}`}
            aria-invalid={errors.city ? true : undefined}
            {...register("city")}
          />
        </Field>

        <Field label="Contact person" error={errors.contactPerson?.message} htmlFor="se-contact">
          <input
            id="se-contact"
            type="text"
            autoComplete="name"
            placeholder="Full name"
            className={`se-field ${errors.contactPerson ? "se-field-invalid" : ""}`}
            aria-invalid={errors.contactPerson ? true : undefined}
            {...register("contactPerson")}
          />
        </Field>

        <Field label="Your role" error={errors.role?.message} htmlFor="se-role">
          <select
            id="se-role"
            className={`se-field ${errors.role ? "se-field-invalid" : ""}`}
            aria-invalid={errors.role ? true : undefined}
            defaultValue=""
            {...register("role")}
          >
            <option value="" disabled>
              Select your role
            </option>
            {LEAD_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Phone" error={errors.phone?.message} htmlFor="se-phone">
          <input
            id="se-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            className={`se-field ${errors.phone ? "se-field-invalid" : ""}`}
            aria-invalid={errors.phone ? true : undefined}
            {...register("phone")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} htmlFor="se-email">
          <input
            id="se-email"
            type="email"
            autoComplete="email"
            placeholder="name@school.edu.in"
            className={`se-field ${errors.email ? "se-field-invalid" : ""}`}
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
        </Field>

        <Field label="Student strength" error={errors.studentStrength?.message} htmlFor="se-strength">
          <select
            id="se-strength"
            className={`se-field ${errors.studentStrength ? "se-field-invalid" : ""}`}
            aria-invalid={errors.studentStrength ? true : undefined}
            defaultValue=""
            {...register("studentStrength")}
          >
            <option value="" disabled>
              Select a range
            </option>
            {LEAD_STUDENT_STRENGTHS.map((option) => (
              <option key={option} value={option}>
                {option} students
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Grades you are considering"
          error={errors.grades?.message}
          htmlFor="se-grades"
        >
          <input
            id="se-grades"
            type="text"
            placeholder="e.g. Grades 3 to 5"
            className={`se-field ${errors.grades ? "se-field-invalid" : ""}`}
            aria-invalid={errors.grades ? true : undefined}
            {...register("grades")}
          />
        </Field>

        <Field
          label="Curriculum / board"
          error={errors.board?.message}
          htmlFor="se-board"
          className="sm:col-span-2"
        >
          <select
            id="se-board"
            className={`se-field ${errors.board ? "se-field-invalid" : ""}`}
            aria-invalid={errors.board ? true : undefined}
            defaultValue=""
            {...register("board")}
          >
            <option value="" disabled>
              Select curriculum or board
            </option>
            {LEAD_BOARDS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="mt-7 border-t border-[var(--se-line)] pt-6">
        <legend className="se-label !mb-0">What would you most like to improve?</legend>
        <p className="mt-1 text-[13px] font-medium text-[var(--se-muted)]">Select all that apply.</p>

        <div
          className="mt-4 flex flex-wrap gap-2.5"
          aria-describedby={errors.priorities ? "se-priorities-error" : undefined}
        >
          {LEAD_PRIORITIES.map((option) => (
            <button
              key={option}
              type="button"
              className="se-chip"
              aria-pressed={priorities.includes(option)}
              onClick={() => togglePriority(option)}
            >
              {option}
            </button>
          ))}
        </div>
        {errors.priorities ? (
          <p id="se-priorities-error" className="mt-3 text-[13px] font-semibold text-[#b3402f]">
            {errors.priorities.message}
          </p>
        ) : null}

        {showPriorityNote ? (
          <div className="mt-5">
            <label htmlFor="se-priority-note" className="se-label">
              Tell us a little more
            </label>
            <textarea
              id="se-priority-note"
              rows={3}
              placeholder="What would you like to improve?"
              className="se-field !h-auto py-3 leading-[1.6]"
              {...register("priorityNote")}
            />
          </div>
        ) : null}
      </fieldset>

      {status === "error" ? (
        <p role="alert" className="mt-6 rounded-md border border-[#b3402f33] bg-[#b3402f0f] px-4 py-3 text-[13px] font-semibold leading-[1.6] text-[#8f3325]">
          {errorMessage}
        </p>
      ) : null}

      <button type="submit" disabled={status === "submitting"} className="se-cta se-cta-primary mt-7 w-full">
        {status === "submitting" ? (
          <>
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            Sending your details
          </>
        ) : (
          <>
            {intent === "pilot" ? "Begin My 60-Day Journey" : "Request School Excellence Consultation"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="mt-4 text-[12px] font-medium leading-[1.6] text-[var(--se-muted)]">
        We use these details only to prepare and schedule your consultation. See our{" "}
        <Link
          href={LEGAL_LINKS.privacy}
          className="font-semibold text-[var(--se-ink-soft)] underline decoration-[var(--se-line-strong)] underline-offset-2"
        >
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="se-label">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-[12.5px] font-semibold text-[#b3402f]">{error}</p> : null}
    </div>
  );
}
