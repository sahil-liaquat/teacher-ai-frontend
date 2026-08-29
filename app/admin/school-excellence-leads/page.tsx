"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  Phone,
  Search,
  School,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import {
  AdminPageHeader,
  AdminPanel,
  EmptyState,
  LoadingState,
  MetricCard,
  StatusPill,
  formatDateTime,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  backendApi,
  type AdminSchoolExcellenceLead,
  type SchoolExcellenceLeadIntent,
  type SchoolExcellenceLeadStatus,
} from "@/lib/api";

const PAGE_SIZE = 50;
const LEAD_STATUSES: SchoolExcellenceLeadStatus[] = ["new", "contacted", "qualified", "closed"];

export default function AdminSchoolExcellenceLeadsPage() {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | SchoolExcellenceLeadStatus>("");
  const [intent, setIntent] = useState<"" | SchoolExcellenceLeadIntent>("");
  const [selected, setSelected] = useState<AdminSchoolExcellenceLead | null>(null);

  const leads = useQuery({
    queryKey: ["admin-school-excellence-leads", page, search, status, intent],
    queryFn: () =>
      backendApi.adminSchoolExcellenceLeads({
        q: search || undefined,
        status: status || undefined,
        intent: intent || undefined,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });

  const summary = leads.data?.summary;
  const totalPages = Math.max(1, Math.ceil((leads.data?.total ?? 0) / PAGE_SIZE));
  const hasFilters = Boolean(search || status || intent);

  function applySearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function clearFilters() {
    setPage(1);
    setSearchDraft("");
    setSearch("");
    setStatus("");
    setIntent("");
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="School Excellence Program"
        title="School leads"
        description="Review every consultation and pilot request, contact the school, and keep the follow-up status in one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="All enquiries"
          value={summary?.total ?? "—"}
          detail={`${summary?.pilot ?? 0} pilot requests`}
          tone="blue"
          icon={<School className="h-5 w-5" />}
        />
        <MetricCard
          label="New"
          value={summary?.new ?? "—"}
          detail="Awaiting first contact"
          tone="amber"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Contacted"
          value={summary?.contacted ?? "—"}
          detail="Follow-up in progress"
          tone="slate"
          icon={<Phone className="h-5 w-5" />}
        />
        <MetricCard
          label="Qualified"
          value={summary?.qualified ?? "—"}
          detail="Ready for next steps"
          tone="green"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      <AdminPanel
        title="All School Excellence enquiries"
        description="Newest submissions appear first. Open a record to see every answer and update follow-up notes."
        contentClassName="p-0"
      >
        <div className="border-b border-slate-200 p-4">
          <form onSubmit={applySearch} className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_auto]">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="School, contact, email, phone or city"
                aria-label="Search School Excellence enquiries"
                className="border-0 px-0 shadow-none focus:ring-0"
              />
            </div>
            <FilterSelect
              ariaLabel="Filter by follow-up status"
              value={status}
              onChange={(value) => { setStatus(value as typeof status); setPage(1); }}
              placeholder="All statuses"
              options={LEAD_STATUSES.map((value) => ({ value, label: titleCase(value) }))}
            />
            <FilterSelect
              ariaLabel="Filter by request type"
              value={intent}
              onChange={(value) => { setIntent(value as typeof intent); setPage(1); }}
              placeholder="All request types"
              options={[
                { value: "consultation", label: "Consultation" },
                { value: "pilot", label: "Pilot" },
              ]}
            />
            <div className="flex gap-2">
              <Button type="submit">Search</Button>
              {hasFilters ? <Button type="button" variant="outline" onClick={clearFilters}>Clear</Button> : null}
            </div>
          </form>
        </div>

        {leads.isLoading ? <div className="p-6"><LoadingState label="Loading school enquiries" /></div> : null}
        {leads.isError ? (
          <div className="p-6">
            <EmptyState title="Could not load school enquiries" description="Refresh the page to try again." />
          </div>
        ) : null}
        {!leads.isLoading && !leads.isError && !leads.data?.items.length ? (
          <div className="p-6">
            <EmptyState
              title={hasFilters ? "No matching enquiries" : "No enquiries yet"}
              description={hasFilters ? "Try clearing or changing the filters." : "CTA form submissions will appear here as soon as a school sends one."}
            />
          </div>
        ) : null}

        {leads.data?.items.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {[
                      "School",
                      "Contact",
                      "School profile",
                      "Request",
                      "Status",
                      "Received",
                      "",
                    ].map((heading, index) => <th key={`${heading}-${index}`} className="px-5 py-4 font-semibold">{heading}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.data.items.map((lead) => (
                    <LeadTableRow key={lead.id} lead={lead} onOpen={() => setSelected(lead)} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 lg:hidden">
              {leads.data.items.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onOpen={() => setSelected(lead)} />
              ))}
            </div>
          </>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-slate-600">
            {leads.data?.total ?? 0} matching record{leads.data?.total === 1 ? "" : "s"} · Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || leads.isFetching} onClick={() => setPage((current) => current - 1)}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || leads.isFetching} onClick={() => setPage((current) => current + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AdminPanel>

      <LeadDetailDialog lead={selected} onClose={() => setSelected(null)} onSaved={setSelected} />
    </>
  );
}

function LeadTableRow({ lead, onOpen }: { lead: AdminSchoolExcellenceLead; onOpen: () => void }) {
  return (
    <tr className="align-top hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <p className="font-semibold text-slate-950">{lead.school_name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{lead.city}</p>
      </td>
      <td className="px-5 py-4">
        <p className="font-medium text-slate-800">{lead.contact_person}</p>
        <p className="mt-0.5 text-xs text-slate-500">{lead.role}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-slate-700">{lead.board}</p>
        <p className="mt-0.5 text-xs text-slate-500">{lead.student_strength} students</p>
      </td>
      <td className="px-5 py-4"><IntentPill intent={lead.intent} /></td>
      <td className="px-5 py-4"><LeadStatusPill status={lead.status} /></td>
      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDateTime(lead.created_at)}</td>
      <td className="px-5 py-4 text-right">
        <Button type="button" variant="outline" size="sm" onClick={onOpen}>View <ArrowUpRight className="h-3.5 w-3.5" /></Button>
      </td>
    </tr>
  );
}

function LeadCard({ lead, onOpen }: { lead: AdminSchoolExcellenceLead; onOpen: () => void }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-950">{lead.school_name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{lead.city} · {lead.board}</p>
        </div>
        <LeadStatusPill status={lead.status} />
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm text-slate-700">
        <Users className="h-4 w-4 text-slate-400" />
        <span>{lead.contact_person} · {lead.role}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <IntentPill intent={lead.intent} />
          <p className="mt-2 text-xs text-slate-500">{formatDateTime(lead.created_at)}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onOpen}>View details</Button>
      </div>
    </article>
  );
}

function LeadDetailDialog({
  lead,
  onClose,
  onSaved,
}: {
  lead: AdminSchoolExcellenceLead | null;
  onClose: () => void;
  onSaved: (lead: AdminSchoolExcellenceLead) => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SchoolExcellenceLeadStatus>(lead?.status ?? "new");
  const [notes, setNotes] = useState(lead?.admin_notes ?? "");

  const save = useMutation({
    mutationFn: () => {
      if (!lead) throw new Error("No enquiry selected");
      return backendApi.adminUpdateSchoolExcellenceLead(lead.id, {
        status,
        admin_notes: notes.trim() || null,
      });
    },
    onSuccess: (updated) => {
      onSaved(updated);
      setStatus(updated.status);
      setNotes(updated.admin_notes ?? "");
      void queryClient.invalidateQueries({ queryKey: ["admin-school-excellence-leads"] });
    },
  });

  function handleOpenChange(open: boolean) {
    if (!open) onClose();
  }

  function resetEditor(current: AdminSchoolExcellenceLead) {
    setStatus(current.status);
    setNotes(current.admin_notes ?? "");
    save.reset();
  }

  return (
    <Dialog.Root open={Boolean(lead)} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        {lead ? (
          <Dialog.Content
            onOpenAutoFocus={() => resetEditor(lead)}
            className="fixed left-1/2 top-1/2 z-[71] flex max-h-[92vh] w-[calc(100vw-24px)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">School Excellence enquiry</p>
                <Dialog.Title className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {lead.school_name}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-500">
                  Submitted {formatDateTime(lead.created_at)} from {lead.city}
                </Dialog.Description>
              </div>
              <Dialog.Close className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900" aria-label="Close enquiry details">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <div className="overflow-y-auto p-5 sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="space-y-6">
                  <DetailSection title="School and contact">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Detail label="School name" value={lead.school_name} />
                      <Detail label="City" value={lead.city} />
                      <Detail label="Contact person" value={lead.contact_person} />
                      <Detail label="Role" value={lead.role} />
                      <Detail label="Phone" value={<a className="inline-flex items-center gap-1.5 text-blue-700 hover:underline" href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5" />{lead.phone}</a>} />
                      <Detail label="Email" value={<a className="inline-flex items-center gap-1.5 break-all text-blue-700 hover:underline" href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" />{lead.email}</a>} />
                    </div>
                  </DetailSection>

                  <DetailSection title="School profile">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Detail label="Student strength" value={lead.student_strength} />
                      <Detail label="Grades in scope" value={lead.grades} />
                      <Detail label="Curriculum / board" value={lead.board} />
                      <Detail label="Request type" value={<IntentPill intent={lead.intent} />} />
                    </div>
                  </DetailSection>

                  <DetailSection title="Areas they want to improve">
                    <div className="flex flex-wrap gap-2">
                      {lead.priorities.map((priority) => (
                        <span key={priority} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{priority}</span>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Detail label="Additional context" value={lead.priority_note || "No additional note provided."} />
                    </div>
                  </DetailSection>
                </div>

                <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-slate-950">Follow-up</h3>
                  </div>
                  <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="lead-status">Status</label>
                  <select
                    id="lead-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as SchoolExcellenceLeadStatus)}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    {LEAD_STATUSES.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
                  </select>

                  <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="lead-notes">Admin notes</label>
                  <Textarea
                    id="lead-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={4000}
                    rows={8}
                    placeholder="Add call outcomes, next steps, or ownership notes..."
                    className="mt-2 resize-y bg-white"
                  />
                  <p className="mt-1 text-right text-micro text-slate-400">{notes.length}/4000</p>

                  {save.isError ? <p role="alert" className="mt-3 text-sm font-medium text-rose-600">We could not save the follow-up update. Please try again.</p> : null}
                  {save.isSuccess ? <p role="status" className="mt-3 text-sm font-medium text-emerald-700">Follow-up details saved.</p> : null}

                  <Button type="button" className="mt-4 w-full" disabled={save.isPending} onClick={() => save.mutate()}>
                    {save.isPending ? "Saving..." : "Save follow-up"}
                  </Button>

                  <div className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
                    <p>Created: {formatDateTime(lead.created_at)}</p>
                    <p>Last updated: {formatDateTime(lead.updated_at)}</p>
                    <p className="mt-1 break-all">Record ID: {lead.id}</p>
                  </div>
                </aside>
              </div>
            </div>
          </Dialog.Content>
        ) : null}
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-950">{title}</h3>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-micro font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{value}</div>
    </div>
  );
}

function LeadStatusPill({ status }: { status: SchoolExcellenceLeadStatus }) {
  const tone = status === "qualified" ? "success" : status === "new" ? "warning" : status === "contacted" ? "info" : "neutral";
  return <StatusPill status={tone}>{titleCase(status)}</StatusPill>;
}

function IntentPill({ intent }: { intent: SchoolExcellenceLeadIntent }) {
  return <StatusPill status={intent === "pilot" ? "success" : "info"}>{intent === "pilot" ? "60-Day Pilot" : "Consultation"}</StatusPill>;
}

function FilterSelect({
  ariaLabel,
  value,
  onChange,
  options,
  placeholder,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
