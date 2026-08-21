/**
 * School Excellence Program consultation request — shared contract.
 *
 * The same schema validates the browser form (`components/school-excellence/
 * lead-form.tsx`) and the route handler (`app/api/school-excellence-lead/
 * route.ts`), so a lead can never reach the server in a shape the form would
 * have rejected.
 */

import { z } from "zod";

export const LEAD_ROLES = [
  "School Owner",
  "Director / Trustee",
  "Principal",
  "Vice Principal / Headmistress",
  "Academic Head",
  "Curriculum Coordinator",
  "Other",
] as const;

export const LEAD_STUDENT_STRENGTHS = [
  "Under 300",
  "300 – 750",
  "750 – 1,500",
  "1,500 – 3,000",
  "Over 3,000",
] as const;

export const LEAD_BOARDS = [
  "CBSE",
  "ICSE / ISC",
  "State Board",
  "IB",
  "Cambridge (CAIE)",
  "Multiple boards",
  "Other",
] as const;

/** The nine improvement areas offered in the form, in display order. */
export const LEAD_PRIORITIES = [
  "Curriculum implementation",
  "Teacher preparation",
  "Academic consistency",
  "Curriculum tracking",
  "Classroom resources",
  "Assessment",
  "Teacher AI enablement",
  "Leadership visibility",
  "Other",
] as const;

/** Where on the page the request was started — useful for follow-up context. */
export const LEAD_INTENTS = ["consultation", "pilot"] as const;

const phonePattern = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;

export const leadSchema = z.object({
  schoolName: z.string().trim().min(2, "Please enter your school's name.").max(160),
  city: z.string().trim().min(2, "Please enter your city.").max(80),
  contactPerson: z.string().trim().min(2, "Please enter your name.").max(120),
  role: z.enum(LEAD_ROLES, { errorMap: () => ({ message: "Please select your role." }) }),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter a phone number.")
    .refine((value) => phonePattern.test(value.replace(/[\s-]/g, "")), "Enter a valid 10-digit mobile number."),
  email: z.string().trim().min(1, "Please enter an email address.").email("Enter a valid email address."),
  studentStrength: z.enum(LEAD_STUDENT_STRENGTHS, {
    errorMap: () => ({ message: "Please select your student strength." }),
  }),
  grades: z.string().trim().min(1, "Tell us which grades you are considering.").max(120),
  board: z.enum(LEAD_BOARDS, { errorMap: () => ({ message: "Please select your curriculum or board." }) }),
  priorities: z.array(z.enum(LEAD_PRIORITIES)).min(1, "Select at least one area you would like to improve."),
  priorityNote: z.string().trim().max(600).optional(),
  intent: z.enum(LEAD_INTENTS).default("consultation"),
});

export type LeadInput = z.input<typeof leadSchema>;
export type LeadPayload = z.output<typeof leadSchema>;

/** Plain-text summary used for the webhook/email body and the server log. */
export function formatLeadSummary(lead: LeadPayload): string {
  return [
    `School: ${lead.schoolName} (${lead.city})`,
    `Contact: ${lead.contactPerson} — ${lead.role}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    `Student strength: ${lead.studentStrength}`,
    `Grades in scope: ${lead.grades}`,
    `Curriculum / board: ${lead.board}`,
    `Wants to improve: ${lead.priorities.join(", ")}`,
    lead.priorityNote ? `Note: ${lead.priorityNote}` : null,
    `Requested: ${lead.intent === "pilot" ? "60-Day Pilot" : "School Excellence Consultation"}`,
  ]
    .filter(Boolean)
    .join("\n");
}
