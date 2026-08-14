"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, ChevronLeft, ChevronRight, Mail, Plus, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import { backendApi, type ApiUser, type Organization, type OrganizationWrite } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, MetricCard, StatusPill, formatDate } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const USER_FETCH_LIMIT = 500;
const EMPTY_SCHOOL: OrganizationWrite & { initial_admin_email: string } = {
  name: "", school_code: "", board: "", country: "", state: "", city: "",
  primary_contact: "", contact_email: "", contact_phone: "", status: "draft",
  plan: "trial", subscription_status: "trial", curriculum_starting_point: "teachpad",
  curriculum_entitlement: true, enabled_modules: ["primary"], initial_admin_email: "",
};

export default function AdminOrganizationsPage() {
  const { toast } = useToast();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_SCHOOL);
  const [inviteEmail, setInviteEmail] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Organization | null>(null);

  const organizations = useQuery({ queryKey: ["admin-organizations", search], queryFn: () => backendApi.adminOrganizations({ q: search || undefined, limit: 100 }), placeholderData: (previous) => previous });
  const users = useQuery({ queryKey: ["admin-organization-users"], queryFn: () => backendApi.users(0, USER_FETCH_LIMIT) });
  const allUsers = useMemo<ApiUser[]>(() => users.data?.items ?? [], [users.data]);
  const organizationList = organizations.data?.items ?? [];
  const selected = organizationList.find((item) => item.id === selectedId) ?? null;
  const members = selected ? allUsers.filter((user) => user.organization_id === selected.id) : [];
  const schoolAdmins = members.filter((user) => user.role === "org_admin");

  async function refresh() {
    await Promise.all([client.invalidateQueries({ queryKey: ["admin-organizations"] }), client.invalidateQueries({ queryKey: ["admin-organization-users"] })]);
  }

  const createSchool = useMutation({
    mutationFn: async () => {
      const { initial_admin_email, ...payload } = form;
      const school = await backendApi.adminCreateOrganization({ ...payload, status: initial_admin_email ? "active" : "draft" });
      if (initial_admin_email) await backendApi.adminInviteInitialSchoolAdmin(school.id, initial_admin_email);
      return school;
    },
    onSuccess: async (school) => {
      toast({ title: "School created", description: form.initial_admin_email ? "The initial School Admin invitation is ready." : "Saved as a draft without an administrator.", variant: "success" });
      setWizard(false); setStep(1); setForm(EMPTY_SCHOOL); setSelectedId(school.id); await refresh();
    },
    onError: (error) => toast({ title: "Could not create school", description: getErrorMessage(error, "Review the school details and try again."), variant: "error" }),
  });

  const inviteAdmin = useMutation({
    mutationFn: () => backendApi.adminInviteInitialSchoolAdmin(selected!.id, inviteEmail.trim()),
    onSuccess: async (invite) => {
      toast({ title: "School Admin invited", description: invite.accept_url ? "Invitation created. Copy the acceptance link from the notification." : invite.email, variant: "success" });
      setInviteEmail(""); await refresh();
    },
    onError: (error) => toast({ title: "Could not invite School Admin", description: getErrorMessage(error, "Check the address and try again."), variant: "error" }),
  });

  const deleteSchool = useMutation({
    mutationFn: (school: Organization) => backendApi.adminDeleteOrganization(school.id),
    onSuccess: async () => { toast({ title: "School deleted", variant: "success" }); setConfirmDelete(null); setSelectedId(null); await refresh(); },
    onError: (error) => toast({ title: "Could not delete school", description: getErrorMessage(error, "Schools with members or curriculum cannot be deleted."), variant: "error" }),
  });

  return <>
    <AdminPageHeader eyebrow="TeachPad Platform Admin" title="Schools & Organizations" description="Onboard schools, grant curriculum access and appoint School Admins. Teachers, classes and assignments remain under each school's control." actions={<Button onClick={() => { setWizard(true); setStep(1); setForm(EMPTY_SCHOOL); }} className="rounded-xl font-bold"><Plus className="mr-1.5 h-4 w-4" />New school</Button>} />
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <MetricCard label="Schools" value={organizations.data?.total ?? "—"} icon={<Building2 className="h-4 w-4" />} />
      <MetricCard label="School Admins" value={allUsers.filter((user) => user.role === "org_admin").length} icon={<ShieldCheck className="h-4 w-4" />} tone="green" />
      <MetricCard label="Active schools" value={organizationList.filter((school) => school.status === "active").length} icon={<Users className="h-4 w-4" />} />
    </div>

    {wizard && <OnboardingWizard step={step} form={form} setForm={setForm} busy={createSchool.isPending} onBack={() => step === 1 ? setWizard(false) : setStep((value) => value - 1)} onNext={() => step < 4 ? setStep((value) => value + 1) : createSchool.mutate()} />}

    <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <AdminPanel title="Schools" description="Select a school for its support view." actions={<div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search schools" className="h-9 w-44 pl-8" /></div>}>
        {organizations.isLoading ? <LoadingState label="Loading schools" /> : organizations.isError ? <EmptyState title="Could not load schools" description={getErrorMessage(organizations.error, "Refresh and try again.")} /> : !organizationList.length ? <EmptyState title="No schools yet" description="Use New school to start guided onboarding." /> : <ul className="space-y-2">{organizationList.map((school) => {
          const count = allUsers.filter((user) => user.organization_id === school.id).length;
          const admins = allUsers.filter((user) => user.organization_id === school.id && user.role === "org_admin").length;
          return <li key={school.id}><button type="button" onClick={() => setSelectedId(school.id)} className={cn("w-full rounded-xl border p-3 text-left", selectedId === school.id ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50")}><span className="flex items-center justify-between gap-2"><b className="truncate text-sm">{school.name}</b><StatusPill status={school.status === "active" ? "success" : school.status === "suspended" ? "warning" : "neutral"}>{school.status}</StatusPill></span><span className="mt-1 block text-xs text-slate-500">{count} members · {admins ? `${admins} School Admin${admins === 1 ? "" : "s"}` : "No School Admin"}</span></button></li>;
        })}</ul>}
      </AdminPanel>

      <AdminPanel title={selected?.name ?? "School support view"} description={selected ? `Created ${formatDate(selected.created_at) || "—"}. Operational school data is read-only here.` : "Select a school on the left."} actions={selected ? <div className="flex gap-2"><Link href={`/admin/organizations/${selected.id}`} className="inline-flex h-10 items-center rounded-xl border border-input bg-background px-4 text-sm font-bold hover:bg-accent">Open details</Link><Button variant="outline" className="rounded-xl font-bold text-rose-600" onClick={() => setConfirmDelete(selected)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button></div> : null}>
        {!selected ? <EmptyState title="No school selected" description="Choose a school to inspect configuration and administrators." /> : users.isLoading ? <LoadingState label="Loading school summary" /> : <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3"><Fact label="School code" value={selected.school_code || "Not set"} /><Fact label="Board" value={selected.board || "Not set"} /><Fact label="Location" value={[selected.city, selected.state, selected.country].filter(Boolean).join(", ") || "Not set"} /><Fact label="Plan" value={`${selected.plan} · ${selected.subscription_status}`} /><Fact label="Curriculum" value={selected.curriculum_starting_point} /><Fact label="Members" value={String(members.length)} /></div>
          <section><h3 className="text-xs font-black uppercase tracking-wide text-slate-500">School Administrators</h3>{schoolAdmins.length ? <ul className="mt-2 divide-y rounded-xl border">{schoolAdmins.map((admin) => <li key={admin.id} className="p-3"><b className="block text-sm">{admin.full_name || admin.email}</b><span className="text-xs text-slate-500">{admin.email}</span></li>)}</ul> : <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No School Admin has accepted an invitation yet.</p>}</section>
          <form className="rounded-xl border border-blue-100 bg-blue-50 p-4" onSubmit={(event) => { event.preventDefault(); if (inviteEmail.trim()) inviteAdmin.mutate(); }}><h3 className="text-sm font-black text-slate-900">Invite a School Admin</h3><p className="mt-1 text-xs text-slate-600">Acceptance links the account to this school. Teacher roster management stays inside School Admin.</p><div className="mt-3 flex gap-2"><Input type="email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="school.admin@example.com" /><Button disabled={inviteAdmin.isPending}><Mail className="mr-1 h-4 w-4" />{inviteAdmin.isPending ? "Inviting…" : "Invite"}</Button></div></form>
        </div>}
      </AdminPanel>
    </div>

    {confirmDelete && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><h2 className="font-black">Delete {confirmDelete.name}?</h2><p className="mt-2 text-sm text-slate-600">Deletion is allowed only when the school has no members or curriculum records.</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="danger" disabled={deleteSchool.isPending} onClick={() => deleteSchool.mutate(confirmDelete)}>{deleteSchool.isPending ? "Deleting…" : "Delete school"}</Button></div></div></div>}
  </>;
}

function OnboardingWizard({ step, form, setForm, busy, onBack, onNext }: { step: number; form: typeof EMPTY_SCHOOL; setForm: (value: typeof EMPTY_SCHOOL) => void; busy: boolean; onBack: () => void; onNext: () => void }) {
  const set = (field: keyof typeof EMPTY_SCHOOL, value: string | boolean | string[]) => setForm({ ...form, [field]: value });
  const valid = step !== 1 || form.name.trim().length >= 2;
  return <AdminPanel className="mt-6" title={`New school · Step ${step} of 4`} description={["School information", "Plan and entitlements", "Curriculum starting point", "Initial School Admin"][step - 1]}>
    <div className="mb-5 grid grid-cols-4 gap-2">{[1, 2, 3, 4].map((value) => <span key={value} className={cn("h-1.5 rounded-full", value <= step ? "bg-blue-600" : "bg-slate-200")} />)}</div>
    {step === 1 && <div className="grid gap-3 sm:grid-cols-2"><Field label="School name" value={form.name} onChange={(value) => set("name", value)} required /><Field label="School code" value={form.school_code || ""} onChange={(value) => set("school_code", value)} /><Field label="Board" value={form.board || ""} onChange={(value) => set("board", value)} /><Field label="Country" value={form.country || ""} onChange={(value) => set("country", value)} /><Field label="State" value={form.state || ""} onChange={(value) => set("state", value)} /><Field label="City" value={form.city || ""} onChange={(value) => set("city", value)} /><Field label="Primary contact" value={form.primary_contact || ""} onChange={(value) => set("primary_contact", value)} /><Field label="Contact email" type="email" value={form.contact_email || ""} onChange={(value) => set("contact_email", value)} /></div>}
    {step === 2 && <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Plan" value={form.plan} onChange={(value) => set("plan", value)} options={["trial", "starter", "growth", "enterprise"]} /><SelectField label="Subscription status" value={form.subscription_status} onChange={(value) => set("subscription_status", value)} options={["trial", "active", "past_due", "cancelled"]} /><label className="flex items-center gap-3 rounded-xl border p-4 sm:col-span-2"><input type="checkbox" checked={form.curriculum_entitlement} onChange={(event) => set("curriculum_entitlement", event.target.checked)} /><span><b className="block text-sm">Primary curriculum entitlement</b><span className="text-xs text-slate-500">Allow this school to adopt TeachPad Master Curriculum.</span></span></label></div>}
    {step === 3 && <div className="grid gap-3 md:grid-cols-3">{[["teachpad", "Use TeachPad curriculum", "Start from published master content."], ["customize", "Customize TeachPad", "Adopt master content, then create school overrides."], ["empty", "Start empty", "Build a school-owned curriculum from scratch."]].map(([value, title, description]) => <button key={value} type="button" onClick={() => set("curriculum_starting_point", value)} className={cn("rounded-xl border p-4 text-left", form.curriculum_starting_point === value ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200")}><b className="text-sm">{title}</b><span className="mt-1 block text-xs text-slate-500">{description}</span></button>)}</div>}
    {step === 4 && <div><Field label="Initial School Admin email" type="email" value={form.initial_admin_email} onChange={(value) => set("initial_admin_email", value)} /><p className="mt-2 text-xs text-slate-500">Optional. Without an email the school remains a draft. No normal teacher account is created or assigned here.</p><div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><b>Review</b><p className="mt-1 text-slate-600">{form.name} · {form.plan} · {form.curriculum_starting_point} curriculum · {form.curriculum_entitlement ? "entitled" : "not entitled"}</p></div></div>}
    <div className="mt-6 flex justify-between"><Button type="button" variant="outline" onClick={onBack}><ChevronLeft className="mr-1 h-4 w-4" />{step === 1 ? "Cancel" : "Back"}</Button><Button type="button" disabled={!valid || busy} onClick={onNext}>{busy ? "Creating…" : step === 4 ? <><Check className="mr-1 h-4 w-4" />Create school</> : <>Continue<ChevronRight className="ml-1 h-4 w-4" /></>}</Button></div>
  </AdminPanel>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><Input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 p-3"><span className="block text-xs font-bold uppercase text-slate-400">{label}</span><b className="mt-1 block truncate text-sm capitalize">{value}</b></div>; }
