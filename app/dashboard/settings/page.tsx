"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, FolderOpen, KeyRound, Mail, Phone, Save, UserRound } from "lucide-react";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { PastelIconTile, type PastelIconTileName } from "@/components/pastel-icon-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTeacherProfile, saveTeacherProfile, TeacherProfile } from "@/lib/profile";
import { useToast } from "@/components/ui/toast";
import { backendApi, CURRENT_USER_QUERY_KEY, getCurrentUser, requestPasswordReset, type ApiUser } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useBilling, BILLING_QUERY_KEY } from "@/lib/use-billing";
import { normalizeIndianMobile } from "@/lib/phone";

const usageLimit = 100;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: billing } = useBilling();
  const [profile, setProfile] = useState<TeacherProfile>({ name: "", school: "", subjects: "" });
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("teacher_ai_access_token") : null;

  const currentUser = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    retry: false,
    staleTime: Infinity
  });

  const plans = useQuery({
    queryKey: ["settings-lesson-plans-summary"],
    queryFn: () => backendApi.lessonPlans(0, 100),
    enabled: !!token,
    retry: false,
    staleTime: 0
  });

  const worksheets = useQuery({
    queryKey: ["settings-worksheets-summary"],
    queryFn: () => backendApi.worksheets(0, 100),
    enabled: !!token,
    retry: false,
    staleTime: 0
  });
  const presentations = useQuery({
    queryKey: ["settings-presentations-summary"],
    queryFn: () => backendApi.presentations(0, 100),
    enabled: !!token,
    retry: false,
    staleTime: 0
  });
  const notesGenerations = useQuery({
    queryKey: ["settings-notes-summary"],
    queryFn: () => backendApi.notesGenerations(0, 100),
    enabled: !!token,
    retry: false,
    staleTime: 0
  });
  const activities = useQuery({
    queryKey: ["settings-activities-summary"],
    queryFn: () => backendApi.activities(0, 100),
    enabled: !!token,
    retry: false,
    staleTime: 0
  });
  useEffect(() => {
    if (!currentUser.data?.id) return;
    const savedProfile = getTeacherProfile(currentUser.data.id);
    setProfile({
      ...savedProfile,
      name: currentUser.data.full_name || currentUser.data.name || ""
    });
  }, [currentUser.data]);

  useEffect(() => {
    // Stored value is E.164 (+91XXXXXXXXXX); show the local 10 digits for editing.
    setPhone((billing?.billing_phone ?? "").replace(/^\+91/, ""));
  }, [billing?.billing_phone]);

  const usage = useMemo(() => {
    const lessonItems = plans.data?.items || [];
    const worksheetItems = worksheets.data?.items || [];
    const presentationItems = presentations.data?.items || [];
    const notesItems = notesGenerations.data?.items || [];
    const activityItems = activities.data?.items || [];
    const monthlyLessons = countItemsThisMonth(lessonItems);
    const monthlyWorksheets = countItemsThisMonth(worksheetItems);
    const monthlyPresentations = countItemsThisMonth(presentationItems);
    const monthlyNotes = countItemsThisMonth(notesItems);
    const monthlyActivities = countItemsThisMonth(activityItems);
    const total = monthlyLessons + monthlyWorksheets + monthlyPresentations + monthlyNotes + monthlyActivities;
    return {
      monthlyLessons,
      monthlyWorksheets,
      monthlyPresentations,
      monthlyNotes,
      monthlyActivities,
      total,
      savedResources: (plans.data?.total || 0) + (worksheets.data?.total || 0) + (presentations.data?.total || 0) + (notesGenerations.data?.total || 0) + (activities.data?.total || 0),
      percent: Math.min(100, Math.round((total / usageLimit) * 100))
    };
  }, [
    activities.data?.items,
    activities.data?.total,
    notesGenerations.data?.items,
    notesGenerations.data?.total,
    plans.data?.items,
    plans.data?.total,
    presentations.data?.items,
    presentations.data?.total,
    worksheets.data?.items,
    worksheets.data?.total
  ]);

  const displayName = profile.name || currentUser.data?.full_name || currentUser.data?.name || "Teacher";
  const email = currentUser.data?.email || "No email available";
  const isLoadingUsage = plans.isLoading || worksheets.isLoading || presentations.isLoading || notesGenerations.isLoading || activities.isLoading;

  function updateProfile(field: keyof TeacherProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      name: profile.name.trim(),
      school: profile.school.trim(),
      subjects: ""
    };
    if (!next.name) {
      toast({ title: "Name is required", description: "Please enter the name for this account." });
      return;
    }
    const currentUserId = currentUser.data?.id;
    if (!currentUserId) {
      toast({ title: "Could not save profile", description: "Please sign in again before updating your profile." });
      return;
    }

    // Phone is optional; if entered it must be a valid Indian mobile. Validate
    // up front so we don't half-save the profile before rejecting a bad number.
    const trimmedPhone = phone.trim();
    const normalizedPhone = trimmedPhone ? normalizeIndianMobile(trimmedPhone) : null;
    if (trimmedPhone && !normalizedPhone) {
      toast({ title: "Invalid mobile number", description: "Enter a 10-digit Indian mobile number, or leave it blank." });
      return;
    }

    setSaving(true);
    try {
      await backendApi.updateUser(currentUserId, { full_name: next.name });
      const savedUser = await getCurrentUser({ redirectOnUnauthorized: false });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, savedUser);

      const savedProfile = {
        ...next,
        name: savedUser.full_name || next.name
      };
      saveTeacherProfile(savedProfile, savedUser.id || currentUserId);
      setProfile(savedProfile);

      if (normalizedPhone && normalizedPhone !== (billing?.billing_phone ?? "")) {
        const updatedBilling = await backendApi.billingUpdatePhone(normalizedPhone);
        queryClient.setQueryData(BILLING_QUERY_KEY, updatedBilling);
      }

      toast({ title: "Profile saved", description: "Your profile details are up to date.", variant: "success" });
    } catch (error) {
      toast({ title: "Could not save profile", description: getErrorMessage(error, "Please try again."), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function sendPasswordReset() {
    const accountEmail = currentUser.data?.email;
    if (!accountEmail) {
      toast({ title: "Email unavailable", description: "Please sign in again before requesting a reset link." });
      return;
    }

    setSendingReset(true);
    try {
      const response = await requestPasswordReset(accountEmail);
      setResetSent(true);
      toast({ title: "Reset link sent", description: response.message || `Check ${accountEmail} for the reset link.`, variant: "success" });
    } catch (error) {
      toast({ title: "Could not send reset link", description: getErrorMessage(error, "Please try again."), variant: "error" });
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <DashboardBannerHeader
        titleTop="Profile and"
        titleHighlight="usage settings"
        imageSrc="/assets/illustrations/profile-settings-header.png"
      />

      <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[24px] bg-[#dffafa] shadow-[0_14px_34px_var(--teachpad-shadowToolCard)]">
              <PastelIconTile name="settings" className="h-16 w-16 rounded-[22px]" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black tracking-tight text-teachpad-ink">{displayName}</h2>
              <p className="mt-1 truncate text-sm font-semibold text-teachpad-muted">{email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <AccountLine icon={<UserRound className="h-4 w-4" />} label="Role" value="Teacher" />
            <AccountLine icon={<Mail className="h-4 w-4" />} label="Email" value={email} />
            <AccountLine icon={<Phone className="h-4 w-4" />} label="Mobile" value={billing?.billing_phone || "Not added"} />
          </div>
        </aside>

        <form onSubmit={submit} className="rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-teachpad-ink">Profile details</h2>
              <p className="mt-1 text-sm font-semibold text-teachpad-muted">These details personalize your dashboard and saved resources.</p>
            </div>
            <Button type="submit" disabled={saving || currentUser.isLoading}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save profile"}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ProfileField label="Name" icon={<UserRound className="h-4 w-4" />}>
              <Input value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} placeholder="Teacher name" />
            </ProfileField>
            <ProfileField label="Mobile number" icon={<Phone className="h-4 w-4" />}>
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="10-digit mobile number"
              />
            </ProfileField>
          </div>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-teachpad-ink">Monthly usage</h2>
              <p className="mt-1 text-sm font-semibold text-teachpad-muted">Generation activity for the current month.</p>
            </div>
            <div className="rounded-full bg-[#e5ffc6] px-3 py-1 text-sm font-black text-[#3d7b0f]">
              {isLoadingUsage ? "Loading" : `${usage.total}/${usageLimit} used`}
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-teachpad-tag">
            <div className="h-full rounded-full bg-gradient-to-r from-teachpad-blue via-[#16c5d9] to-[#8ec63f]" style={{ width: `${isLoadingUsage ? 0 : usage.percent}%` }} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <UsageMetric icon="bookOpen" label="Lesson plans" value={isLoadingUsage ? "..." : usage.monthlyLessons} tone="bg-[#ffdce8]" />
            <UsageMetric icon="clipboardList" label="Worksheets" value={isLoadingUsage ? "..." : usage.monthlyWorksheets} tone="bg-[#e5ffc6]" />
            <UsageMetric icon="presentation" label="Presentations" value={isLoadingUsage ? "..." : usage.monthlyPresentations} tone="bg-[#ffe1e8]" />
            <UsageMetric icon="notebookPen" label="Notes" value={isLoadingUsage ? "..." : usage.monthlyNotes} tone="bg-[#f1e8ff]" />
            <UsageMetric icon="sparkles" label="Activities" value={isLoadingUsage ? "..." : usage.monthlyActivities} tone="bg-[#dffafa]" />
            <UsageMetric icon="folderOpen" label="Saved resources" value={isLoadingUsage ? "..." : usage.savedResources} tone="bg-[#fff0bf]" />
          </div>
        </div>

        <div className="rounded-[24px] border border-teachpad-cardBorder bg-gradient-to-br from-[#f8ffff] to-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
          <PastelIconTile name="sparkles" className="h-14 w-14 rounded-[20px]" />
          <h2 className="mt-4 text-xl font-black tracking-tight text-teachpad-ink">Account status</h2>
          <div className="mt-4 grid gap-3">
            <StatusRow icon={<CheckCircle2 className="h-4 w-4" />} label="Session" value={currentUser.isLoading ? "Checking" : "Active"} />
            <StatusRow icon={<CalendarDays className="h-4 w-4" />} label="Plan" value="Teacher workspace" />
            <StatusRow icon={<FolderOpen className="h-4 w-4" />} label="Library" value={`${usage.savedResources} saved`} />
          </div>
          <div className="mt-5 rounded-[20px] border border-teachpad-cardBorder bg-white/82 p-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef4ff] text-teachpad-blue">
                <KeyRound className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-teachpad-ink">Password</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-teachpad-muted">
                  {resetSent ? `Reset link sent to ${email}.` : "Send a secure password reset link to your email."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-3 h-11 w-full rounded-[14px]"
              disabled={sendingReset || currentUser.isLoading || !currentUser.data?.email}
              onClick={sendPasswordReset}
            >
              <KeyRound className="h-4 w-4" />
              {sendingReset ? "Sending..." : resetSent ? "Send again" : "Reset password"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileField({ label, icon, children, className }: { label: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="flex items-center gap-2 text-sm font-black text-teachpad-ink">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-teachpad-tag text-teachpad-blue">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function AccountLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-teachpad-cardBorder bg-[#f8ffff] p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-teachpad-blue shadow-[0_8px_18px_var(--teachpad-shadowToolCard)]">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-teachpad-muted">{label}</p>
        <p className="truncate text-sm font-black text-teachpad-ink">{value}</p>
      </div>
    </div>
  );
}

function UsageMetric({ icon, label, value, tone }: { icon: PastelIconTileName; label: string; value: number | string; tone: string }) {
  return (
    <div className="rounded-[22px] border border-teachpad-cardBorder bg-white/86 p-4">
      <PastelIconTile name={icon} className={cn("h-12 w-12 rounded-2xl", tone)} />
      <p className="mt-4 text-2xl font-black text-teachpad-ink">{value}</p>
      <p className="mt-1 text-sm font-bold text-teachpad-muted">{label}</p>
    </div>
  );
}

function StatusRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-teachpad-cardBorder bg-white/82 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#dffafa] text-teachpad-blue">{icon}</span>
        <span className="text-sm font-black text-teachpad-ink">{label}</span>
      </div>
      <span className="truncate text-right text-sm font-bold text-teachpad-muted">{value}</span>
    </div>
  );
}

function countItemsThisMonth(items: any[]) {
  const now = new Date();
  return items.filter((item) => {
    const raw = item.created_at || item.updated_at;
    if (!raw) return false;
    const date = new Date(raw);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;
}
