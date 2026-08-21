/**
 * School Excellence Program — consultation / pilot request intake.
 *
 * The visitor receives success only after the backend has persisted the full
 * enquiry. An optional webhook can mirror the saved lead to an external CRM,
 * but webhook delivery is deliberately secondary to the admin-panel record.
 */

import { NextResponse } from "next/server";
import { formatLeadSummary, leadSchema } from "@/lib/school-excellence-lead";

/** Reject oversized bodies before parsing. */
const MAX_BODY_BYTES = 8_000;

function resolveBackendApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured.endsWith("/api/v1") ? configured : `${configured}/api/v1`;
  return "https://teacher-ai-backend-dev.onrender.com/api/v1";
}

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Request too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Some details need checking.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const lead = parsed.data;
  const summary = formatLeadSummary(lead);
  const receivedAt = new Date().toISOString();
  const webhook = process.env.SCHOOL_EXCELLENCE_LEAD_WEBHOOK;

  let savedLead: { id: string };
  try {
    const response = await fetch(`${resolveBackendApiBase()}/school-excellence-leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        school_name: lead.schoolName,
        city: lead.city,
        contact_person: lead.contactPerson,
        role: lead.role,
        phone: lead.phone,
        email: lead.email,
        student_strength: lead.studentStrength,
        grades: lead.grades,
        board: lead.board,
        priorities: lead.priorities,
        priority_note: lead.priorityNote || null,
        intent: lead.intent,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`[school-excellence-lead] backend responded ${response.status}`);
      return NextResponse.json(
        { ok: false, error: "We could not save your details just now. Please try again." },
        { status: 503 }
      );
    }
    savedLead = (await response.json()) as { id: string };
  } catch (error) {
    console.error("[school-excellence-lead] backend persistence failed", error);
    return NextResponse.json(
      { ok: false, error: "We could not save your details just now. Please try again." },
      { status: 503 }
    );
  }

  if (webhook) {
    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "school-excellence",
          leadId: savedLead.id,
          receivedAt,
          text: summary,
          lead,
        }),
        // Never let a slow webhook hold the visitor's request open.
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        console.error(`[school-excellence-lead] webhook responded ${response.status}`);
      }
    } catch (error) {
      console.error("[school-excellence-lead] webhook failed", error);
    }
  }

  console.info(`[school-excellence-lead] saved ${savedLead.id} at ${receivedAt}`);

  return NextResponse.json({ ok: true, id: savedLead.id });
}
