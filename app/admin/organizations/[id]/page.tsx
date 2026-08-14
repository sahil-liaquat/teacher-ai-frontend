"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { backendApi } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, MetricCard, StatusPill, formatDate } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

const TABS = ["overview", "curriculum", "teachers", "usage", "billing", "activity", "settings"] as const;

export default function SchoolSupportPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const requested = search.get("tab") ?? "overview";
  const tab = TABS.includes(requested as (typeof TABS)[number]) ? requested : "overview";
  const school = useQuery({ queryKey: ["admin-organization", id], queryFn: () => backendApi.adminOrganization(id) });
  const users = useQuery({ queryKey: ["admin-organization-users"], queryFn: () => backendApi.users(0, 500) });
  if (school.isLoading || users.isLoading) return <LoadingState label="Loading school support view" />;
  if (!school.data || school.isError || users.isError) return <EmptyState title="School could not be loaded" description="Return to Schools and try again." />;
  const members = (users.data?.items ?? []).filter((user) => user.organization_id === id);
  const admins = members.filter((user) => user.role === "org_admin");
  const teachers = members.filter((user) => user.role === "teacher");
  return <>
    <div className="mb-4"><Link href="/admin/organizations" className="text-sm font-semibold text-slate-500 hover:text-slate-900">← All schools</Link></div>
    <AdminPageHeader eyebrow="Read-only support view" title={school.data.name} description="Inspect tenant configuration and health. Teachers, classes, assignments and school curriculum are managed by this school's administrators." meta={<StatusPill status={school.data.status === "active" ? "success" : "warning"}>{school.data.status}</StatusPill>} />
    <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border bg-white p-1">{TABS.map((item) => <Link key={item} href={`/admin/organizations/${id}?tab=${item}`} className={cn("rounded-lg px-3 py-2 text-sm font-bold capitalize", tab === item ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}>{item}</Link>)}</nav>
    {tab === "overview" ? <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-4"><MetricCard label="Members" value={members.length} icon={<Users className="h-4 w-4" />} /><MetricCard label="School Admins" value={admins.length} icon={<ShieldCheck className="h-4 w-4" />} tone="green" /><MetricCard label="Teachers" value={teachers.length} icon={<GraduationCap className="h-4 w-4" />} /><MetricCard label="Curriculum access" value={school.data.curriculum_entitlement ? "Enabled" : "Disabled"} icon={<Building2 className="h-4 w-4" />} /></div><AdminPanel title="School configuration"><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Info label="Code" value={school.data.school_code} /><Info label="Board" value={school.data.board} /><Info label="Location" value={[school.data.city, school.data.state, school.data.country].filter(Boolean).join(", ")} /><Info label="Primary contact" value={school.data.primary_contact} /><Info label="Contact email" value={school.data.contact_email} /><Info label="Created" value={formatDate(school.data.created_at)} /><Info label="Plan" value={`${school.data.plan} · ${school.data.subscription_status}`} /><Info label="Curriculum start" value={school.data.curriculum_starting_point} /><Info label="Modules" value={(school.data.enabled_modules ?? []).join(", ")} /></dl></AdminPanel></div> : tab === "teachers" ? <AdminPanel title="Teachers and School Admins" description="Read-only. Staffing changes belong in the School Admin workspace.">{members.length ? <ul className="divide-y rounded-xl border">{members.map((member) => <li key={member.id} className="flex items-center justify-between gap-3 p-3"><span><b className="block text-sm">{member.full_name || member.email}</b><span className="text-xs text-slate-500">{member.email}</span></span><StatusPill status={member.role === "org_admin" ? "success" : "neutral"}>{member.role === "org_admin" ? "School Admin" : "Teacher"}</StatusPill></li>)}</ul> : <EmptyState title="No accepted members" description="Invite the initial School Admin from the Schools page." />}</AdminPanel> : <AdminPanel title={`${tab[0].toUpperCase()}${tab.slice(1)}`} description="This support tab is intentionally read-only."><EmptyState title={`No ${tab} support data yet`} description="The tenant boundary is in place; aggregate reporting can be added here without exposing school-management actions." /></AdminPanel>}
  </>;
}

function Info({ label, value }: { label: string; value?: string | null }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold capitalize text-slate-900">{value || "Not set"}</dd></div>; }
