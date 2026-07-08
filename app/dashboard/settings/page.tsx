"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, FolderOpen, KeyRound, Mail, Phone, Save, UserRound, Layout, Settings2, BarChart3, Settings } from "lucide-react";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { PastelIconTile, type PastelIconTileName } from "@/components/pastel-icon-tile";
import { ReferralCodeCard } from "@/components/influencer/referral-code-card";
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
  const [sidebarLayout, setSidebarLayout] = useState<"floating" | "expanded">("expanded");
  const [dashboardLayout, setDashboardLayout] = useState<"search-first" | "original">("search-first");
  const [activeTab, setActiveTab] = useState<"profile" | "usage" | "preferences">("profile");
  const token = typeof window !== "undefined" ? localStorage.getItem("teacher_ai_access_token") : null;

  useEffect(() => {
    const stored = localStorage.getItem("teachpad_sidebar_layout");
    if (stored === "floating") {
      setSidebarLayout("floating");
    }
    const storedDash = localStorage.getItem("teachpad_dashboard_layout");
    if (storedDash === "original") {
      setDashboardLayout("original");
    }
  }, []);

  function changeSidebarLayout(layout: "floating" | "expanded") {
    setSidebarLayout(layout);
    localStorage.setItem("teachpad_sidebar_layout", layout);
    window.dispatchEvent(new Event("teachpad_sidebar_layout_changed"));
    toast({
      title: "Sidebar layout updated",
      description: `Sidebar changed to ${layout === "expanded" ? "expanded" : "floating icon"} view.`,
      variant: "success"
    });
  }

  function changeDashboardLayout(layout: "search-first" | "original") {
    setDashboardLayout(layout);
    localStorage.setItem("teachpad_dashboard_layout", layout);
    window.dispatchEvent(new Event("teachpad_dashboard_layout_changed"));
    toast({
      title: "Dashboard layout updated",
      description: `Dashboard changed to ${layout === "search-first" ? "Search-first" : "Original"} layout view.`,
      variant: "success"
    });
  }

  const currentUser = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    retry: false,
    staleTime: Infinity
  });
  const isInfluencer = currentUser.data?.role === "influencer";
  const shouldLoadTeacherUsage = Boolean(token && currentUser.data && !isInfluencer);

  const plans = useQuery({
    queryKey: ["settings-lesson-plans-summary"],
    queryFn: () => backendApi.lessonPlans(0, 100),
    enabled: shouldLoadTeacherUsage,
    retry: false,
    staleTime: 0
  });

  const worksheets = useQuery({
    queryKey: ["settings-worksheets-summary"],
    queryFn: () => backendApi.worksheets(0, 100),
    enabled: shouldLoadTeacherUsage,
    retry: false,
    staleTime: 0
  });
  const presentations = useQuery({
    queryKey: ["settings-presentations-summary"],
    queryFn: () => backendApi.presentations(0, 100),
    enabled: shouldLoadTeacherUsage,
    retry: false,
    staleTime: 0
  });
  const notesGenerations = useQuery({
    queryKey: ["settings-notes-summary"],
    queryFn: () => backendApi.notesGenerations(0, 100),
    enabled: shouldLoadTeacherUsage,
    retry: false,
    staleTime: 0
  });
  const activities = useQuery({
    queryKey: ["settings-activities-summary"],
    queryFn: () => backendApi.activities(0, 100),
    enabled: shouldLoadTeacherUsage,
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
  const roleLabel = isInfluencer ? "Influencer" : "Teacher";
  const workspaceLabel = isInfluencer ? "Influencer portal" : "Teacher workspace";
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
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      {/* Premium Header */}
      <DashboardBannerHeader
        titleTop="Manage your"
        titleHighlight="settings"
        imageSrc="/assets/illustrations/profile-settings-header.png"
      />

      <div className="flex flex-col gap-6 lg:flex-row items-start">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-[280px] shrink-0 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <div className="hidden lg:flex items-center gap-3 px-3 py-2.5 mb-4 border-b border-slate-100 pb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Settings</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage your account</p>
            </div>
          </div>

          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 p-1 lg:p-0 border-b lg:border-0 border-slate-100 max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap lg:w-full",
                activeTab === "profile"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <UserRound className="h-4 w-4" />
              Profile & Account
            </button>
            {!isInfluencer && (
              <button
                type="button"
                onClick={() => setActiveTab("usage")}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap lg:w-full",
                  activeTab === "usage"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <BarChart3 className="h-4 w-4" />
                Monthly Usage
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap lg:w-full",
                activeTab === "preferences"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Layout className="h-4 w-4" />
              Workspace Preferences
            </button>
          </nav>
        </aside>

        {/* Tab Content Panels */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Card & Details Form */}
              <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,1.5fr)]">
                {/* Left profile info summary card */}
                <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-5 mb-5">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#ecfff7] text-[#159565] shadow-sm font-black text-xl">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-slate-900">{displayName}</h3>
                        <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{email}</p>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <AccountLine icon={<UserRound className="h-4 w-4" />} label="Role" value={roleLabel} />
                      <AccountLine icon={<Mail className="h-4 w-4" />} label="Email" value={email} />
                      <AccountLine icon={<Phone className="h-4 w-4" />} label="Mobile" value={billing?.billing_phone || "Not added"} />
                    </div>
                  </div>

                  {isInfluencer && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <ReferralCodeCard variant="compact" />
                    </div>
                  )}
                </div>

                {/* Right profile edit form */}
                <form onSubmit={submit} className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Profile Details</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Update your contact and display name settings.</p>
                    </div>
                    <Button type="submit" disabled={saving || currentUser.isLoading} className="rounded-xl px-4 py-2 font-bold text-xs">
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      {saving ? "Saving..." : "Save profile"}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <ProfileField label="Name" icon={<UserRound className="h-4 w-4" />}>
                      <Input value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} placeholder="Teacher name" className="rounded-xl border-slate-200 bg-white/50 focus-visible:ring-[#159565]" />
                    </ProfileField>
                    <ProfileField label="Mobile number" icon={<Phone className="h-4 w-4" />}>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="10-digit mobile number"
                        className="rounded-xl border-slate-200 bg-white/50 focus-visible:ring-[#159565]"
                      />
                    </ProfileField>
                  </div>
                </form>
              </div>

              {/* Password & Security Section */}
              <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-[#f8ffff] to-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                      <KeyRound className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Password</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-[500px]">
                        {resetSent ? `Reset link sent to ${email}.` : "Send a secure password reset link to your email."}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl h-11 px-5 font-bold text-xs"
                    disabled={sendingReset || currentUser.isLoading || !currentUser.data?.email}
                    onClick={sendPasswordReset}
                  >
                    <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                    {sendingReset ? "Sending..." : resetSent ? "Send again" : "Reset password"}
                  </Button>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5 grid gap-4 sm:grid-cols-3">
                  <StatusRow icon={<CheckCircle2 className="h-4 w-4" />} label="Session" value={currentUser.isLoading ? "Checking" : "Active"} />
                  <StatusRow icon={<CalendarDays className="h-4 w-4" />} label="Workspace" value={workspaceLabel} />
                  <StatusRow icon={<FolderOpen className="h-4 w-4" />} label="Library" value={`${usage.savedResources} saved`} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "usage" && !isInfluencer && (
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Monthly usage</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Generation activity for the current month.</p>
                </div>
                <div className="rounded-full bg-[#e5ffc6] px-3.5 py-1.5 text-xs font-bold text-[#3d7b0f] border border-emerald-100 shadow-sm">
                  {isLoadingUsage ? "Loading" : `${usage.total}/${usageLimit} used`}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 border border-slate-100 shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-500 transition-all duration-500" style={{ width: `${isLoadingUsage ? 0 : usage.percent}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-0.5">
                  <span>0% Used</span>
                  <span>{isLoadingUsage ? "..." : `${usage.percent}% Used`}</span>
                  <span>100% Limit ({usageLimit})</span>
                </div>
              </div>

              {/* Usage Grid Tiles */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 pt-2">
                <UsageMetric icon="bookOpen" label="Lesson plans" value={isLoadingUsage ? "..." : usage.monthlyLessons} tone="bg-[#ffdce8] text-pink-600" />
                <UsageMetric icon="clipboardList" label="Worksheets" value={isLoadingUsage ? "..." : usage.monthlyWorksheets} tone="bg-[#e5ffc6] text-emerald-700" />
                <UsageMetric icon="presentation" label="Presentations" value={isLoadingUsage ? "..." : usage.monthlyPresentations} tone="bg-[#ffe1e8] text-rose-500" />
                <UsageMetric icon="notebookPen" label="Notes" value={isLoadingUsage ? "..." : usage.monthlyNotes} tone="bg-[#f1e8ff] text-indigo-600" />
                <UsageMetric icon="sparkles" label="Activities" value={isLoadingUsage ? "..." : usage.monthlyActivities} tone="bg-[#dffafa] text-cyan-600" />
                <UsageMetric icon="folderOpen" label="Saved resources" value={isLoadingUsage ? "..." : usage.savedResources} tone="bg-[#fff0bf] text-amber-600" />
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Workspace Layout Preferences</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Personalize the styling and navigation format of your workspace.</p>
              </div>

              {/* Sidebar View */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sidebar View</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => changeSidebarLayout("floating")}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 hover:border-blue-200",
                      sidebarLayout === "floating"
                        ? "border-[#159565] bg-[#ecfff7]/30 ring-2 ring-emerald-100"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg",
                        sidebarLayout === "floating" ? "bg-[#ecfff7] text-[#159565]" : "bg-slate-50 text-slate-400"
                      )}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                      </span>
                      <span className="font-bold text-slate-800 text-sm">Floating Icons (Default)</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                      A floating, space-efficient toolbar showing icons with helper hover tooltips on the left.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => changeSidebarLayout("expanded")}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 hover:border-blue-200",
                      sidebarLayout === "expanded"
                        ? "border-[#159565] bg-[#ecfff7]/30 ring-2 ring-emerald-100"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg",
                        sidebarLayout === "expanded" ? "bg-[#ecfff7] text-[#159565]" : "bg-slate-50 text-slate-400"
                      )}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 00-4-4H3m18 0h-2a4 4 0 00-4 4v2m0-10V4m0 8h.01M9 20h6" />
                        </svg>
                      </span>
                      <span className="font-bold text-slate-800 text-sm">Expanded Sidebar</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                      A classic, docked navigation sidebar showing full text labels and the TeachPad brand header.
                    </p>
                  </button>
                </div>
              </div>

              {/* Dashboard Layout */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Dashboard Layout</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => changeDashboardLayout("search-first")}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 hover:border-blue-200",
                      dashboardLayout === "search-first"
                        ? "border-[#159565] bg-[#ecfff7]/30 ring-2 ring-emerald-100"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg",
                        dashboardLayout === "search-first" ? "bg-[#ecfff7] text-[#159565]" : "bg-slate-50 text-slate-400"
                      )}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      <span className="font-bold text-slate-800 text-sm">Search-First Dashboard (Default)</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                      Focused AI search workspace layout displaying primary search launchers and recent lists first.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => changeDashboardLayout("original")}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 hover:border-blue-200",
                      dashboardLayout === "original"
                        ? "border-[#159565] bg-[#ecfff7]/30 ring-2 ring-emerald-100"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg",
                        dashboardLayout === "original" ? "bg-[#ecfff7] text-[#159565]" : "bg-slate-50 text-slate-400"
                      )}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h3a1 1 0 011 1v6a1 1 0 01-1 1h-3a1 1 0 01-1-1v-6z" />
                        </svg>
                      </span>
                      <span className="font-bold text-slate-800 text-sm">Original Layout</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                      The classic dashboard format displaying metrics grids and action panels.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
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
